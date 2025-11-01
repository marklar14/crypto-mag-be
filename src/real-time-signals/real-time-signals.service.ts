import { Injectable, Logger } from '@nestjs/common';
import { BybitService } from '../bybit/bybit.service';
import { BybitInstrumentsService } from '../integrations/bybit/bybit-instruments.service';
import { DynamicThresholdsService } from './dynamic-thresholds.service';
import { TickAnalysisService } from './tick-analysis.service';
import { Timeframe } from './enums/timeframe.enum';
import { TimeframeMapper } from './utils/timeframe-mapper';
import {
  RealTimeSignal,
  RealTimeSignalResponse,
  DynamicThresholds,
  TickAnalysis,
  SignalType,
} from './response/real-time-signal-response';

@Injectable()
export class RealTimeSignalsService {
  private readonly logger = new Logger(RealTimeSignalsService.name);
  private readonly MAX_INSTRUMENTS = 200;
  private readonly CONCURRENT_LIMIT = 10;

  constructor(
    private readonly bybitService: BybitService,
    private readonly bybitInstrumentsService: BybitInstrumentsService,
    private readonly dynamicThresholdsService: DynamicThresholdsService,
    private readonly tickAnalysisService: TickAnalysisService,
  ) {}

  async getRealTimeSignals(
    timeframes: Timeframe[] = [
      Timeframe.TF1M,
      Timeframe.TF5M,
      Timeframe.TF15M,
      Timeframe.TF1H,
      Timeframe.TF4H,
    ],
    threshold: number = 70,
    limit: number = 20,
    adaptiveThresholds: boolean = true,
    tickAnalysis: boolean = true,
  ): Promise<RealTimeSignalResponse> {
    const startTime = Date.now();

    this.logger.log(`Analyzing ${this.MAX_INSTRUMENTS} instruments for real-time signals`);

    const instruments = await this.bybitInstrumentsService.getInstruments();
    const limitedInstruments = instruments.slice(0, this.MAX_INSTRUMENTS);

    const tickers = await this.bybitService.getTickers(
      limitedInstruments.map((instrument) => instrument.symbol),
    );

    const signals: RealTimeSignal[] = [];
    const thresholds: { [key: string]: DynamicThresholds } = {};

    for (let i = 0; i < limitedInstruments.length; i += this.CONCURRENT_LIMIT) {
      const batch = limitedInstruments.slice(i, i + this.CONCURRENT_LIMIT);
      const batchPromises = batch.map(async (instrument) => {
        return this.processInstrument(
          instrument.symbol,
          tickers,
          timeframes,
          threshold,
          adaptiveThresholds,
          tickAnalysis,
        );
      });

      const batchResults = await Promise.all(batchPromises);
      signals.push(...batchResults.filter((signal) => signal !== null));
    }

    signals.sort((a, b) => b.confidence - a.confidence);
    const limitedSignals = signals.slice(0, limit);

    if (adaptiveThresholds) {
      for (const timeframe of timeframes) {
        try {
          const dynamicThresholds = await this.dynamicThresholdsService.calculateDynamicThresholds(
            'BTCUSDT',
            timeframe,
          );
          thresholds[timeframe] = dynamicThresholds;
        } catch (error) {
          this.logger.warn(
            `Error calculating thresholds for ${timeframe}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    }

    const scanTime = Date.now() - startTime;

    this.logger.log(`Real-time signals scan completed in ${scanTime}ms`);
    this.logger.log(`Found ${limitedSignals.length} signals above threshold ${threshold}`);

    return {
      signals: limitedSignals,
      metadata: {
        scanTime,
        totalInstruments: limitedInstruments.length,
        signalsFound: limitedSignals.length,
        thresholds,
      },
    };
  }

  private async processInstrument(
    symbol: string,
    tickers: any[],
    timeframes: Timeframe[],
    threshold: number,
    adaptiveThresholds: boolean,
    tickAnalysisEnabled: boolean,
  ): Promise<RealTimeSignal | null> {
    try {
      const ticker = tickers.find((t) => t.symbol === symbol);
      if (!ticker) {
        return null;
      }

      const signals: RealTimeSignal[] = [];

      // Process each timeframe
      for (const timeframe of timeframes) {
        const signal = await this.analyzeTimeframe(
          symbol,
          ticker,
          timeframe,
          adaptiveThresholds,
          tickAnalysisEnabled,
        );

        if (signal && signal.confidence >= threshold) {
          signals.push(signal);
        }
      }

      return signals.length > 0
        ? signals.reduce((a, b) => (a.confidence > b.confidence ? a : b))
        : null;
    } catch (error) {
      this.logger.warn(
        `Error processing instrument ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  private async analyzeTimeframe(
    symbol: string,
    ticker: any,
    timeframe: Timeframe,
    adaptiveThresholds: boolean,
    tickAnalysisEnabled: boolean,
  ): Promise<RealTimeSignal | null> {
    try {
      const bybitInterval = TimeframeMapper.toBybitInterval(timeframe);
      const candles = await this.bybitService.getCandles(symbol, bybitInterval, 100);

      if (candles.length < 10) {
        return null;
      }

      const currentPrice = parseFloat(ticker.lastPrice);
      const prevPrice = parseFloat(candles[candles.length - 2].close);
      const priceChange = ((currentPrice - prevPrice) / prevPrice) * 100;

      const currentVolume = parseFloat(ticker.volume24h);
      const avgVolume =
        candles.reduce((sum, candle) => sum + parseFloat(candle.volume), 0) / candles.length;
      const volumeChange = ((currentVolume - avgVolume) / avgVolume) * 100;

      const metrics = this.calculateMetrics(candles, currentPrice, currentVolume);
      const signalType = this.determineSignalType(priceChange, volumeChange, metrics);
      let confidence = this.calculateConfidence(priceChange, volumeChange, metrics, timeframe);

      let tickAnalysis: TickAnalysis | null = null;
      if (timeframe === Timeframe.TF1M && tickAnalysisEnabled) {
        try {
          tickAnalysis = await this.tickAnalysisService.analyzeTickData(symbol);
        } catch (error) {
          this.logger.debug(
            `Error analyzing tick data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      if (adaptiveThresholds) {
        try {
          const dynamicThresholds = await this.dynamicThresholdsService.calculateDynamicThresholds(
            symbol,
            timeframe,
          );
          confidence = this.adjustConfidenceWithThresholds(
            confidence,
            priceChange,
            volumeChange,
            dynamicThresholds,
          );
        } catch (error) {
          this.logger.debug(
            `Error applying dynamic thresholds for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      return {
        symbol,
        timeframe,
        signalType,
        confidence: Math.min(100, Math.max(0, confidence)),
        priceChange,
        volumeChange,
        metrics,
        tickAnalysis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.debug(
        `Error analyzing timeframe ${timeframe} for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof Error && error.message.includes('Failed to fetch candles')) {
        this.logger.debug(
          `Candle fetch failed for ${symbol} with timeframe ${timeframe}. This might be due to insufficient historical data.`,
          {
            symbol,
            timeframe,
            bybitInterval: TimeframeMapper.toBybitInterval(timeframe),
            error: error.message,
          },
        );
      }
      return null;
    }
  }

  private calculateMetrics(candles: any[], currentPrice: number, currentVolume: number) {
    // Calculate momentum (price velocity)
    const recentCandles = candles.slice(-5);
    const priceChanges = recentCandles.map((candle, i) => {
      if (i === 0) return 0;
      const prevClose = parseFloat(recentCandles[i - 1].close);
      const currentClose = parseFloat(candle.close);
      return ((currentClose - prevClose) / prevClose) * 100;
    });
    const momentum = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;

    const prices = candles.map((candle) => parseFloat(candle.close));
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const volatility = (Math.sqrt(variance) / mean) * 100;

    const volumes = candles.map((candle) => parseFloat(candle.volume));
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const volumeSpike = currentVolume / avgVolume;

    return {
      priceChange: Math.abs(priceChanges[priceChanges.length - 1] || 0),
      volumeSpike,
      momentum: Math.abs(momentum),
      volatility,
    };
  }

  private determineSignalType(priceChange: number, volumeChange: number, metrics: any): SignalType {
    const { momentum, volumeSpike } = metrics;

    if (priceChange > 2 && volumeChange > 50 && momentum > 1) {
      return 'pump';
    }

    // Strong dump signal
    if (priceChange < -2 && volumeChange > 50 && momentum < -1) {
      return 'dump';
    }

    // Moderate pump
    if (priceChange > 0.5 && volumeChange > 20) {
      return 'pump';
    }

    // Moderate dump
    if (priceChange < -0.5 && volumeChange > 20) {
      return 'dump';
    }

    // Sideways with high volume (accumulation/distribution)
    if (Math.abs(priceChange) < 0.5 && volumeChange > 100) {
      return 'sideways';
    }

    // Default to sideways
    return 'sideways';
  }

  private calculateConfidence(
    priceChange: number,
    volumeChange: number,
    metrics: any,
    timeframe: Timeframe,
  ): number {
    const { momentum, volatility, volumeSpike } = metrics;

    // Base confidence from price change
    let confidence = Math.min(100, Math.abs(priceChange) * 10);

    // Volume bonus
    if (volumeChange > 50) {
      confidence += 20;
    } else if (volumeChange > 20) {
      confidence += 10;
    }

    // Momentum bonus
    if (Math.abs(momentum) > 2) {
      confidence += 15;
    } else if (Math.abs(momentum) > 1) {
      confidence += 10;
    }

    // Volatility bonus (moderate volatility is good for signals)
    if (volatility > 1 && volatility < 5) {
      confidence += 10;
    }

    // Volume spike bonus
    if (volumeSpike > 3) {
      confidence += 15;
    } else if (volumeSpike > 2) {
      confidence += 10;
    }

    // Timeframe bonus (shorter timeframes get higher confidence for same moves)
    switch (timeframe) {
      case Timeframe.TF1M:
        confidence += 10;
        break;
      case Timeframe.TF5M:
        confidence += 5;
        break;
      case Timeframe.TF15M:
        confidence += 0;
        break;
      case Timeframe.TF1H:
        confidence -= 5;
        break;
      case Timeframe.TF4H:
        confidence -= 10;
        break;
    }

    // Tick analysis bonus (pro tf1m)
    if (timeframe === Timeframe.TF1M) {
      confidence += 5; // Bonus for having tick analysis available
    }

    return Math.min(100, Math.max(0, confidence));
  }

  private adjustConfidenceWithThresholds(
    confidence: number,
    priceChange: number,
    volumeChange: number,
    thresholds: DynamicThresholds,
  ): number {
    const absPriceChange = Math.abs(priceChange);
    const volumeRatio = volumeChange / 100; // Normalize to ratio

    // Adjust based on price change thresholds
    if (absPriceChange >= thresholds.priceChange.explosive) {
      confidence += 20;
    } else if (absPriceChange >= thresholds.priceChange.strong) {
      confidence += 15;
    } else if (absPriceChange >= thresholds.priceChange.significant) {
      confidence += 10;
    } else if (absPriceChange >= thresholds.priceChange.moderate) {
      confidence += 5;
    }

    // Adjust based on volume spike thresholds
    if (volumeRatio >= thresholds.volumeSpike.extreme) {
      confidence += 15;
    } else if (volumeRatio >= thresholds.volumeSpike.high) {
      confidence += 10;
    } else if (volumeRatio >= thresholds.volumeSpike.moderate) {
      confidence += 5;
    }

    return Math.min(100, Math.max(0, confidence));
  }
}
