import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, initLocalDatabase } from '../lib/db';
import { exportDexieBackup, restoreDexieBackup } from '../lib/backupSerializer';
import { useDemoStore } from '../lib/demoStore';
import {
  GoogleUserProfile,
  getCachedGoogleUser,
  requestGoogleToken,
  signOutGoogle,
} from '../lib/googleAuth';
import {
  DriveBackupFile,
  uploadBackupToDrive,
  listBackupsFromDrive,
  downloadBackupFromDrive,
  deleteBackupFromDrive,
} from '../lib/googleDrive';

const AUTO_BACKUP_KEY = 'kukkutpro_auto_backup_enabled';
const LAST_AUTO_KEY = 'kukkutpro_last_auto_backup_date';

export function useBackup() {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoStore();

  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(() => getCachedGoogleUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem(AUTO_BACKUP_KEY) !== 'false';
  });

  const toggleAutoBackup = (enabled: boolean) => {
    setIsAutoBackupEnabled(enabled);
    localStorage.setItem(AUTO_BACKUP_KEY, enabled ? 'true' : 'false');
  };

  // Sign In with Google (pure public Client ID, zero secret)
  const signIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const user = await requestGoogleToken();
      setGoogleUser(user);
      queryClient.invalidateQueries({ queryKey: ['drive-backups'] });
      return user;
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in was cancelled or failed.');
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Switch Google Account
  const switchAccount = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const user = await requestGoogleToken('select_account');
      setGoogleUser(user);
      queryClient.invalidateQueries({ queryKey: ['drive-backups'] });
      return user;
    } catch (err: any) {
      setAuthError(err?.message || 'Account switch was cancelled.');
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign Out
  const signOut = () => {
    signOutGoogle();
    setGoogleUser(null);
    queryClient.removeQueries({ queryKey: ['drive-backups'] });
  };

  // List Backups from Google Drive
  const {
    data: backups = [],
    isLoading: isBackupsLoading,
    error: backupsError,
    refetch: refetchBackups,
  } = useQuery<DriveBackupFile[]>({
    queryKey: ['drive-backups', googleUser?.id],
    queryFn: async () => {
      if (!googleUser?.accessToken) return [];
      return await listBackupsFromDrive(googleUser.accessToken);
    },
    enabled: !!googleUser?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Client-Side Backup Mutation (Dexie -> Google Drive)
  const backupMutation = useMutation({
    mutationFn: async (type: 'MANUAL' | 'AUTO' = 'MANUAL') => {
      if (isDemoMode) {
        throw new Error('Backups are disabled in Demo Mode to protect your real farm data.');
      }

      if (!googleUser?.accessToken) {
        throw new Error('Please sign in with Google to backup data to Google Drive.');
      }

      // Ensure local database is initialized
      await initLocalDatabase();

      // 1. Export real farm snapshot directly from IndexedDB (Dexie)
      const backupEnvelope = await exportDexieBackup(db);

      // 2. Upload directly to Google Drive via Drive v3 API
      const driveFile = await uploadBackupToDrive(googleUser.accessToken, backupEnvelope);

      // 3. Log backup into local Dexie database
      const realFarm = await db.farms.filter((f) => !f.isDemo).first();
      await db.backupLogs.add({
        id: `log_${Date.now()}_${Math.random()}`,
        farmId: realFarm?.id || 'real_farm_default',
        driveFileId: driveFile.id,
        fileName: driveFile.name,
        fileSizeBytes: driveFile.size,
        type,
        status: 'SUCCESS',
        recordCount: backupEnvelope.meta?.totalRecords || 0,
        createdAt: new Date().toISOString(),
      });

      return driveFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive-backups'] });
    },
  });

  // Client-Side Restore Mutation (Google Drive -> Dexie)
  const restoreMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (isDemoMode) {
        throw new Error('Cannot restore backups into Demo Mode. Switch to Real Farm first.');
      }

      if (!googleUser?.accessToken) {
        throw new Error('Google authentication required to download backup.');
      }

      // 1. Download backup file directly from Google Drive
      const backupPayload = await downloadBackupFromDrive(googleUser.accessToken, fileId);

      // 2. Restore directly into IndexedDB (Dexie) in a single atomic transaction
      const result = await restoreDexieBackup(db, backupPayload);
      return result;
    },
    onSuccess: async () => {
      // Refresh all local app state and queries
      await queryClient.invalidateQueries();
    },
  });

  // Delete Backup Mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!googleUser?.accessToken) throw new Error('Not authenticated');
      await deleteBackupFromDrive(googleUser.accessToken, fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive-backups'] });
    },
  });

  // Target 12:00 AM Daily Backup + On-Resume Missed-Backup Recovery
  const checkAndRunAutoBackup = useCallback(async () => {
    if (!isAutoBackupEnabled || !googleUser?.accessToken || isDemoMode) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastAutoBackup = localStorage.getItem(LAST_AUTO_KEY);

    // If today's backup has not run yet
    if (lastAutoBackup !== todayStr) {
      try {
        console.log('⏰ Running daily backup to Google Drive (target 12:00 AM / on-resume)...');
        await backupMutation.mutateAsync('AUTO');
        localStorage.setItem(LAST_AUTO_KEY, todayStr);
      } catch (err) {
        console.warn('Auto-backup notice (will retry on next resume):', err);
      }
    }
  }, [isAutoBackupEnabled, googleUser, isDemoMode, backupMutation]);

  useEffect(() => {
    // 1. Check on initial load
    checkAndRunAutoBackup();

    // 2. Periodic background check every 60 seconds
    const interval = setInterval(checkAndRunAutoBackup, 60000);

    // 3. On-Resume Catch-Up: When user unlocks phone or switches back to app tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRunAutoBackup();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAndRunAutoBackup]);

  return {
    googleUser,
    isConnected: !!googleUser?.accessToken,
    isLoggingIn,
    authError,
    signIn,
    switchAccount,
    signOut,

    backups,
    isBackupsLoading,
    backupsError,
    refetchBackups,

    isBackingUp: backupMutation.isPending,
    backupError: backupMutation.error,
    backupNow: () => backupMutation.mutateAsync('MANUAL'),

    isRestoring: restoreMutation.isPending,
    restoreError: restoreMutation.error,
    restoreBackup: (fileId: string) => restoreMutation.mutateAsync(fileId),

    deleteBackup: (fileId: string) => deleteMutation.mutateAsync(fileId),

    isAutoBackupEnabled,
    toggleAutoBackup,
  };
}
