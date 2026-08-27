export interface DriveBackupFile {
  id: string;
  name: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
}

const FOLDER_NAME = 'KukkutPro Backups';
const MAX_DAILY_BACKUPS = 7;

/**
 * Finds or creates the dedicated "KukkutPro Backups" folder in the user's Google Drive.
 */
export async function getOrCreateBackupFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    throw new Error(`Failed to query Google Drive folder: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Dedicated vault for KukkutPro poultry farm management backups',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive backup folder: ${createRes.statusText}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Uploads a complete backup envelope to user's Google Drive with rolling 7-day retention.
 */
export async function uploadBackupToDrive(
  accessToken: string,
  backupData: any
): Promise<DriveBackupFile> {
  const folderId = await getOrCreateBackupFolder(accessToken);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const todayStr = new Date().toISOString().split('T')[0];
  const fileName = `KukkutPro_${todayStr}.kpb`;

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
    description: `KukkutPro Poultry Farm Backup · ${backupData.meta?.totalRecords || 0} records`,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(backupData) +
    closeDelimiter;

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Drive upload failed: ${errText || uploadRes.statusText}`);
  }

  const file = await uploadRes.json();

  // Prune older backups beyond MAX_DAILY_BACKUPS (Rolling 7-day retention)
  try {
    const existingBackups = await listBackupsFromDrive(accessToken);
    if (existingBackups.length > MAX_DAILY_BACKUPS) {
      const filesToDelete = existingBackups.slice(MAX_DAILY_BACKUPS);
      for (const oldFile of filesToDelete) {
        await deleteBackupFromDrive(accessToken, oldFile.id);
      }
    }
  } catch (pruneErr) {
    console.warn('Backup pruning notice:', pruneErr);
  }

  return {
    id: file.id,
    name: file.name || fileName,
    size: JSON.stringify(backupData).length,
    createdTime: new Date().toISOString(),
    modifiedTime: new Date().toISOString(),
  };
}

/**
 * Lists existing KukkutPro backups stored in user's Google Drive.
 */
export async function listBackupsFromDrive(accessToken: string): Promise<DriveBackupFile[]> {
  const folderId = await getOrCreateBackupFolder(accessToken);
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,size,createdTime,modifiedTime)`;

  const res = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list Google Drive backups: ${res.statusText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    size: parseInt(f.size || '0', 10),
    createdTime: f.createdTime,
    modifiedTime: f.modifiedTime,
  }));
}

/**
 * Downloads a backup file's content from Google Drive for restoration.
 */
export async function downloadBackupFromDrive(accessToken: string, fileId: string): Promise<any> {
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download backup file from Google Drive: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Deletes an old backup file from Google Drive.
 */
export async function deleteBackupFromDrive(accessToken: string, fileId: string): Promise<void> {
  const deleteUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const res = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete backup from Google Drive: ${res.statusText}`);
  }
}
