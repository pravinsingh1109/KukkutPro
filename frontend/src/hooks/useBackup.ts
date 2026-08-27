import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
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

  // Sign In with Google
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

  // Manual / Auto Backup Mutation
  const backupMutation = useMutation({
    mutationFn: async (type: 'MANUAL' | 'AUTO' = 'MANUAL') => {
      if (isDemoMode) {
        throw new Error('Backups are disabled in Demo Mode to protect your real farm data.');
      }

      if (!googleUser?.accessToken) {
        throw new Error('Please sign in with Google to backup data to Google Drive.');
      }

      // 1. Export real farm snapshot from local backend
      const exportRes = await api.get('/backup/export');
      const backupEnvelope = exportRes.data.data;

      // 2. Generate descriptive filename
      const nowStr = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `KukkutPro_Backup_${nowStr}.json`;

      // 3. Upload to Google Drive
      const driveFile = await uploadBackupToDrive(googleUser.accessToken, backupEnvelope, fileName);

      // 4. Log backup into local DB
      await api.post('/backup/log', {
        driveFileId: driveFile.id,
        fileName: driveFile.name,
        fileSizeBytes: driveFile.size,
        type,
        status: 'SUCCESS',
        recordCount: backupEnvelope.meta?.totalRecords || 0,
      });

      return driveFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive-backups'] });
    },
  });

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (isDemoMode) {
        throw new Error('Cannot restore backups into Demo Mode. Switch to Real Farm first.');
      }

      if (!googleUser?.accessToken) {
        throw new Error('Google authentication required to download backup.');
      }

      // 1. Download backup file from Google Drive
      const backupPayload = await downloadBackupFromDrive(googleUser.accessToken, fileId);

      // 2. Send to backend restore endpoint
      const restoreRes = await api.post('/backup/restore', backupPayload);
      return restoreRes.data;
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

  // Automated 12:00 AM Daily Backup Routine
  const runAutoBackupCheck = useCallback(async () => {
    if (!isAutoBackupEnabled || !googleUser?.accessToken || isDemoMode) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastAutoBackup = localStorage.getItem(LAST_AUTO_KEY);

    if (lastAutoBackup !== todayStr) {
      try {
        console.log('⏰ Executing scheduled daily backup to Google Drive...');
        await backupMutation.mutateAsync('AUTO');
        localStorage.setItem(LAST_AUTO_KEY, todayStr);
      } catch (err) {
        console.warn('Daily auto-backup deferred or failed:', err);
      }
    }
  }, [isAutoBackupEnabled, googleUser, isDemoMode, backupMutation]);

  useEffect(() => {
    // Check on mount and periodically every 60 seconds
    runAutoBackupCheck();
    const interval = setInterval(runAutoBackupCheck, 60000);
    return () => clearInterval(interval);
  }, [runAutoBackupCheck]);

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
