import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CoinMarketCapService, MarketCapData } from './coinmarketcap.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/market-cap')
export class CoinMarketCapController {
  constructor(private readonly coinMarketCapService: CoinMarketCapService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getMarketCapData(@Query('symbols') symbols?: string): Promise<MarketCapData[]> {
    if (!symbols) {
      return this.coinMarketCapService.getTopMarketCaps(100);
    }

    const symbolArray = symbols.split(',').map((s) => s.trim());
    return this.coinMarketCapService.getMarketCapData(symbolArray);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('top')
  async getTopMarketCaps(@Query('limit') limit?: string): Promise<MarketCapData[]> {
    const limitNumber = limit ? parseInt(limit, 10) : 100;
    return this.coinMarketCapService.getTopMarketCaps(limitNumber);
  }
}
