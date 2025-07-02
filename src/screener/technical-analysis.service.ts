import { Injectable } from '@nestjs/common';

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Injectable()
export class TechnicalAnalysisService {
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 0;

    let gains = 0;
    let losses = 0;

    // Calculate initial gains and losses
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for the most recent period
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
      }
    }

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
  ): { macd: number; signal: number; histogram: number } {
    if (prices.length < slowPeriod + signalPeriod) return { macd: 0, signal: 0, histogram: 0 };

    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);
    const macd = ema12 - ema26;

    // Calculate MACD line (EMA of MACD)
    const macdLine = this.calculateEMA(
      [...Array(slowPeriod - fastPeriod).fill(0), macd],
      signalPeriod,
    );
    const signal = macdLine;
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (highs.length < period + 1) return 0;

    const trueRanges: number[] = [];
    const directionalMoves: { plus: number; minus: number }[] = [];

    for (let i = 1; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1]),
      );
      trueRanges.push(tr);

      const plusDM =
        highs[i] - highs[i - 1] > lows[i - 1] - lows[i] && highs[i] - highs[i - 1] > 0
          ? highs[i] - highs[i - 1]
          : 0;
      const minusDM =
        lows[i - 1] - lows[i] > highs[i] - highs[i - 1] && lows[i - 1] - lows[i] > 0
          ? lows[i - 1] - lows[i]
          : 0;

      directionalMoves.push({ plus: plusDM, minus: minusDM });
    }

    // Calculate smoothed values
    let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0);
    let plusDI = directionalMoves.slice(0, period).reduce((sum, dm) => sum + dm.plus, 0);
    let minusDI = directionalMoves.slice(0, period).reduce((sum, dm) => sum + dm.minus, 0);

    // Calculate final ADX
    const smoothingFactor = 1 / period;
    for (let i = period; i < trueRanges.length; i++) {
      atr = (atr * (period - 1) + trueRanges[i]) / period;
      plusDI = (plusDI * (period - 1) + directionalMoves[i].plus) / period;
      minusDI = (minusDI * (period - 1) + directionalMoves[i].minus) / period;
    }

    const plusDIPercent = (plusDI / atr) * 100;
    const minusDIPercent = (minusDI / atr) * 100;
    const dx = (Math.abs(plusDIPercent - minusDIPercent) / (plusDIPercent + minusDIPercent)) * 100;

    return dx;
  }

  calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2,
  ): { upper: number; middle: number; lower: number; width: number } {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0, width: 0 };

    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;

    const variance =
      recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    const upper = sma + standardDeviation * stdDev;
    const lower = sma - standardDeviation * stdDev;
    const width = (upper - lower) / sma;

    return { upper, middle: sma, lower, width };
  }

  calculateVolumeSpike(volumes: number[], period: number = 20): number {
    if (volumes.length < period) return 0;

    const recentVolumes = volumes.slice(-period);
    const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / period;
    const currentVolume = volumes[volumes.length - 1];

    return currentVolume / avgVolume;
  }

  isAboveEMA(prices: number[], period: number = 200): boolean {
    if (prices.length < period) return false;

    const ema = this.calculateEMA(prices, period);
    const currentPrice = prices[prices.length - 1];

    return currentPrice > ema;
  }

  detectBreakout(
    highs: number[],
    lows: number[],
    closes: number[],
    volumes: number[],
    period: number = 20,
  ): { isBreakout: boolean; isBreakdown: boolean } {
    if (highs.length < period) return { isBreakout: false, isBreakdown: false };

    // Find key support and resistance levels
    const levels = this.findKeyLevels(highs, lows, closes, period);

    if (levels.resistance.length === 0 && levels.support.length === 0) {
      return { isBreakout: false, isBreakdown: false };
    }

    const currentClose = closes[closes.length - 1];
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = this.calculateAverageVolume(volumes, period);

    // Check for breakout with confirmation - relaxed conditions
    const isBreakout = levels.resistance.some((level) => {
      const volumeOk = currentVolume > avgVolume * 1.1;
      const closeOk = currentClose > level.price;
      const confirmationOk = this.hasConfirmation(closes, level.price, 1, 'above');

      return closeOk && volumeOk && confirmationOk;
    });

    // Check for breakdown with confirmation - relaxed conditions
    const isBreakdown = levels.support.some((level) => {
      const volumeOk = currentVolume > avgVolume * 1.1;
      const closeOk = currentClose < level.price;
      const confirmationOk = this.hasConfirmation(closes, level.price, 1, 'below');

      return closeOk && volumeOk && confirmationOk;
    });

    return { isBreakout, isBreakdown };
  }

  private findKeyLevels(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number,
  ): {
    resistance: Array<{ price: number; strength: number }>;
    support: Array<{ price: number; strength: number }>;
  } {
    const resistance: Array<{ price: number; strength: number }> = [];
    const support: Array<{ price: number; strength: number }> = [];

    // Find local highs and lows
    for (let i = 2; i < highs.length - 2; i++) {
      // Resistance level (local high)
      if (
        highs[i] > highs[i - 1] &&
        highs[i] > highs[i - 2] &&
        highs[i] > highs[i + 1] &&
        highs[i] > highs[i + 2]
      ) {
        const strength = this.calculateLevelStrength(
          highs,
          lows,
          closes,
          highs[i],
          i,
          'resistance',
        );
        if (strength > 0.3) {
          resistance.push({ price: highs[i], strength });
        }
      }

      // Support level (local low)
      if (
        lows[i] < lows[i - 1] &&
        lows[i] < lows[i - 2] &&
        lows[i] < lows[i + 1] &&
        lows[i] < lows[i + 2]
      ) {
        const strength = this.calculateLevelStrength(highs, lows, closes, lows[i], i, 'support');
        if (strength > 0.3) {
          support.push({ price: lows[i], strength });
        }
      }
    }

    // Sort by strength and remove duplicates
    resistance.sort((a, b) => b.strength - a.strength);
    support.sort((a, b) => b.strength - a.strength);

    // Remove levels that are too close to each other (within 1% of price)
    const filteredResistance = this.filterNearbyLevels(resistance);
    const filteredSupport = this.filterNearbyLevels(support);

    return {
      resistance: filteredResistance.slice(0, 3), // Top 3 resistance levels
      support: filteredSupport.slice(0, 3), // Top 3 support levels
    };
  }

  private calculateLevelStrength(
    highs: number[],
    lows: number[],
    closes: number[],
    levelPrice: number,
    levelIndex: number,
    type: 'resistance' | 'support',
  ): number {
    let touches = 0;
    let bounces = 0;
    const tolerance = levelPrice * 0.005; // 0.5% tolerance

    // Check how many times price touched this level
    for (let i = Math.max(0, levelIndex - 20); i < Math.min(highs.length, levelIndex + 20); i++) {
      if (type === 'resistance') {
        if (Math.abs(highs[i] - levelPrice) <= tolerance) {
          touches++;
          // Check if price bounced back (closed below the level)
          if (i < closes.length && closes[i] < levelPrice - tolerance) {
            bounces++;
          }
        }
      } else {
        if (Math.abs(lows[i] - levelPrice) <= tolerance) {
          touches++;
          // Check if price bounced back (closed above the level)
          if (i < closes.length && closes[i] > levelPrice + tolerance) {
            bounces++;
          }
        }
      }
    }

    // Calculate strength based on touches and successful bounces
    if (touches === 0) return 0;
    return (bounces / touches) * (touches / 10); // Normalize by touches
  }

  private filterNearbyLevels(
    levels: Array<{ price: number; strength: number }>,
  ): Array<{ price: number; strength: number }> {
    const filtered: Array<{ price: number; strength: number }> = [];

    for (const level of levels) {
      const isNearby = filtered.some(
        (existing) => Math.abs(existing.price - level.price) / level.price < 0.01, // Within 1%
      );

      if (!isNearby) {
        filtered.push(level);
      }
    }

    return filtered;
  }

  private hasConfirmation(
    closes: number[],
    levelPrice: number,
    requiredCandles: number,
    direction: 'above' | 'below',
  ): boolean {
    if (closes.length < requiredCandles) return false;

    const tolerance = levelPrice * 0.005; // 0.5% tolerance for confirmation - relaxed from 0.002

    for (let i = closes.length - requiredCandles; i < closes.length; i++) {
      if (direction === 'above') {
        if (closes[i] <= levelPrice + tolerance) {
          return false; // Not confirmed above
        }
      } else {
        if (closes[i] >= levelPrice - tolerance) {
          return false; // Not confirmed below
        }
      }
    }

    return true;
  }

  private calculateAverageVolume(volumes: number[], period: number): number {
    const recentVolumes = volumes.slice(-period);
    return recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
  }
}
