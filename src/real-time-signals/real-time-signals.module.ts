import { Module } from '@nestjs/common';
import { RealTimeSignalsController } from './real-time-signals.controller';
import { RealTimeSignalsService } from './real-time-signals.service';
import { DynamicThresholdsService } from './dynamic-thresholds.service';
import { TickAnalysisService } from './tick-analysis.service';
import { BybitService } from '../bybit/bybit.service';
import { BybitInstrumentsService } from '../integrations/bybit/bybit-instruments.service';

@Module({
  controllers: [RealTimeSignalsController],
  providers: [
    RealTimeSignalsService,
    DynamicThresholdsService,
    TickAnalysisService,
    BybitService,
    BybitInstrumentsService,
  ],
  exports: [RealTimeSignalsService],
})
export class RealTimeSignalsModule {}
