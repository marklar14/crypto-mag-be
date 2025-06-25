import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { CandleDto } from './dto/candle-response.dto';
import { TickerDto } from './dto/ticker-response.dto';
import { TickerResponse } from './response/ticker-response';
import { mapTickerDtoToResponse } from './mapper/map-ticker-dto-to-response';

@Injectable()
export class BybitService {
  private readonly API_KEY = process.env.BYBIT_API_KEY!;
  private readonly API_SECRET = process.env.BYBIT_API_SECRET!;
  private readonly BASE_URL = 'https://api.bybit.com';

  private sign(params: Record<string, string>, timestamp: string): string {
    const paramStr = Object.entries(params)
      .sort()
      .map(([key, val]) => `${key}=${val}`)
      .join('&');
    const payload = `${timestamp}${this.API_KEY}${paramStr}${this.API_SECRET}`;
    return crypto.createHmac('sha256', this.API_SECRET).update(payload).digest('hex');
  }

  async getTickers(symbols?: string[]): Promise<TickerResponse[]> {
    const res = await axios.get(`${this.BASE_URL}/v5/market/tickers`, {
      params: { category: 'linear' },
    });

    const list: TickerDto[] = res.data?.result?.list ?? [];

    const mapped = list.map(mapTickerDtoToResponse);

    return symbols?.length ? mapped.filter((t) => symbols.includes(t.symbol)) : mapped;
  }

  async getCandles(symbol: string, interval: string = '1', limit = 100): Promise<CandleDto> {
    const res = await axios.get(`${this.BASE_URL}/v5/market/kline`, {
      params: {
        category: 'linear',
        symbol,
        interval,
        limit,
      },
    });
    return res.data?.result?.list ?? [];
  }
}
