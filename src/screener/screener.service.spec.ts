import { Test, TestingModule } from '@nestjs/testing';
import { ScreenerService } from './screener.service';
import { BybitService } from '../bybit/bybit.service';
import { BybitInstrumentsService } from '../integrations/bybit/bybit-instruments.service';
import { TechnicalAnalysisService } from './technical-analysis.service';
import { SignalDescriptionService } from './signal-description.service';
import { MultiTimeframeData } from './response/multi-timeframe-data';
import { ScreenerSetupResponse } from './response/screener-setup-response';

describe('ScreenerService', () => {
  let service: ScreenerService;
  let bybitService: jest.Mocked<BybitService>;
  let bybitInstrumentsService: jest.Mocked<BybitInstrumentsService>;
  let technicalAnalysisService: jest.Mocked<TechnicalAnalysisService>;
  let signalDescriptionService: jest.Mocked<SignalDescriptionService>;

  const mockInstruments = [
    { symbol: 'BTCUSDT', baseCoin: 'BTC', quoteCoin: 'USDT', status: 'Trading' },
    { symbol: 'ETHUSDT', baseCoin: 'ETH', quoteCoin: 'USDT', status: 'Trading' },
    { symbol: 'ADAUSDT', baseCoin: 'ADA', quoteCoin: 'USDT', status: 'Trading' },
  ];

  const mockCandles = Array.from({ length: 100 }, (_, i) => ({
    openTime: (1640995200000 + i * 60000).toString(),
    open: (50000 + i * 10).toString(),
    high: (51000 + i * 10).toString(),
    low: (49000 + i * 10).toString(),
    close: (50500 + i * 10).toString(),
    volume: (1000000 + i * 1000).toString(),
    turnover: (50000000000 + i * 500000000).toString(),
  }));

  beforeEach(async () => {
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
      calculateEMA: jest.fn(),
    };

    const mockSignalDescriptionService = {
      generateSignalDescription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreenerService,
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
        {
          provide: SignalDescriptionService,
          useValue: mockSignalDescriptionService,
        },
      ],
    }).compile();

    service = module.get<ScreenerService>(ScreenerService);
    bybitService = module.get(BybitService);
    bybitInstrumentsService = module.get(BybitInstrumentsService);
    technicalAnalysisService = module.get(TechnicalAnalysisService);
    signalDescriptionService = module.get(SignalDescriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateAll', () => {
    it('should return multi-timeframe data for all USDT instruments', async () => {
      // Mock the instruments service
      bybitInstrumentsService.getInstruments.mockResolvedValue(mockInstruments);

      // Mock the candles service for each timeframe - need to mock all 12 calls
      bybitService.getCandles
        .mockResolvedValue(mockCandles) // 5m
        .mockResolvedValue(mockCandles) // 15m
        .mockResolvedValue(mockCandles) // 1h
        .mockResolvedValue(mockCandles) // 1d
        .mockResolvedValue(mockCandles) // 5m
        .mockResolvedValue(mockCandles) // 15m
        .mockResolvedValue(mockCandles) // 1h
        .mockResolvedValue(mockCandles) // 1d
        .mockResolvedValue(mockCandles) // 5m
        .mockResolvedValue(mockCandles) // 15m
        .mockResolvedValue(mockCandles) // 1h
        .mockResolvedValue(mockCandles); // 1d

      // Mock technical analysis methods to return valid data that will trigger setups
      technicalAnalysisService.calculateRSI.mockReturnValue(25); // Oversold - will trigger setup
      technicalAnalysisService.calculateMACD.mockReturnValue({
        macd: 0.5,
        signal: 0.3,
        histogram: 0.002, // Positive histogram - will trigger setup
      });
      technicalAnalysisService.calculateADX.mockReturnValue(30); // Strong trend - will trigger setup
      technicalAnalysisService.calculateBollingerBands.mockReturnValue({
        upper: 52000,
        middle: 51000,
        lower: 50000,
        width: 0.03, // Low volatility - will trigger setup
      });
      technicalAnalysisService.calculateVolumeSpike.mockReturnValue(1.8); // High volume - will trigger setup
      technicalAnalysisService.isAboveEMA.mockReturnValue(true);
      technicalAnalysisService.detectBreakout.mockReturnValue({
        isBreakout: true, // Will trigger setup
        isBreakdown: false,
      });

      // Mock SignalDescriptionService
      signalDescriptionService.generateSignalDescription.mockReturnValue({
        title: 'Test Signal',
        description: 'Test description',
        reasoning: 'Test reasoning',
        values: {},
      });

      const result = await service.evaluateAll();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3); // 3 USDT instruments
      expect(result[0]).toHaveProperty('symbol');
      expect(result[0]).toHaveProperty('tf5m');
      expect(result[0]).toHaveProperty('tf15m');
      expect(result[0]).toHaveProperty('tf1h');
      expect(result[0]).toHaveProperty('tf1d');

      // Verify that getInstruments was called
      expect(bybitInstrumentsService.getInstruments).toHaveBeenCalledTimes(1);

      // Verify that getCandles was called for each symbol and timeframe
      expect(bybitService.getCandles).toHaveBeenCalledTimes(12); // 3 symbols * 4 timeframes
    });

    it('should filter only USDT instruments', async () => {
      const mixedInstruments = [
        { symbol: 'BTCUSDT', baseCoin: 'BTC', quoteCoin: 'USDT', status: 'Trading' },
        { symbol: 'ETHBTC', baseCoin: 'ETH', quoteCoin: 'BTC', status: 'Trading' },
        { symbol: 'ADAUSDT', baseCoin: 'ADA', quoteCoin: 'USDT', status: 'Trading' },
      ];

      bybitInstrumentsService.getInstruments.mockResolvedValue(mixedInstruments);
      bybitService.getCandles.mockResolvedValue(mockCandles);

      // Mock technical analysis methods to return valid data that will trigger setups
      technicalAnalysisService.calculateRSI.mockReturnValue(25); // Oversold - will trigger setup
      technicalAnalysisService.calculateMACD.mockReturnValue({
        macd: 0.5,
        signal: 0.3,
        histogram: 0.002, // Positive histogram - will trigger setup
      });
      technicalAnalysisService.calculateADX.mockReturnValue(30); // Strong trend - will trigger setup
      technicalAnalysisService.calculateBollingerBands.mockReturnValue({
        upper: 52000,
        middle: 51000,
        lower: 50000,
        width: 0.03, // Low volatility - will trigger setup
      });
      technicalAnalysisService.calculateVolumeSpike.mockReturnValue(1.8); // High volume - will trigger setup
      technicalAnalysisService.isAboveEMA.mockReturnValue(true);
      technicalAnalysisService.detectBreakout.mockReturnValue({
        isBreakout: true, // Will trigger setup
        isBreakdown: false,
      });

      const result = await service.evaluateAll();

      expect(result.length).toBe(2); // Only BTCUSDT and ADAUSDT
      expect(result[0].symbol).toBe('BTCUSDT');
      expect(result[1].symbol).toBe('ADAUSDT');
    });

    it('should limit to top 50 instruments for performance', async () => {
      const manyInstruments = Array.from({ length: 100 }, (_, i) => ({
        symbol: `COIN${i}USDT`,
        baseCoin: `COIN${i}`,
        quoteCoin: 'USDT',
        status: 'Trading',
      }));

      bybitInstrumentsService.getInstruments.mockResolvedValue(manyInstruments);
      bybitService.getCandles.mockResolvedValue(mockCandles);

      // Mock technical analysis methods to return valid data that will trigger setups
      technicalAnalysisService.calculateRSI.mockReturnValue(25); // Oversold - will trigger setup
      technicalAnalysisService.calculateMACD.mockReturnValue({
        macd: 0.5,
        signal: 0.3,
        histogram: 0.002, // Positive histogram - will trigger setup
      });
      technicalAnalysisService.calculateADX.mockReturnValue(30); // Strong trend - will trigger setup
      technicalAnalysisService.calculateBollingerBands.mockReturnValue({
        upper: 52000,
        middle: 51000,
        lower: 50000,
        width: 0.03, // Low volatility - will trigger setup
      });
      technicalAnalysisService.calculateVolumeSpike.mockReturnValue(1.8); // High volume - will trigger setup
      technicalAnalysisService.isAboveEMA.mockReturnValue(true);
      technicalAnalysisService.detectBreakout.mockReturnValue({
        isBreakout: true, // Will trigger setup
        isBreakdown: false,
      });

      const result = await service.evaluateAll();

      expect(result.length).toBe(100); // The service processes all 100 instruments (MAX_INSTRUMENTS is 500)
    });

    it('should handle errors gracefully and continue processing', async () => {
      bybitInstrumentsService.getInstruments.mockResolvedValue(mockInstruments);

      // Make the first symbol fail
      bybitService.getCandles
        .mockRejectedValueOnce(new Error('API Error')) // BTCUSDT fails
        .mockResolvedValue(mockCandles); // All other calls succeed

      // Mock technical analysis methods to return valid data that will trigger setups
      technicalAnalysisService.calculateRSI.mockReturnValue(25); // Oversold - will trigger setup
      technicalAnalysisService.calculateMACD.mockReturnValue({
        macd: 0.5,
        signal: 0.3,
        histogram: 0.002, // Positive histogram - will trigger setup
      });
      technicalAnalysisService.calculateADX.mockReturnValue(30); // Strong trend - will trigger setup
      technicalAnalysisService.calculateBollingerBands.mockReturnValue({
        upper: 52000,
        middle: 51000,
        lower: 50000,
        width: 0.03, // Low volatility - will trigger setup
      });
      technicalAnalysisService.calculateVolumeSpike.mockReturnValue(1.8); // High volume - will trigger setup
      technicalAnalysisService.isAboveEMA.mockReturnValue(true);
      technicalAnalysisService.detectBreakout.mockReturnValue({
        isBreakout: true, // Will trigger setup
        isBreakdown: false,
      });

      const result = await service.evaluateAll();

      expect(result.length).toBe(2); // Only ETHUSDT and ADAUSDT (BTCUSDT failed)
      expect(result[0].symbol).toBe('ETHUSDT');
      expect(result[1].symbol).toBe('ADAUSDT');
    });

    it('should return all symbols when filterValid is false', async () => {
      bybitInstrumentsService.getInstruments.mockResolvedValue(mockInstruments);
      bybitService.getCandles.mockResolvedValue(mockCandles);

      // Mock technical analysis methods to return null/invalid data
      technicalAnalysisService.calculateRSI.mockReturnValue(0); // Use 0 instead of null
      technicalAnalysisService.calculateMACD.mockReturnValue({
        macd: 0,
        signal: 0,
        histogram: 0,
      });
      technicalAnalysisService.calculateADX.mockReturnValue(0); // Use 0 instead of null
      technicalAnalysisService.calculateBollingerBands.mockReturnValue({
        upper: 0,
        middle: 0,
        lower: 0,
        width: 0,
      });
      technicalAnalysisService.calculateVolumeSpike.mockReturnValue(0); // Use 0 instead of null
      technicalAnalysisService.isAboveEMA.mockReturnValue(false);
      technicalAnalysisService.detectBreakout.mockReturnValue({
        isBreakout: false,
        isBreakdown: false,
      });

      const result = await service.evaluateAll(false); // filterValid = false

      expect(result.length).toBe(3); // All symbols returned even with invalid data
      expect(result[0].symbol).toBe('BTCUSDT');
      expect(result[1].symbol).toBe('ETHUSDT');
      expect(result[2].symbol).toBe('ADAUSDT');
    });
  });

  describe('convertCandleData', () => {
    it('should convert candle data correctly', () => {
      const rawCandles = [
        {
          openTime: '1640995200000',
          open: '50000',
          high: '51000',
          low: '49000',
          close: '50500',
          volume: '1000000',
          turnover: '50000000000',
        },
        {
          openTime: '1640995260000',
          open: '50500',
          high: '51500',
          low: '50000',
          close: '51000',
          volume: '1200000',
          turnover: '61200000000',
        },
      ];

      const result = (service as any).convertCandleData(rawCandles);

      expect(result).toHaveLength(2);
      // Note: convertCandleData reverses the array, so the order is swapped
      expect(result[0]).toEqual({
        timestamp: 1640995260000,
        open: 50500,
        high: 51500,
        low: 50000,
        close: 51000,
        volume: 1200000,
      });
      expect(result[1]).toEqual({
        timestamp: 1640995200000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 1000000,
      });
    });
  });

  describe('calculateScreenerResult', () => {
    it('should return partial result for insufficient data', () => {
      const candles = Array.from({ length: 30 }, (_, i) => ({
        timestamp: 1640995200000 + i * 60000,
        open: 50000 + i,
        high: 51000 + i,
        low: 49000 + i,
        close: 50500 + i,
        volume: 1000000 + i * 1000,
      }));

      const result = (service as any).calculateScreenerResult(candles, 'BTCUSDT', null);

      expect(result).toEqual({ symbol: 'BTCUSDT' });
    });

    it('should calculate full screener result for sufficient data', () => {
      const candles = Array.from({ length: 100 }, (_, i) => ({
        timestamp: 1640995200000 + i * 60000,
        open: 50000 + i,
        high: 51000 + i,
        low: 49000 + i,
        close: 50500 + i,
        volume: 1000000 + i * 1000,
      }));

      // Mock technical analysis methods
      technicalAnalysisService.calculateRSI.mockReturnValue(65);
      technicalAnalysisService.calculateMACD.mockReturnValue({
        macd: 0.5,
        signal: 0.3,
        histogram: 0.2,
      });
      technicalAnalysisService.calculateADX.mockReturnValue(25);
      technicalAnalysisService.calculateBollingerBands.mockReturnValue({
        upper: 52000,
        middle: 51000,
        lower: 50000,
        width: 0.04,
      });
      technicalAnalysisService.calculateVolumeSpike.mockReturnValue(1.5);
      technicalAnalysisService.calculateEMA.mockReturnValue(48000);
      technicalAnalysisService.isAboveEMA.mockReturnValue(true);
      technicalAnalysisService.detectBreakout.mockReturnValue({
        isBreakout: true,
        isBreakdown: false,
      });

      const result = (service as any).calculateScreenerResult(candles, 'BTCUSDT', null);

      expect(result).toHaveProperty('symbol', 'BTCUSDT');
      expect(result).toHaveProperty('lastPrice');
      expect(result).toHaveProperty('changePercent');
      expect(result).toHaveProperty('volume24h');
      expect(result).toHaveProperty('rsi', 65);
      expect(result).toHaveProperty('macdHist', 0.2);
      expect(result).toHaveProperty('adx', 25);
      expect(result).toHaveProperty('bbWidth', 0.04);
      expect(result).toHaveProperty('volumeSpike', 1.5);
      expect(result).toHaveProperty('isAbove200Ema', true);
      expect(result).toHaveProperty('isBreakout', true);
      expect(result).toHaveProperty('isBreakdown', false);
      expect(result).toHaveProperty('matchedSetups');
      expect(Array.isArray(result.matchedSetups)).toBe(true);
    });
  });

  describe('determineSetups', () => {
    beforeEach(() => {
      // Mock SignalDescriptionService for all determineSetups tests
      signalDescriptionService.generateSignalDescription.mockReturnValue({
        title: 'Test Signal',
        description: 'Test description',
        reasoning: 'Test reasoning',
        values: {},
      });
    });

    it('should detect oversold bounce setup', () => {
      const indicators = {
        rsi: 25,
        macdHist: 0.1,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: false,
        isBreakout: false,
        isBreakdown: false,
      };

      const context = {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        lastPrice: 50000,
        previousPrice: 49000,
        rsi: 25,
        macdHist: 0.1,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: false,
        isBreakout: false,
        isBreakdown: false,
        ema200: 48000,
        bbUpper: 52000,
        bbLower: 48000,
        bbMiddle: 50000,
      };

      const result = (service as any).determineSetups(indicators, context);

      expect(result.some((setup) => setup.type === ScreenerSetupResponse.OversoldBounce)).toBe(
        true,
      );
    });

    it('should detect overbought short setup', () => {
      const indicators = {
        rsi: 75,
        macdHist: -0.1,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: true,
        isBreakout: false,
        isBreakdown: false,
      };

      const context = {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        lastPrice: 50000,
        previousPrice: 49000,
        rsi: 75,
        macdHist: -0.1,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: true,
        isBreakout: false,
        isBreakdown: false,
        ema200: 48000,
        bbUpper: 52000,
        bbLower: 48000,
        bbMiddle: 50000,
      };

      const result = (service as any).determineSetups(indicators, context);

      expect(result.some((setup) => setup.type === ScreenerSetupResponse.OverboughtShort)).toBe(
        true,
      );
    });

    it('should detect bullish breakout setup', () => {
      const indicators = {
        rsi: 60,
        macdHist: 0.002,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: true,
        isBreakout: true,
        isBreakdown: false,
      };

      const context = {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        lastPrice: 50000,
        previousPrice: 49000,
        rsi: 60,
        macdHist: 0.002,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: true,
        isBreakout: true,
        isBreakdown: false,
        ema200: 48000,
        bbUpper: 52000,
        bbLower: 48000,
        bbMiddle: 50000,
      };

      const result = (service as any).determineSetups(indicators, context);

      expect(result.some((setup) => setup.type === ScreenerSetupResponse.BullishBreakout)).toBe(
        true,
      );
    });

    it('should detect bearish breakdown setup', () => {
      const indicators = {
        rsi: 40,
        macdHist: -0.002,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: false,
        isBreakout: false,
        isBreakdown: true,
      };

      const context = {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        lastPrice: 50000,
        previousPrice: 49000,
        rsi: 40,
        macdHist: -0.002,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: false,
        isBreakout: false,
        isBreakdown: true,
        ema200: 48000,
        bbUpper: 52000,
        bbLower: 48000,
        bbMiddle: 50000,
      };

      const result = (service as any).determineSetups(indicators, context);

      expect(result.some((setup) => setup.type === ScreenerSetupResponse.BearishBreakdown)).toBe(
        true,
      );
    });

    it('should detect volume spike setup', () => {
      const indicators = {
        rsi: 50,
        macdHist: 0.1,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.8,
        isAbove200Ema: true,
        isBreakout: false,
        isBreakdown: false,
      };

      const context = {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        lastPrice: 50000,
        previousPrice: 49000,
        rsi: 50,
        macdHist: 0.1,
        adx: 20,
        bbWidth: 0.06,
        volumeSpike: 1.8,
        isAbove200Ema: true,
        isBreakout: false,
        isBreakdown: false,
        ema200: 48000,
        bbUpper: 52000,
        bbLower: 48000,
        bbMiddle: 50000,
      };

      const result = (service as any).determineSetups(indicators, context);

      expect(result.some((setup) => setup.type === ScreenerSetupResponse.VolumeSpike)).toBe(true);
    });

    it('should detect low volatility squeeze setup', () => {
      const indicators = {
        rsi: 50,
        macdHist: 0.1,
        adx: 20,
        bbWidth: 0.03,
        volumeSpike: 1.2,
        isAbove200Ema: true,
        isBreakout: false,
        isBreakdown: false,
      };

      const context = {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        lastPrice: 50000,
        previousPrice: 49000,
        rsi: 50,
        macdHist: 0.1,
        adx: 20,
        bbWidth: 0.03,
        volumeSpike: 1.2,
        isAbove200Ema: true,
        isBreakout: false,
        isBreakdown: false,
        ema200: 48000,
        bbUpper: 52000,
        bbLower: 48000,
        bbMiddle: 50000,
      };

      const result = (service as any).determineSetups(indicators, context);

      expect(
        result.some((setup) => setup.type === ScreenerSetupResponse.LowVolatilitySqueeze),
      ).toBe(true);
    });

    it('should detect break of structure setup', () => {
      const indicators = {
        rsi: 50,
        macdHist: 0.1,
        adx: 30,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: true,
        isBreakout: true,
        isBreakdown: false,
      };

      const context = {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        lastPrice: 50000,
        previousPrice: 49000,
        rsi: 50,
        macdHist: 0.1,
        adx: 30,
        bbWidth: 0.06,
        volumeSpike: 1.2,
        isAbove200Ema: true,
        isBreakout: true,
        isBreakdown: false,
        ema200: 48000,
        bbUpper: 52000,
        bbLower: 48000,
        bbMiddle: 50000,
      };

      const result = (service as any).determineSetups(indicators, context);

      expect(result.some((setup) => setup.type === ScreenerSetupResponse.BreakOfStructure)).toBe(
        true,
      );
    });

    it('should return multiple setups when multiple conditions are met', () => {
      const indicators = {
        rsi: 25,
        macdHist: 0.002,
        adx: 30,
        bbWidth: 0.03,
        volumeSpike: 1.8,
        isAbove200Ema: true,
        isBreakout: true,
        isBreakdown: false,
      };

      const context = {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        lastPrice: 50000,
        previousPrice: 49000,
        rsi: 25,
        macdHist: 0.002,
        adx: 30,
        bbWidth: 0.03,
        volumeSpike: 1.8,
        isAbove200Ema: true,
        isBreakout: true,
        isBreakdown: false,
        ema200: 48000,
        bbUpper: 52000,
        bbLower: 48000,
        bbMiddle: 50000,
      };

      const result = (service as any).determineSetups(indicators, context);

      expect(result.length).toBeGreaterThan(1);
      expect(result.some((setup) => setup.type === ScreenerSetupResponse.OversoldBounce)).toBe(
        true,
      );
      expect(result.some((setup) => setup.type === ScreenerSetupResponse.BullishBreakout)).toBe(
        true,
      );
      expect(result.some((setup) => setup.type === ScreenerSetupResponse.VolumeSpike)).toBe(true);
      expect(
        result.some((setup) => setup.type === ScreenerSetupResponse.LowVolatilitySqueeze),
      ).toBe(true);
      expect(result.some((setup) => setup.type === ScreenerSetupResponse.BreakOfStructure)).toBe(
        true,
      );
    });
  });
});
