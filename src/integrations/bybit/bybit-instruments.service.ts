import { Injectable } from '@nestjs/common';
import { RestClientV5 } from 'bybit-api';

export interface BybitInstrument {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  status: string;
}

@Injectable()
export class BybitInstrumentsService {
  private readonly client: RestClientV5;

  constructor() {
    this.client = new RestClientV5({
      key: process.env.BYBIT_API_KEY,
      secret: process.env.BYBIT_API_SECRET,
      testnet: false, // produkční data
    });
  }

  async getInstruments(): Promise<BybitInstrument[]> {
    const response = await this.client.getInstrumentsInfo({
      category: 'linear',
    });

    if (response.retCode !== 0 || !response.result.list) {
      throw new Error('Failed to fetch instruments');
    }

    return response.result.list
      .filter((instrument: any) => instrument.status === 'Trading')
      .map((instrument: any) => ({
        symbol: instrument.symbol,
        baseCoin: instrument.baseCoin,
        quoteCoin: instrument.quoteCoin,
        status: instrument.status,
      }));
  }
}
