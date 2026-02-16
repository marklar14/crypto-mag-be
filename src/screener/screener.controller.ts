import { Controller, Get, Query, Post } from '@nestjs/common';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginatedScreenerResponse } from './response/paginated-screener-response';
import { ScreenerService } from './screener.service';
import { BybitService } from '../bybit/bybit.service';

export class GetScreenerQuery {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  })
  filterValid?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  })
  debug?: boolean = false;

  @IsOptional()
  @IsString()
  timeframe?: string;
}

export class GetScreenerUnfilteredQuery {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit?: number = 50;
}

@Controller('screener')
export class ScreenerController {
  constructor(
    private screenerService: ScreenerService,
    private bybitService: BybitService,
  ) {}

  @Get()
  async getScreener(@Query() query: GetScreenerQuery): Promise<PaginatedScreenerResponse> {
    const { filterValid = true, page = 1, limit = 50, debug = false } = query;

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 200); // Max 200 per page

    // If debug mode, force filterValid to false to see all results
    const actualFilterValid = debug ? false : filterValid;

    return this.screenerService.evaluateAllPaginated(actualFilterValid, validPage, validLimit);
  }

  @Get('unfiltered')
  async getScreenerUnfiltered(
    @Query() query: GetScreenerUnfilteredQuery,
  ): Promise<PaginatedScreenerResponse> {
    const { page = 1, limit = 50 } = query;

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 200); // Max 200 per page

    return this.screenerService.getAllResultsUnfiltered(validPage, validLimit);
  }

  @Get('test-price/:symbol')
  async testRealTimePrice(@Query('symbol') symbol: string = 'BTCUSDT'): Promise<any> {
    const realTimePrice = await this.bybitService.getRealTimePrice(symbol);

    return {
      symbol,
      realTimePrice,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cache/clear')
  async clearCache(): Promise<{ message: string }> {
    await this.screenerService.clearCache();
    return { message: 'Screener cache cleared successfully' };
  }

  @Post('cache/refresh')
  async forceRefresh(): Promise<{ message: string }> {
    await this.screenerService.forceRefresh();
    return { message: 'Screener cache refreshed successfully' };
  }

  @Get('cache/stats')
  async getCacheStats(): Promise<{ cacheSize: number; lastUpdate: Date; isStale: boolean }> {
    return this.screenerService.getCacheStats();
  }
}
