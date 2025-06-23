import { Controller, Get, Query } from '@nestjs/common';
import { BybitService } from './bybit.service';
import { TickerDto } from './dto/ticker-response.dto';
import { GetCandlesQuery } from './dto/get-candles-query';
import { CandleDto } from './dto/candle-response.dto';

@Controller('api/bybit')
export class BybitController {
  constructor(private readonly bybit: BybitService) {}
  @Get('tickers')
  getTickers(): Promise<TickerDto[]> {
    return this.bybit.getTickers();
  }

  @Get('candles')
  getCandles(@Query() query: GetCandlesQuery): Promise<CandleDto> {
    return this.bybit.getCandles(query.symbol, query.interval);
  }
}
