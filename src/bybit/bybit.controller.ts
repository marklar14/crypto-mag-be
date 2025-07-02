import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BybitService } from './bybit.service';
import { TickerDto } from './dto/ticker-response.dto';
import { GetCandlesQuery } from './dto/get-candles-query';
import { CandleDto } from './dto/candle-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { TickerResponse } from './response/ticker-response';
import { GetTickersQuery } from './dto/get-tickers-query';
import { KlineIntervalV3 } from 'bybit-api';

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
