import { Injectable } from '@nestjs/common';
import { BybitService } from '../bybit/bybit.service';
import {
  BybitInstrumentsService,
  BybitInstrument,
} from '../integrations/bybit/bybit-instruments.service';
import { TechnicalAnalysisService, CandleData } from './technical-analysis.service';
import { SignalDescriptionService, SignalContext } from './signal-description.service';
import { MultiTimeframeData } from './response/multi-timeframe-data';
import { PaginatedScreenerResponse } from './response/paginated-screener-response';
import { ScreenerResultResponse } from './response/screener-result-response';
import { ScreenerSetupResponse, ScreenerSetup } from './response/screener-setup-response';

@Injectable()
export class ScreenerService {
  private readonly MAX_INSTRUMENTS = 500;
  private readonly CONCURRENT_LIMIT = 10;
  private readonly CACHE_DURATION = 5 * 60 * 1000;
  private screenerCache: { [key: string]: { data: MultiTimeframeData[]; timestamp: number } } = {};

  constructor(
    private readonly bybitService: BybitService,
    private readonly bybitInstrumentsService: BybitInstrumentsService,
    private readonly technicalAnalysis: TechnicalAnalysisService,
    private readonly signalDescriptionService: SignalDescriptionService,
  ) {}

  async evaluateAll(filterValid: boolean = true): Promise<MultiTimeframeData[]> {
    // Check cache first
    const cacheKey = `screener_${filterValid}`;
    const cached = this.screenerCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Returning cached screener results');
      return cached.data;
    }

    // Step 1: Get all available trading instruments
    const instruments = await this.bybitInstrumentsService.getInstruments();

    // Filter for USDT pairs and limit to configured maximum
    const usdtInstruments = instruments
      .filter((instrument) => instrument.quoteCoin === 'USDT')
      .slice(0, this.MAX_INSTRUMENTS);

    console.log(
      `Processing ${usdtInstruments.length} instruments with ${this.CONCURRENT_LIMIT} concurrent limit`,
    );

    // Step 2: Process instruments in parallel batches
    const results = await this.processInstrumentsInBatches(usdtInstruments, filterValid);

    // Step 3: Sort results by market cap (highest first)
    const sortedResults = results.sort((a, b) => {
      const marketCapA = this.getHighestMarketCap(a);
      const marketCapB = this.getHighestMarketCap(b);
      return marketCapB - marketCapA; // Descending order
    });

    // Cache the results
    this.screenerCache[cacheKey] = {
      data: sortedResults,
      timestamp: Date.now(),
    };

    console.log(`Screener completed: ${sortedResults.length} valid results`);
    return sortedResults;
  }

  async evaluateAllPaginated(
    filterValid: boolean = true,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedScreenerResponse> {
    // Check cache first
    const cacheKey = `screener_${filterValid}`;
    const cached = this.screenerCache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Returning cached paginated screener results');
      const total = cached.data.length;
      const totalPages = Math.ceil(total / limit);
      const validPage = Math.max(1, Math.min(page, totalPages));
      const startIndex = (validPage - 1) * limit;
      const endIndex = startIndex + limit;

      console.log(
        `Cached pagination: page ${validPage}/${totalPages}, showing ${startIndex}-${endIndex} of ${total}`,
      );

      return {
        data: cached.data.slice(startIndex, endIndex),
        pagination: {
          page: validPage,
          limit,
          total,
          totalPages,
          hasNext: validPage < totalPages,
          hasPrev: validPage > 1,
        },
      };
    }

    // If not cached, process all instruments to get accurate pagination
    return this.processPaginatedResults(filterValid, page, limit);
  }

  // New method to get all results without filtering (for debugging)
  async getAllResultsUnfiltered(
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedScreenerResponse> {
    console.log('Getting all results without filtering...');

    // Get instruments
    const instruments = await this.bybitInstrumentsService.getInstruments();
    const usdtInstruments = instruments
      .filter((instrument) => instrument.quoteCoin === 'USDT')
      .slice(0, this.MAX_INSTRUMENTS);

    console.log(`Processing ${usdtInstruments.length} instruments without filtering`);

    // Process all instruments without filtering
    const results = await this.processInstrumentsInBatches(usdtInstruments, false);

    console.log(`Total results without filtering: ${results.length}`);

    // Sort by market cap
    const sortedResults = results.sort((a, b) => {
      const marketCapA = this.getHighestMarketCap(a);
      const marketCapB = this.getHighestMarketCap(b);
      return marketCapB - marketCapA;
    });

    // Calculate pagination
    const total = sortedResults.length;
    const totalPages = Math.ceil(total / limit);
    const validPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (validPage - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      data: sortedResults.slice(startIndex, endIndex),
      pagination: {
        page: validPage,
        limit,
        total,
        totalPages,
        hasNext: validPage < totalPages,
        hasPrev: validPage > 1,
      },
    };
  }

  private async processPaginatedResults(
    filterValid: boolean = true,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedScreenerResponse> {
    // Get instruments
    const instruments = await this.bybitInstrumentsService.getInstruments();
    const usdtInstruments = instruments
      .filter((instrument) => instrument.quoteCoin === 'USDT')
      .slice(0, this.MAX_INSTRUMENTS);

    console.log(`Total USDT instruments available: ${usdtInstruments.length}`);

    // For accurate pagination, we need to process ALL instruments to get the total count
    // But we can optimize by processing in batches and caching the results
    console.log(`Processing all ${usdtInstruments.length} instruments for accurate pagination`);

    // Process all instruments in batches
    const allResults = await this.processInstrumentsInBatches(usdtInstruments, filterValid);

    console.log(`Total valid results after processing all instruments: ${allResults.length}`);

    // Sort by market cap
    const sortedResults = allResults.sort((a, b) => {
      const marketCapA = this.getHighestMarketCap(a);
      const marketCapB = this.getHighestMarketCap(b);
      return marketCapB - marketCapA;
    });

    // Calculate pagination based on ALL results
    const total = sortedResults.length;
    const totalPages = Math.ceil(total / limit);
    const validPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (validPage - 1) * limit;
    const endIndex = startIndex + limit;

    console.log(
      `Pagination: page ${validPage}/${totalPages}, showing ${startIndex}-${endIndex} of ${total}`,
    );

    // Cache the results for future use
    this.screenerCache[`screener_${filterValid}`] = {
      data: sortedResults,
      timestamp: Date.now(),
    };

    return {
      data: sortedResults.slice(startIndex, endIndex),
      pagination: {
        page: validPage,
        limit,
        total,
        totalPages,
        hasNext: validPage < totalPages,
        hasPrev: validPage > 1,
      },
    };
  }

  private hasValidData(data: MultiTimeframeData): boolean {
    // Check if at least one timeframe has meaningful data
    const timeframes = [data.tf5m, data.tf15m, data.tf1h, data.tf1d];

    const hasValidTimeframe = timeframes.some((tf) => {
      // Check if the timeframe has valid price data, technical indicators, and market cap data
      const isValid =
        tf.lastPrice !== null &&
        tf.lastPrice !== undefined &&
        tf.lastPrice > 0 &&
        tf.previousPrice !== null &&
        tf.previousPrice !== undefined &&
        tf.previousPrice > 0 &&
        tf.rsi !== null &&
        tf.rsi !== undefined &&
        tf.rsi > 0 && // RSI should be greater than 0
        tf.macdHist !== null &&
        tf.macdHist !== undefined &&
        tf.adx !== null &&
        tf.adx !== undefined &&
        tf.adx > 0 && // ADX should be greater than 0
        tf.bbWidth !== null &&
        tf.bbWidth !== undefined &&
        tf.bbWidth > 0 && // BB width should be greater than 0
        tf.volumeSpike !== null &&
        tf.volumeSpike !== undefined &&
        tf.volumeSpike > 0 && // Volume spike should be greater than 0
        tf.matchedSetups !== undefined &&
        tf.matchedSetups.length > 0; // Only include if there are trading setups detected

      // Only log in debug mode to avoid spam
      if (!isValid && process.env.NODE_ENV === 'development') {
        console.log(`Symbol ${data.symbol} filtered out:`, {
          lastPrice: tf.lastPrice,
          previousPrice: tf.previousPrice,
          rsi: tf.rsi,
          macdHist: tf.macdHist,
          adx: tf.adx,
          bbWidth: tf.bbWidth,
          volumeSpike: tf.volumeSpike,
          marketCap: tf.marketCap,
          matchedSetups: tf.matchedSetups?.length || 0,
        });
      }

      return isValid;
    });

    return hasValidTimeframe;
  }

  private async analyzeSymbol(symbol: string): Promise<MultiTimeframeData | null> {
    try {
      // Step 3: Fetch candlestick data for different timeframes
      // Get more candles for longer timeframes to ensure we have enough data for technical analysis
      const [candles5m, candles15m, candles1h, candles1d] = await Promise.all([
        this.bybitService.getCandles(symbol, '5', 200), // 200 candles = ~16.7 hours
        this.bybitService.getCandles(symbol, '15', 200), // 200 candles = ~50 hours
        this.bybitService.getCandles(symbol, '60', 200), // 200 candles = ~200 hours
        this.bybitService.getCandles(symbol, 'D', 100), // 100 candles = ~100 days
      ]);

      // if (symbol === 'BTCUSDT') {
      //   console.log(candles1d);
      // }

      // Step 4: Convert candle data to proper format
      const candleData5m = this.convertCandleData(candles5m);
      const candleData15m = this.convertCandleData(candles15m);
      const candleData1h = this.convertCandleData(candles1h);
      const candleData1d = this.convertCandleData(candles1d);

      // Step 5: Market cap data check removed (CoinGecko integration removed)
      const marketCapData = null;

      // Step 7: Calculate technical indicators for each timeframe
      const tf5m = this.calculateScreenerResult(candleData5m, symbol, marketCapData);
      const tf15m = this.calculateScreenerResult(candleData15m, symbol, marketCapData);
      const tf1h = this.calculateScreenerResult(candleData1h, symbol, marketCapData);
      const tf1d = this.calculateScreenerResult(candleData1d, symbol, marketCapData);

      return {
        symbol,
        tf5m,
        tf15m,
        tf1h,
        tf1d,
      };
    } catch (error) {
      console.error(`Error analyzing symbol ${symbol}:`, error);
      return null;
    }
  }

  private convertCandleData(candles: any[]): CandleData[] {
    // Reverse the candles array so oldest comes first (required for technical analysis)
    const reversedCandles = [...candles].reverse();

    return reversedCandles.map((candle) => {
      // Handle CandleDto format (new format from Bybit service)
      if (candle && typeof candle === 'object' && 'openTime' in candle) {
        return {
          timestamp: parseInt(candle.openTime),
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          volume: parseFloat(candle.volume),
        };
      }

      // Handle array format (legacy format): [timestamp, open, high, low, close, volume, turnover]
      if (Array.isArray(candle)) {
        return {
          timestamp: parseInt(candle[0]),
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5]),
        };
      }

      // Fallback for other object formats
      return {
        timestamp: parseInt(candle.openTime || candle[0]),
        open: parseFloat(candle.open || candle[1]),
        high: parseFloat(candle.high || candle[2]),
        low: parseFloat(candle.low || candle[3]),
        close: parseFloat(candle.close || candle[4]),
        volume: parseFloat(candle.volume || candle[5]),
      };
    });
  }

  private calculateScreenerResult(
    candles: CandleData[],
    symbol: string,
    marketCapData: any,
  ): Partial<ScreenerResultResponse> {
    if (candles.length < 50) {
      return { symbol };
    }

    const prices = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const volumes = candles.map((c) => c.volume);

    // Get current price (last candle close)
    const currentPrice = prices[prices.length - 1];

    // Calculate change percent based on timeframe
    // For different timeframes, we need to calculate the change over the appropriate period
    let changePercent: number;

    if (candles.length >= 2) {
      // For most timeframes, calculate change from previous candle to current candle
      // This gives us the change over the last period (5m, 15m, 1h, 1d)
      const previousPrice = prices[prices.length - 2];
      changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
    } else {
      changePercent = 0;
    }

    // Calculate technical indicators
    const rsi = this.technicalAnalysis.calculateRSI(prices);
    const macd = this.technicalAnalysis.calculateMACD(prices);
    const adx = this.technicalAnalysis.calculateADX(highs, lows, prices);
    const breakout = this.technicalAnalysis.detectBreakout(highs, lows, prices, volumes);
    const volumeSpike = this.technicalAnalysis.calculateVolumeSpike(volumes);
    const isAbove200Ema = this.technicalAnalysis.isAboveEMA(prices, 200);

    // Calculate 24h volume (approximate)
    // For different timeframes, we need to adjust the volume calculation
    let volume24h: number;
    if (candles.length >= 24) {
      // For timeframes <= 1h, use last 24 candles
      volume24h = volumes.slice(-24).reduce((sum, vol) => sum + vol, 0);
    } else {
      // For daily timeframe, use all available candles
      volume24h = volumes.reduce((sum, vol) => sum + vol, 0);
    }

    // Determine signal and matched setups
    const timeframe = this.getTimeframeFromCandles(candles);
    const ema200 = this.technicalAnalysis.calculateEMA(prices, 200);
    const bb = this.technicalAnalysis.calculateBollingerBands(prices);

    const signalContext: SignalContext = {
      symbol,
      timeframe,
      lastPrice: currentPrice,
      previousPrice: prices[prices.length - 2] || currentPrice,
      rsi,
      macdHist: macd.histogram,
      adx,
      bbWidth: bb.width,
      volumeSpike,
      isAbove200Ema,
      isBreakout: breakout.isBreakout,
      isBreakdown: breakout.isBreakdown,
      ema200,
      bbUpper: bb.upper,
      bbLower: bb.lower,
      bbMiddle: bb.middle,
    };

    const matchedSetups = this.determineSetups(
      {
        rsi,
        macdHist: macd.histogram,
        adx,
        bbWidth: bb.width,
        volumeSpike,
        isAbove200Ema,
        isBreakout: breakout.isBreakout,
        isBreakdown: breakout.isBreakdown,
      },
      signalContext,
    );

    // Convert to legacy format for backward compatibility
    const legacySetups = matchedSetups.map(
      (setup) => setup.type as unknown as ScreenerSetupResponse,
    );
    const primarySignal =
      matchedSetups.length > 0
        ? (matchedSetups[0].type as unknown as ScreenerSetupResponse)
        : undefined;

    return {
      symbol,
      lastPrice: currentPrice,
      previousPrice: prices[prices.length - 2] || currentPrice,
      changePercent,
      volume24h,
      // Include market cap data if available
      marketCap: marketCapData?.marketCap,
      marketCapRank: marketCapData?.marketCapRank,
      circulatingSupply: marketCapData?.circulatingSupply,
      rsi,
      macdHist: macd.histogram,
      adx,
      bbWidth: bb.width,
      volumeSpike,
      isAbove200Ema,
      isBreakout: breakout.isBreakout,
      isBreakdown: breakout.isBreakdown,
      signal: primarySignal,
      matchedSetups: legacySetups,
      // New fields with descriptions
      description: matchedSetups.length > 0 ? matchedSetups[0].description : undefined,
      matchedSetupsWithDescriptions: matchedSetups,
    };
  }

  // Helper method to determine timeframe from candle data
  private getTimeframeFromCandles(candles: CandleData[]): string {
    if (candles.length < 2) return 'unknown';

    const time1 = candles[0].timestamp;
    const time2 = candles[1].timestamp;
    const diffMinutes = (time2 - time1) / (1000 * 60);

    if (diffMinutes <= 5) return '5m';
    if (diffMinutes <= 15) return '15m';
    if (diffMinutes <= 60) return '1h';
    if (diffMinutes <= 1440) return '1d';
    return 'unknown';
  }

  private determineSetups(
    indicators: {
      rsi: number;
      macdHist: number;
      adx: number;
      bbWidth: number;
      volumeSpike: number;
      isAbove200Ema: boolean;
      isBreakout: boolean;
      isBreakdown: boolean;
    },
    context: SignalContext,
  ): ScreenerSetup[] {
    const setups: ScreenerSetup[] = [];

    // RSI conditions
    if (indicators.rsi < 30) {
      setups.push({
        type: ScreenerSetupResponse.OversoldBounce,
        description: this.signalDescriptionService.generateSignalDescription(
          ScreenerSetupResponse.OversoldBounce,
          context,
        ),
      });
    } else if (indicators.rsi > 70) {
      setups.push({
        type: ScreenerSetupResponse.OverboughtShort,
        description: this.signalDescriptionService.generateSignalDescription(
          ScreenerSetupResponse.OverboughtShort,
          context,
        ),
      });
    }

    // MACD conditions
    if (indicators.macdHist > 0 && indicators.macdHist > 0.001) {
      setups.push({
        type: ScreenerSetupResponse.BullishBreakout,
        description: this.signalDescriptionService.generateSignalDescription(
          ScreenerSetupResponse.BullishBreakout,
          context,
        ),
      });
    } else if (indicators.macdHist < 0 && indicators.macdHist < -0.001) {
      setups.push({
        type: ScreenerSetupResponse.BearishBreakdown,
        description: this.signalDescriptionService.generateSignalDescription(
          ScreenerSetupResponse.BearishBreakdown,
          context,
        ),
      });
    }

    // ADX conditions (trend strength)
    if (indicators.adx > 25) {
      if (indicators.isBreakout) {
        setups.push({
          type: ScreenerSetupResponse.BreakOfStructure,
          description: this.signalDescriptionService.generateSignalDescription(
            ScreenerSetupResponse.BreakOfStructure,
            context,
          ),
        });
      }
    }

    // Bollinger Bands conditions
    if (indicators.bbWidth < 0.05) {
      setups.push({
        type: ScreenerSetupResponse.LowVolatilitySqueeze,
        description: this.signalDescriptionService.generateSignalDescription(
          ScreenerSetupResponse.LowVolatilitySqueeze,
          context,
        ),
      });
    }

    // Volume conditions
    if (indicators.volumeSpike > 1.5) {
      setups.push({
        type: ScreenerSetupResponse.VolumeSpike,
        description: this.signalDescriptionService.generateSignalDescription(
          ScreenerSetupResponse.VolumeSpike,
          context,
        ),
      });
    }

    // Breakout/Breakdown conditions
    if (indicators.isBreakout && indicators.isAbove200Ema) {
      setups.push({
        type: ScreenerSetupResponse.BullishBreakout,
        description: this.signalDescriptionService.generateSignalDescription(
          ScreenerSetupResponse.BullishBreakout,
          context,
        ),
      });
    } else if (indicators.isBreakdown && !indicators.isAbove200Ema) {
      setups.push({
        type: ScreenerSetupResponse.BearishBreakdown,
        description: this.signalDescriptionService.generateSignalDescription(
          ScreenerSetupResponse.BearishBreakdown,
          context,
        ),
      });
    }

    return setups;
  }

  private getHighestMarketCap(data: MultiTimeframeData): number {
    const marketCaps = [
      data.tf5m?.marketCap,
      data.tf15m?.marketCap,
      data.tf1h?.marketCap,
      data.tf1d?.marketCap,
    ].filter(
      (marketCap) => marketCap !== null && marketCap !== undefined && marketCap > 0,
    ) as number[];

    return marketCaps.length > 0 ? Math.max(...marketCaps) : 0;
  }

  private async processInstrumentsInBatches(
    instruments: BybitInstrument[],
    filterValid: boolean,
  ): Promise<MultiTimeframeData[]> {
    const results: MultiTimeframeData[] = [];
    let skippedCount = 0;

    // Process instruments in batches to limit concurrent API calls
    for (let i = 0; i < instruments.length; i += this.CONCURRENT_LIMIT) {
      const batch = instruments.slice(i, i + this.CONCURRENT_LIMIT);

      // Process batch in parallel
      const batchPromises = batch.map(async (instrument) => {
        try {
          const multiTimeframeData = await this.analyzeSymbol(instrument.symbol);
          if (multiTimeframeData && (!filterValid || this.hasValidData(multiTimeframeData))) {
            return multiTimeframeData;
          } else if (!multiTimeframeData) {
            skippedCount++;
            return null;
          }
        } catch (error) {
          console.error(`Error analyzing ${instrument.symbol}:`, error);
          skippedCount++;
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(
        ...batchResults.filter((result): result is MultiTimeframeData => result !== null),
      );

      // Add small delay between batches to avoid rate limiting
      if (i + this.CONCURRENT_LIMIT < instruments.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `Processed ${instruments.length} instruments: ${results.length} valid, ${skippedCount} skipped`,
    );
    return results;
  }

  // Cache management methods
  async clearCache(): Promise<void> {
    this.screenerCache = {};
    console.log('Screener cache cleared');
  }

  async forceRefresh(): Promise<void> {
    this.screenerCache = {};
    console.log('Screener cache cleared for force refresh');
  }

  getCacheStats(): { cacheSize: number; lastUpdate: Date; isStale: boolean } {
    const cacheKeys = Object.keys(this.screenerCache);
    const lastUpdate =
      cacheKeys.length > 0
        ? new Date(Math.max(...cacheKeys.map((key) => this.screenerCache[key].timestamp)))
        : new Date(0);

    return {
      cacheSize: cacheKeys.length,
      lastUpdate,
      isStale: Date.now() - lastUpdate.getTime() > this.CACHE_DURATION,
    };
  }
}
