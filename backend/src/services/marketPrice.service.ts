import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export interface NeccPriceRecord {
  zone: string;
  date: string; // YYYY-MM-DD
  pricePer100: number;
  pricePerEgg: number;
  pricePerTray: number; // 30 eggs
  pricePerPeti: number; // 210 eggs
  rawText: string;
  source: string;
}

export class MarketPriceService {
  /**
   * Fetches the official NECC egg price table from e2necc.com, parses Lucknow (CC) and other zones,
   * and saves the rate into the database.
   */
  async syncNeccPrices(): Promise<{
    success: boolean;
    syncedZones: number;
    lucknowPrice?: NeccPriceRecord;
    allZones: NeccPriceRecord[];
  }> {
    const url = 'https://www.e2necc.com/home/eggprice';
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 12000,
    });

    const $ = cheerio.load(response.data);
    const today = new Date();
    const todayDay = today.getDate();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1; // 1-12

    const parsedRecords: NeccPriceRecord[] = [];

    $('table tr').each((_, tr) => {
      const tds = $(tr).find('td');
      if (tds.length >= 31) {
        const zone = $(tds[0]).text().trim();
        if (!zone || zone.includes('NECC SUGGESTED') || zone.includes('Prevailing')) return;

        // Find the price for today or the most recent available day
        let effectiveDay = todayDay;
        let valNum: number | null = null;
        let rawStr = '';

        while (effectiveDay >= 1) {
          rawStr = $(tds[effectiveDay]).text().trim();
          const num = parseFloat(rawStr);
          if (!isNaN(num) && num > 0) {
            valNum = num;
            break;
          }
          effectiveDay--;
        }

        if (valNum !== null && valNum > 0) {
          const padMonth = String(todayMonth).padStart(2, '0');
          const padDay = String(effectiveDay).padStart(2, '0');
          const dateStr = `${todayYear}-${padMonth}-${padDay}`;

          const pricePer100 = valNum;
          const pricePerEgg = parseFloat((valNum / 100).toFixed(4));
          const pricePerTray = parseFloat(((valNum / 100) * 30).toFixed(2));
          const pricePerPeti = parseFloat(((valNum / 100) * 210).toFixed(2));

          parsedRecords.push({
            zone,
            date: dateStr,
            pricePer100,
            pricePerEgg,
            pricePerTray,
            pricePerPeti,
            rawText: rawStr,
            source: 'E2NECC',
          });
        }
      }
    });

    // Save/upsert parsed prices into PostgreSQL database
    for (const record of parsedRecords) {
      const dateObj = new Date(`${record.date}T00:00:00.000Z`);
      await prisma.eggMarketPrice.upsert({
        where: {
          date_zone: {
            date: dateObj,
            zone: record.zone,
          },
        },
        create: {
          date: dateObj,
          zone: record.zone,
          pricePer100: new Prisma.Decimal(record.pricePer100),
          pricePerEgg: new Prisma.Decimal(record.pricePerEgg),
          pricePerTray: new Prisma.Decimal(record.pricePerTray),
          pricePerPeti: new Prisma.Decimal(record.pricePerPeti),
          source: record.source,
          rawText: record.rawText,
        },
        update: {
          pricePer100: new Prisma.Decimal(record.pricePer100),
          pricePerEgg: new Prisma.Decimal(record.pricePerEgg),
          pricePerTray: new Prisma.Decimal(record.pricePerTray),
          pricePerPeti: new Prisma.Decimal(record.pricePerPeti),
          rawText: record.rawText,
          updatedAt: new Date(),
        },
      });
    }

    const lucknowPrice = parsedRecords.find(
      (r) =>
        r.zone.toLowerCase().includes('luknow') ||
        r.zone.toLowerCase().includes('lucknow')
    );

    return {
      success: true,
      syncedZones: parsedRecords.length,
      lucknowPrice,
      allZones: parsedRecords,
    };
  }

  /**
   * Retrieves today's market price from DB (auto-syncs from NECC website if not found).
   */
  async getTodayPrice(zoneName = 'Luknow (CC)') {
    const today = new Date().toISOString().split('T')[0];
    const todayObj = new Date(`${today}T00:00:00.000Z`);

    // Check if we already have today's price in the database
    let priceRecord = await prisma.eggMarketPrice.findFirst({
      where: {
        zone: {
          contains: zoneName.replace(/\(.*\)/, '').trim(),
          mode: 'insensitive',
        },
        date: todayObj,
      },
      orderBy: { date: 'desc' },
    });

    // If not found in DB for today, fetch live from E2NECC
    if (!priceRecord) {
      try {
        await this.syncNeccPrices();
        priceRecord = await prisma.eggMarketPrice.findFirst({
          where: {
            zone: {
              contains: zoneName.replace(/\(.*\)/, '').trim(),
              mode: 'insensitive',
            },
          },
          orderBy: { date: 'desc' },
        });
      } catch (err) {
        console.error('Failed to sync from NECC, falling back to latest DB record:', err);
        // Fallback to latest stored record in database
        priceRecord = await prisma.eggMarketPrice.findFirst({
          where: {
            zone: {
              contains: zoneName.replace(/\(.*\)/, '').trim(),
              mode: 'insensitive',
            },
          },
          orderBy: { date: 'desc' },
        });
      }
    }

    return priceRecord;
  }

  /**
   * Gets list of all tracked zones and their latest prices.
   */
  async getLatestZones() {
    const latestDate = await prisma.eggMarketPrice.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (!latestDate) {
      await this.syncNeccPrices();
    }

    const records = await prisma.eggMarketPrice.findMany({
      where: latestDate ? { date: latestDate.date } : undefined,
      orderBy: { zone: 'asc' },
    });

    return records;
  }
}

export const marketPriceService = new MarketPriceService();
