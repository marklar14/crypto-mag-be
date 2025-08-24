import { Injectable } from '@nestjs/common';
import { RestClientV5, KlineIntervalV3 } from 'bybit-api';
import { CandleDto } from './dto/candle-response.dto';
import { TickerResponse } from './response/ticker-response';

@Injectable()
export class BybitService {
  private readonly client: RestClientV5;

  constructor() {
    // Check if API credentials are configured
    if (!process.env.BYBIT_API_KEY || !process.env.BYBIT_API_SECRET) {
      console.warn('Bybit API credentials not configured. Some features may not work properly.');
      console.warn('Please set BYBIT_API_KEY and BYBIT_API_SECRET environment variables.');
    }

    this.client = new RestClientV5({
      key: process.env.BYBIT_API_KEY,
      secret: process.env.BYBIT_API_SECRET,
      testnet: false, // produkční data
    });
  }

  async getTickers(symbols?: string[]): Promise<TickerResponse[]> {
    const response = await this.client.getTickers({
      category: 'linear',
    });

    if (response.retCode !== 0 || !response.result.list) {
      throw new Error('Failed to fetch tickers');
    }

    const mapped = response.result.list.map((ticker: any) => ({
      symbol: ticker.symbol,
      lastPrice: parseFloat(ticker.lastPrice),
      indexPrice: parseFloat(ticker.indexPrice),
      markPrice: parseFloat(ticker.markPrice),
      prevPrice24h: parseFloat(ticker.prevPrice24h),
      price24hPcnt: parseFloat(ticker.price24hPcnt),
      prevPrice1h: parseFloat(ticker.prevPrice1h),
      highPrice24h: parseFloat(ticker.highPrice24h),
      lowPrice24h: parseFloat(ticker.lowPrice24h),
      volume24h: parseFloat(ticker.volume24h),
      turnover24h: parseFloat(ticker.turnover24h),
      openInterest: parseFloat(ticker.openInterest),
      openInterestValue: parseFloat(ticker.openInterestValue),
      fundingRate: parseFloat(ticker.fundingRate),
      nextFundingTime: ticker.nextFundingTime,
      bid1Price: parseFloat(ticker.bid1Price),
      bid1Size: parseFloat(ticker.bid1Size),
      ask1Price: parseFloat(ticker.ask1Price),
      ask1Size: parseFloat(ticker.ask1Size),
      predictedDeliveryPrice: parseFloat(ticker.predictedDeliveryPrice),
      basisRate: parseFloat(ticker.basisRate),
      deliveryFeeRate: parseFloat(ticker.deliveryFeeRate),
      deliveryTime: ticker.deliveryTime,
      basis: parseFloat(ticker.basis),
      preOpenPrice: parseFloat(ticker.preOpenPrice),
      preQty: parseFloat(ticker.preQty),
      curPreListingPhase: ticker.curPreListingPhase,
    }));

    return symbols?.length ? mapped.filter((t) => symbols.includes(t.symbol)) : mapped;
  }

  async getCandles(symbol: string, interval: KlineIntervalV3, limit = 100): Promise<CandleDto[]> {
    try {
      // Check if API credentials are configured
      if (!process.env.BYBIT_API_KEY || !process.env.BYBIT_API_SECRET) {
        throw new Error(
          'Bybit API credentials not configured. Please set BYBIT_API_KEY and BYBIT_API_SECRET environment variables.',
        );
      }

      const response = await this.client.getKline({
        category: 'linear',
        symbol,
        interval,
        limit,
      });

      if (response.retCode !== 0) {
        throw new Error(
          `Bybit API error: ${response.retMsg || 'Unknown error'} (code: ${response.retCode})`,
        );
      }

      if (!response.result?.list) {
        throw new Error(`No candle data received for ${symbol} with interval ${interval}`);
      }

      return response.result.list.map((row: any[]) => ({
        openTime: row[0],
        open: row[1],
        high: row[2],
        low: row[3],
        close: row[4],
        volume: row[5],
        turnover: row[6],
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to fetch candles for ${symbol} (interval: ${interval}): ${error.message}`,
        );
      }
      throw new Error(
        `Failed to fetch candles for ${symbol} (interval: ${interval}): Unknown error`,
      );
    }
  }

  // Method to get real-time price for a specific symbol
  async getRealTimePrice(
    symbol: string,
  ): Promise<{ symbol: string; price: string; timestamp: string } | null> {
    try {
      const response = await this.client.getTickers({
        category: 'linear',
        symbol,
      });

      if (response.retCode === 0 && response.result?.list && response.result?.list.length > 0) {
        const ticker = response.result.list[0];
        console.log(`Real-time price for ${symbol}:`, {
          lastPrice: ticker.lastPrice,
          timestamp: new Date().toISOString(),
        });
        return {
          symbol: ticker.symbol,
          price: ticker.lastPrice,
          timestamp: new Date().toISOString(),
        };
      }
      return null;
    } catch (error) {
      console.error(`Error getting real-time price for ${symbol}:`, error);
      return null;
    }
  }
}
