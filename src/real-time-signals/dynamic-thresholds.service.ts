import { Injectable } from '@nestjs/common';
import { BybitService } from '../bybit/bybit.service';
import { DynamicThresholds } from './response/real-time-signal-response';
import { Timeframe } from './enums/timeframe.enum';
import { TimeframeMapper } from './utils/timeframe-mapper';

@Injectable()
export class DynamicThresholdsService {
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minut
  private thresholdsCache: Map<string, { data: DynamicThresholds; timestamp: number }> = new Map();

  constructor(private readonly bybitService: BybitService) {}

  async calculateDynamicThresholds(
    symbol: string,
    timeframe: Timeframe = Timeframe.TF1M,
  ): Promise<DynamicThresholds> {
    const cacheKey = `thresholds_${symbol}_${timeframe}`;
    const cached = this.thresholdsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Načteme historická data pro výpočet thresholdů
      const bybitInterval = TimeframeMapper.toBybitInterval(timeframe);
      const candles = await this.bybitService.getCandles(symbol, bybitInterval, 1000);

      if (candles.length < 100) {
        throw new Error(`Insufficient historical data for ${symbol}`);
      }

      // Vypočítáme cenové změny a volume spike'y
      const priceChanges: number[] = [];
      const volumeSpikes: number[] = [];
      const volumes: number[] = [];

      for (let i = 1; i < candles.length; i++) {
        const prevClose = parseFloat(candles[i - 1].close);
        const currentClose = parseFloat(candles[i].close);
        const priceChange = ((currentClose - prevClose) / prevClose) * 100;

        priceChanges.push(Math.abs(priceChange));

        const volume = parseFloat(candles[i].volume);
        volumes.push(volume);
      }

      // Vypočítáme průměrný volume pro detekci spike'ů
      const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;

      for (let i = 0; i < candles.length; i++) {
        const volume = parseFloat(candles[i].volume);
        const volumeSpike = volume / avgVolume;
        volumeSpikes.push(volumeSpike);
      }

      // Seřadíme data pro výpočet percentilů
      priceChanges.sort((a, b) => a - b);
      volumeSpikes.sort((a, b) => a - b);

      // Vypočítáme thresholdy na základě percentilů
      const thresholds: DynamicThresholds = {
        priceChange: {
          moderate: this.getPercentile(priceChanges, 70),
          significant: this.getPercentile(priceChanges, 85),
          strong: this.getPercentile(priceChanges, 90),
          explosive: this.getPercentile(priceChanges, 95),
        },
        volumeSpike: {
          moderate: this.getPercentile(volumeSpikes, 70),
          high: this.getPercentile(volumeSpikes, 85),
          extreme: this.getPercentile(volumeSpikes, 95),
        },
        percentiles: {
          priceChange: priceChanges,
          volumeSpike: volumeSpikes,
        },
      };

      // Uložíme do cache
      this.thresholdsCache.set(cacheKey, {
        data: thresholds,
        timestamp: Date.now(),
      });

      console.log(`Calculated dynamic thresholds for ${symbol}:`, {
        priceChange: thresholds.priceChange,
        volumeSpike: thresholds.volumeSpike,
      });

      return thresholds;
    } catch (error) {
      console.error(`Error calculating dynamic thresholds for ${symbol}:`, error);

      // Fallback na defaultní thresholdy
      return {
        priceChange: {
          moderate: 0.5,
          significant: 1.0,
          strong: 2.0,
          explosive: 5.0,
        },
        volumeSpike: {
          moderate: 1.5,
          high: 2.5,
          extreme: 5.0,
        },
        percentiles: {
          priceChange: [],
          volumeSpike: [],
        },
      };
    }
  }

  calculateThresholdPercentile(value: number, percentiles: number[]): number {
    if (percentiles.length === 0) return 0;

    // Seřadíme percentily pro správný výpočet
    const sortedPercentiles = [...percentiles].sort((a, b) => a - b);

    // Najdeme pozici hodnoty v seřazeném poli
    let position = 0;
    for (let i = 0; i < sortedPercentiles.length; i++) {
      if (value <= sortedPercentiles[i]) {
        position = i;
        break;
      }
    }

    // Pokud je hodnota větší než všechny percentily, vrátíme 100
    if (value > sortedPercentiles[sortedPercentiles.length - 1]) {
      return 100;
    }

    // Vrátíme percentil (0-100)
    return (position / sortedPercentiles.length) * 100;
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.floor((percentile / 100) * (sortedArray.length - 1));
    return sortedArray[index] || 0;
  }

  clearCache(): void {
    this.thresholdsCache.clear();
  }
}
