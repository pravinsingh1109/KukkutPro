import { Router } from 'express';
import { marketPriceService } from '../services/marketPrice.service';

const router = Router();

// GET /api/market-price/today?zone=Luknow (CC)
router.get('/today', async (req, res, next) => {
  try {
    const zone = (req.query.zone as string) || 'Luknow (CC)';
    const record = await marketPriceService.getTodayPrice(zone);

    if (!record) {
      return res.status(404).json({
        error: `No market price found for zone ${zone}`,
      });
    }

    res.json({
      data: {
        id: record.id,
        date: record.date.toISOString().split('T')[0],
        zone: record.zone,
        pricePer100: parseFloat(record.pricePer100.toString()),
        pricePerEgg: parseFloat(record.pricePerEgg.toString()),
        pricePerTray: parseFloat(record.pricePerTray.toString()),
        pricePerPeti: parseFloat(record.pricePerPeti.toString()),
        source: record.source,
        rawText: record.rawText,
        updatedAt: record.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/market-price/sync (Trigger live fetch & store into DB)
router.post('/sync', async (req, res, next) => {
  try {
    const result = await marketPriceService.syncNeccPrices();
    res.json({
      success: true,
      message: `Successfully fetched and stored NECC egg prices for ${result.syncedZones} zones into database`,
      lucknowPrice: result.lucknowPrice,
      totalSynced: result.syncedZones,
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/market-price/zones (Get latest prices for all zones)
router.get('/zones', async (req, res, next) => {
  try {
    const records = await marketPriceService.getLatestZones();
    res.json({
      data: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
        zone: r.zone,
        pricePer100: parseFloat(r.pricePer100.toString()),
        pricePerEgg: parseFloat(r.pricePerEgg.toString()),
        pricePerTray: parseFloat(r.pricePerTray.toString()),
        pricePerPeti: parseFloat(r.pricePerPeti.toString()),
        source: r.source,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
