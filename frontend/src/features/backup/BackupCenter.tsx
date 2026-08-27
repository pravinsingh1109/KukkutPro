import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopAppBar } from '../../components/shared/FAB';
import { useBackup } from '../../hooks/useBackup';
import { useDemoStore } from '../../lib/demoStore';
import { DriveBackupFile } from '../../lib/googleDrive';
import {
  Cloud,
  CloudUpload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  HardDrive,
  LogOut,
  UserCheck,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const BackupCenter: React.FC = () => {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoStore();
  const {
    googleUser,
    isConnected,
    isLoggingIn,
    authError,
    signIn,
    switchAccount,
    signOut,

    backups,
    isBackupsLoading,
    refetchBackups,

    isBackingUp,
    backupError,
    backupNow,

    isRestoring,
    restoreError,
    restoreBackup,

    deleteBackup,

    isAutoBackupEnabled,
    toggleAutoBackup,
  } = useBackup();

  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<DriveBackupFile | null>(null);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);

  const handleBackup = async () => {
    setBackupSuccessMessage(null);
    try {
      const file = await backupNow();
      setBackupSuccessMessage(`Backup completed successfully! Saved as "${file.name}" in Google Drive.`);
      setTimeout(() => setBackupSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    setRestoreSuccessMessage(null);
    try {
      const result = await restoreBackup(selectedBackupForRestore.id);
      setSelectedBackupForRestore(null);
      const count = result?.totalRecords ?? (result as any)?.data?.totalRecords ?? 0;
      setRestoreSuccessMessage(`Restored successfully! ${count} records reinstated.`);
      setTimeout(() => setRestoreSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async (file: DriveBackupFile) => {
    if (!window.confirm(`Are you sure you want to delete backup "${file.name}" from Google Drive?`)) {
      return;
    }
    try {
      await deleteBackup(file.id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete backup');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      <TopAppBar
        title="Google Drive Backup"
        subtitle="Local-first data with zero-cost cloud recovery"
        onBack={() => navigate(-1)}
      />

      <div className="p-4 space-y-4">
        {/* Demo Mode Guard Banner */}
        {isDemoMode && (
          <div className="p-3 bg-amber-100 border border-amber-500/30 rounded-md text-amber-900 text-body-sm flex items-start gap-2.5">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Demo Farm is Active</p>
              <p className="text-caption text-amber-800 mt-0.5">
                Cloud backups and restores are disabled in Demo Mode to protect your real farm data from contamination. Switch to Real Farm in Settings.
              </p>
            </div>
          </div>
        )}

        {/* Success Notifications */}
        {backupSuccessMessage && (
          <div className="p-3 bg-success-100 border border-success-500/20 text-success-700 rounded-md text-body-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success-600 shrink-0" />
            <span>{backupSuccessMessage}</span>
          </div>
        )}

        {restoreSuccessMessage && (
          <div className="p-3 bg-success-100 border border-success-500/20 text-success-700 rounded-md text-body-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success-600 shrink-0" />
            <span>{restoreSuccessMessage}</span>
          </div>
        )}

        {/* Error Notifications */}
        {(authError || backupError || restoreError) && (
          <div className="p-3 bg-danger-100 border border-danger-500/20 text-danger-600 rounded-md text-body-sm flex items-start gap-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>
              {authError ||
                (backupError as any)?.message ||
                (restoreError as any)?.message ||
                'An error occurred'}
            </span>
          </div>
        )}

        {/* 1. Google Account Connection Card */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-caption uppercase font-bold text-neutral-500 tracking-wider">
              Google Account Identity
            </span>
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-600 bg-success-50 px-2 py-0.5 rounded-full border border-success-200">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" /> Connected
              </span>
            )}
          </div>

          {!isConnected ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                  <Cloud size={20} />
                </div>
                <div>
                  <h4 className="text-body font-bold text-neutral-900">Zero-Cost Cloud Recovery</h4>
                  <p className="text-caption text-neutral-500 mt-0.5">
                    Connect your Google Account to save automated backups directly to your personal Google Drive (in a private <code>KukkutPro Backups</code> vault).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={signIn}
                disabled={isLoggingIn}
                className="w-full h-11 bg-white hover:bg-neutral-50 border border-neutral-300 active:scale-95 text-neutral-800 font-semibold text-body-sm rounded-md shadow-xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw size={16} className="animate-spin text-brand-500" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                {googleUser?.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="w-10 h-10 rounded-full border border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold">
                    {googleUser?.name?.charAt(0) || 'G'}
                  </div>
                )}
                <div className="overflow-hidden flex-1">
                  <p className="text-body font-bold text-neutral-900 truncate">{googleUser?.name}</p>
                  <p className="text-caption text-neutral-500 truncate">{googleUser?.email}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={switchAccount}
                  className="flex-1 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 rounded text-caption font-semibold text-neutral-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <UserCheck size={14} /> Switch Account
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="py-1.5 px-3 bg-neutral-100 hover:bg-danger-50 hover:text-danger-600 rounded text-caption font-semibold text-neutral-600 flex items-center justify-center gap-1 transition-colors"
                >
                  <LogOut size={14} /> Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Backup Controls Card */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-caption uppercase font-bold text-neutral-500 tracking-wider">
              Backup Controls
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">Local-first engine</span>
          </div>

          {/* Auto-Backup Toggle */}
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-md border border-neutral-200">
            <div>
              <p className="text-body-sm font-bold text-neutral-900">Daily Auto-Backup (12:00 AM)</p>
              <p className="text-caption text-neutral-500">
                Silently uploads a fresh snapshot to your Google Drive every midnight.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={isAutoBackupEnabled}
                onChange={(e) => toggleAutoBackup(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

          {/* Backup Now Button */}
          <button
            type="button"
            onClick={handleBackup}
            disabled={!isConnected || isBackingUp || isDemoMode}
            className="w-full h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-body rounded-md shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isBackingUp ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Creating Cloud Backup...</span>
              </>
            ) : (
              <>
                <CloudUpload size={20} />
                <span>Backup Now to Google Drive</span>
              </>
            )}
          </button>
        </div>

        {/* 3. Google Drive Backups Vault (Restore List) */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
            <div>
              <h3 className="text-body font-bold text-neutral-900">Google Drive Backups</h3>
              <p className="text-caption text-neutral-500">Available recovery points</p>
            </div>
            <button
              type="button"
              onClick={() => refetchBackups()}
              disabled={!isConnected || isBackupsLoading}
              title="Refresh backups from Drive"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded disabled:opacity-40"
            >
              <RefreshCw size={16} className={isBackupsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {!isConnected ? (
            <div className="text-center py-6 text-neutral-400 space-y-1.5">
              <Lock size={24} className="mx-auto text-neutral-300" />
              <p className="text-body-sm font-medium">Connect Google Drive to view cloud backups</p>
            </div>
          ) : isBackupsLoading ? (
            <div className="text-center py-6 text-neutral-400 space-y-2">
              <RefreshCw size={20} className="animate-spin mx-auto text-brand-500" />
              <p className="text-caption">Scanning your Google Drive folder...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-6 text-neutral-400 space-y-1.5">
              <HardDrive size={24} className="mx-auto text-neutral-300" />
              <p className="text-body-sm font-medium">No backups found in Google Drive</p>
              <p className="text-caption">Tap "Backup Now" to create your first cloud snapshot.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {backups.map((file) => {
                const dateDisplay = new Date(file.createdTime).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const sizeKb = (file.size / 1024).toFixed(1);

                return (
                  <div key={file.id} className="py-3 flex items-center justify-between">
                    <div className="overflow-hidden pr-2">
                      <p className="text-body-sm font-bold text-neutral-900 truncate">
                        {dateDisplay}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {file.name} · {sizeKb} KB
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedBackupForRestore(file)}
                        disabled={isRestoring || isDemoMode}
                        className="px-2.5 py-1 bg-neutral-100 hover:bg-brand-50 hover:text-brand-600 active:scale-95 text-neutral-700 text-caption font-bold rounded border border-neutral-200 transition-colors disabled:opacity-40"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        title="Delete from Drive"
                        className="p-1 text-neutral-400 hover:text-danger-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Architecture & Security Reassurance Card */}
        <div className="p-3.5 bg-neutral-100/70 rounded-md border border-neutral-200 text-caption text-neutral-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-neutral-800">
            <ShieldCheck size={16} className="text-success-600 shrink-0" />
            <span>Local-First Architecture & Privacy Guarantee</span>
          </div>
          <p>
            • All farm operational data is saved <strong>locally on your device</strong>. No internet is required to record egg production or customer sales.
          </p>
          <p>
            • Google Drive is used purely as your <strong>personal backup vault</strong>. KukkutPro cannot read your personal photos, emails, or personal Drive documents.
          </p>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-danger-600">
              <AlertTriangle size={24} />
              <h3 className="text-heading-3 font-bold">Confirm Data Restore</h3>
            </div>

            <p className="text-body-sm text-neutral-700">
              Restoring backup <strong>"{selectedBackupForRestore.name}"</strong> will replace current real farm records on this phone with data from this snapshot.
            </p>

            <div className="p-3 bg-neutral-100 rounded text-caption text-neutral-600">
              <p className="font-semibold text-neutral-800">Backup Point:</p>
              <p>{new Date(selectedBackupForRestore.createdTime).toLocaleString('en-IN')}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBackupForRestore(null)}
                disabled={isRestoring}
                className="flex-1 py-2.5 rounded border border-neutral-300 text-neutral-700 font-semibold text-body-sm hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex-1 py-2.5 rounded bg-danger-500 hover:bg-danger-600 text-white font-bold text-body-sm shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <span>Yes, Restore Data</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
