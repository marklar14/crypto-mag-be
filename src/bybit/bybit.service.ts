import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RestClientV5, KlineIntervalV3 } from 'bybit-api';
import { CandleDto } from './dto/candle-response.dto';
import { TickerResponse } from './response/ticker-response';

interface BybitTicker {
  symbol: string;
  lastPrice: string;
  indexPrice: string;
  markPrice: string;
  prevPrice24h: string;
  price24hPcnt: string;
  prevPrice1h: string;
  highPrice24h: string;
  lowPrice24h: string;
  volume24h: string;
  turnover24h: string;
  openInterest: string;
  openInterestValue: string;
  fundingRate: string;
  nextFundingTime: string;
  bid1Price: string;
  bid1Size: string;
  ask1Price: string;
  ask1Size: string;
  predictedDeliveryPrice: string;
  basisRate: string;
  deliveryFeeRate: string;
  deliveryTime: string;
  basis: string;
  preOpenPrice: string;
  preQty: string;
  curPreListingPhase: string;
}

@Injectable()
export class BybitService {
  private readonly logger = new Logger(BybitService.name);
  private readonly client: RestClientV5;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BYBIT_API_KEY');
    const apiSecret = this.configService.get<string>('BYBIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      this.logger.warn(
        'Bybit API credentials not configured. Some features may not work properly.',
      );
      this.logger.warn('Please set BYBIT_API_KEY and BYBIT_API_SECRET environment variables.');
    }

    this.client = new RestClientV5({
      key: apiKey,
      secret: apiSecret,
      testnet: false,
    });
  }

  async getTickers(symbols?: string[]): Promise<TickerResponse[]> {
    try {
      const response = await this.client.getTickers({
        category: 'linear',
      });

      if (response.retCode !== 0 || !response.result?.list) {
        throw new HttpException(
          `Failed to fetch tickers: ${response.retMsg || 'Unknown error'} (code: ${response.retCode})`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const mapped = response.result.list.map((ticker: BybitTicker) => ({
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Error fetching tickers: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new HttpException(
        'Failed to fetch tickers from Bybit API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCandles(symbol: string, interval: KlineIntervalV3, limit = 100): Promise<CandleDto[]> {
    try {
      const apiKey = this.configService.get<string>('BYBIT_API_KEY');
      const apiSecret = this.configService.get<string>('BYBIT_API_SECRET');

      if (!apiKey || !apiSecret) {
        throw new HttpException(
          'Bybit API credentials not configured. Please set BYBIT_API_KEY and BYBIT_API_SECRET environment variables.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const response = await this.client.getKline({
        category: 'linear',
        symbol,
        interval,
        limit,
      });

      if (response.retCode !== 0) {
        throw new HttpException(
          `Bybit API error: ${response.retMsg || 'Unknown error'} (code: ${response.retCode})`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (!response.result?.list) {
        throw new HttpException(
          `No candle data received for ${symbol} with interval ${interval}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return response.result.list.map((row: string[]) => ({
        openTime: row[0],
        open: row[1],
        high: row[2],
        low: row[3],
        close: row[4],
        volume: row[5],
        turnover: row[6],
      }));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Error fetching candles for ${symbol} (interval: ${interval}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new HttpException(
        `Failed to fetch candles for ${symbol} (interval: ${interval})`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRealTimePrice(
    symbol: string,
  ): Promise<{ symbol: string; price: string; timestamp: string } | null> {
    try {
      const response = await this.client.getTickers({
        category: 'linear',
        symbol,
      });

      if (response.retCode === 0 && response.result?.list && response.result?.list.length > 0) {
        const ticker = response.result.list[0] as BybitTicker;
        this.logger.debug(`Real-time price for ${symbol}:`, {
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
      this.logger.error(
        `Error getting real-time price for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }
}
