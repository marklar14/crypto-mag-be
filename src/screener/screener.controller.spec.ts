import { Test, TestingModule } from '@nestjs/testing';
import { ScreenerController } from './screener.controller';
import { ScreenerService } from './screener.service';
import { BybitService } from '../bybit/bybit.service';
import { BybitInstrumentsService } from '../integrations/bybit/bybit-instruments.service';
import { TechnicalAnalysisService } from './technical-analysis.service';

describe('ScreenerController', () => {
  let controller: ScreenerController;

  beforeEach(async () => {
    const mockScreenerService = {
      evaluateAll: jest.fn(),
    };

    const mockBybitService = {
      getCandles: jest.fn(),
    };

    const mockBybitInstrumentsService = {
      getInstruments: jest.fn(),
    };

    const mockTechnicalAnalysisService = {
      calculateRSI: jest.fn(),
      calculateMACD: jest.fn(),
      calculateADX: jest.fn(),
      calculateBollingerBands: jest.fn(),
      calculateVolumeSpike: jest.fn(),
      isAboveEMA: jest.fn(),
      detectBreakout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScreenerController],
      providers: [
        {
          provide: ScreenerService,
          useValue: mockScreenerService,
        },
        {
          provide: BybitService,
          useValue: mockBybitService,
        },
        {
          provide: BybitInstrumentsService,
          useValue: mockBybitInstrumentsService,
        },
        {
          provide: TechnicalAnalysisService,
          useValue: mockTechnicalAnalysisService,
        },
      ],
    }).compile();

    controller = module.get<ScreenerController>(ScreenerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
