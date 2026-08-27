import { Router } from 'express';
import { backupService } from '../services/backup.service';

const router = Router();

// GET /api/backup/export
router.get('/export', async (req, res, next) => {
  try {
    const isDemo = req.isDemo;
    if (isDemo) {
      return res.status(403).json({
        error: 'Backups are disabled in Demo Mode. Switch to your Real Farm to generate a backup.',
        code: 'DEMO_MODE_RESTRICTED',
      });
    }

    const envelope = await backupService.exportRealFarmBackup(req.farmId);
    res.json({
      data: envelope,
      message: 'Backup generated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/backup/restore
router.post('/restore', async (req, res, next) => {
  try {
    const isDemo = req.isDemo;
    if (isDemo) {
      return res.status(403).json({
        error: 'Cannot restore backups into Demo Mode. Switch to your Real Farm to perform a restore.',
        code: 'DEMO_MODE_RESTRICTED',
      });
    }

    const backupEnvelope = req.body;
    if (!backupEnvelope || typeof backupEnvelope !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body. Expected a KukkutPro backup envelope object.',
      });
    }

    const result = await backupService.restoreRealFarmBackup(req.farmId, backupEnvelope);

    // Also log this restore action
    await backupService.logBackupActivity({
      farmId: req.farmId,
      fileName: `Restored snapshot (${result.restoredAt})`,
      fileSizeBytes: JSON.stringify(backupEnvelope).length,
      type: 'MANUAL',
      status: 'SUCCESS',
      recordCount: result.totalRecords,
    });

    res.json({
      success: true,
      data: result,
      message: `Successfully restored farm data (${result.totalRecords} records restored)`,
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/backup/history
router.get('/history', async (req, res, next) => {
  try {
    const logs = await backupService.getBackupHistory(req.farmId);
    res.json({ data: logs });
  } catch (error) {
    next(error);
  }
});

// POST /api/backup/log
router.post('/log', async (req, res, next) => {
  try {
    const { driveFileId, fileName, fileSizeBytes, type, status, recordCount } = req.body;
    const log = await backupService.logBackupActivity({
      farmId: req.farmId,
      driveFileId,
      fileName,
      fileSizeBytes,
      type: type || 'MANUAL',
      status: status || 'SUCCESS',
      recordCount: recordCount || 0,
    });

    res.status(201).json({ data: log });
  } catch (error) {
    next(error);
  }
});

export default router;
