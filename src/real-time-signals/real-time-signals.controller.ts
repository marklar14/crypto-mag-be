import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { RealTimeSignalsService } from './real-time-signals.service';
import { RealTimeSignalsQueryDto } from './dto/real-time-signals-query.dto';
import { RealTimeSignalResponse } from './response/real-time-signal-response';

@Controller('api/real-time-signals')
export class RealTimeSignalsController {
  constructor(private readonly realTimeSignalsService: RealTimeSignalsService) {}

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getRealTimeSignals(
    @Query() query: RealTimeSignalsQueryDto,
  ): Promise<RealTimeSignalResponse> {
    console.log('Real-time signals request:', {
      timeframes: query.timeframes,
      threshold: query.threshold,
      limit: query.limit,
      adaptiveThresholds: query.adaptiveThresholds,
      tickAnalysis: query.tickAnalysis,
    });

    return this.realTimeSignalsService.getRealTimeSignals(
      query.timeframes,
      query.threshold,
      query.limit,
      query.adaptiveThresholds,
      query.tickAnalysis,
    );
  }
}
