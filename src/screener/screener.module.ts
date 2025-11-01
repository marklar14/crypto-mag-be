import { Module } from '@nestjs/common';
import { ScreenerController } from './screener.controller';
import { ScreenerService } from './screener.service';
import { TechnicalAnalysisService } from './technical-analysis.service';
import { SignalDescriptionService } from './signal-description.service';
import { BybitService } from '../bybit/bybit.service';
import { BybitInstrumentsService } from '../integrations/bybit/bybit-instruments.service';

@Module({
  controllers: [ScreenerController],
  providers: [
    ScreenerService,
    TechnicalAnalysisService,
    SignalDescriptionService,
    BybitService,
    BybitInstrumentsService,
  ],
})
export class ScreenerModule {}
