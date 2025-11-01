import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KlineIntervalV3 } from 'bybit-api';
import { BybitService } from './bybit.service';
import { GetCandlesQuery } from './dto/get-candles-query';
import { GetTickersQuery } from './dto/get-tickers-query';
import { CandleDto } from './dto/candle-response.dto';
import { TickerResponse } from './response/ticker-response';

@Controller('api/bybit')
export class BybitController {
  constructor(private readonly bybitService: BybitService) {}
  @UseGuards(AuthGuard('jwt'))
  @Get('tickers')
  getTickers(@Query() query: GetTickersQuery): Promise<TickerResponse[]> {
    return this.bybitService.getTickers(query?.symbols);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('candles')
  getCandles(@Query() query: GetCandlesQuery): Promise<CandleDto[]> {
    return this.bybitService.getCandles(query.symbol, query.interval as KlineIntervalV3);
  }
}
