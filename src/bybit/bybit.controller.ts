import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BybitService } from './bybit.service';
import { TickerDto } from './dto/ticker-response.dto';
import { GetCandlesQuery } from './dto/get-candles-query';
import { CandleDto } from './dto/candle-response.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/bybit')
export class BybitController {
  constructor(private readonly bybitService: BybitService) {}
  @UseGuards(AuthGuard('jwt'))
  @Get('tickers')
  getTickers(): Promise<TickerDto[]> {
    return this.bybitService.getTickers();
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('candles')
  getCandles(@Query() query: GetCandlesQuery): Promise<CandleDto> {
    return this.bybitService.getCandles(query.symbol, query.interval);
  }
}
