import { Controller, Get, Query, UseGuards, Post } from '@nestjs/common';
import { CoinGeckoService } from './coingecko.service';
import { AuthGuard } from '@nestjs/passport';
import { MarketCapData } from '../coinmarketcap/coinmarketcap.service';

@Controller('api/market-cap')
export class CoinGeckoController {
  constructor(private readonly coinGeckoService: CoinGeckoService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getMarketCapData(@Query('symbols') symbols?: string): Promise<MarketCapData[]> {
    if (!symbols) {
      return this.coinGeckoService.getTopMarketCaps(100);
    }

    const symbolArray = symbols.split(',').map((s) => s.trim());
    return this.coinGeckoService.getMarketCapData(symbolArray);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('top')
  async getTopMarketCaps(@Query('limit') limit?: string): Promise<MarketCapData[]> {
    const limitNumber = limit ? parseInt(limit, 10) : 100;
    return this.coinGeckoService.getTopMarketCaps(limitNumber);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cache/stats')
  async getCacheStats() {
    return this.coinGeckoService.getCacheStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cache/refresh')
  async forceRefreshCache() {
    await this.coinGeckoService.forceRefreshCache();
    return { message: 'Cache refreshed successfully' };
  }
}
