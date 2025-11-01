import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RestClientV5 } from 'bybit-api';

export interface BybitInstrument {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  status: string;
}

interface BybitInstrumentResponse {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  status: string;
}

@Injectable()
export class BybitInstrumentsService {
  private readonly client: RestClientV5;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BYBIT_API_KEY');
    const apiSecret = this.configService.get<string>('BYBIT_API_SECRET');

    this.client = new RestClientV5({
      key: apiKey,
      secret: apiSecret,
      testnet: false, // produkční data
    });
  }

  async getInstruments(): Promise<BybitInstrument[]> {
    try {
      const response = await this.client.getInstrumentsInfo({
        category: 'linear',
      });

      if (response.retCode !== 0 || !response.result?.list) {
        throw new HttpException(
          `Failed to fetch instruments: ${response.retMsg || 'Unknown error'} (code: ${response.retCode})`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      return response.result.list
        .filter((instrument: BybitInstrumentResponse) => instrument.status === 'Trading')
        .map((instrument: BybitInstrumentResponse) => ({
          symbol: instrument.symbol,
          baseCoin: instrument.baseCoin,
          quoteCoin: instrument.quoteCoin,
          status: instrument.status,
        }));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch instruments from Bybit API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
