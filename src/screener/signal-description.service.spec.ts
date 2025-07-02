import { Test, TestingModule } from '@nestjs/testing';
import { SignalDescriptionService, SignalContext } from './signal-description.service';
import { ScreenerSetupResponse } from './response/screener-setup-response';

describe('SignalDescriptionService', () => {
  let service: SignalDescriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SignalDescriptionService],
    }).compile();

    service = module.get<SignalDescriptionService>(SignalDescriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSignalDescription', () => {
    const mockContext: SignalContext = {
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

    it('should generate oversold bounce description', () => {
      const description = service.generateSignalDescription(
        ScreenerSetupResponse.OversoldBounce,
        mockContext,
      );

      expect(description.title).toBe('Oversold Bounce Signal');
      expect(description.description).toContain('RSI indicates oversold conditions at 25.00');
      expect(description.reasoning).toContain('RSI at 25.00 is below the oversold threshold of 30');
      expect(description.values.rsi).toBe('25.00');
      expect(description.values.symbol).toBe('BTCUSDT');
    });

    it('should generate overbought short description', () => {
      const context = { ...mockContext, rsi: 75 };
      const description = service.generateSignalDescription(
        ScreenerSetupResponse.OverboughtShort,
        context,
      );

      expect(description.title).toBe('Overbought Short Signal');
      expect(description.description).toContain('RSI indicates overbought conditions at 75.00');
      expect(description.reasoning).toContain(
        'RSI at 75.00 is above the overbought threshold of 70',
      );
    });

    it('should generate bullish breakout description', () => {
      const description = service.generateSignalDescription(
        ScreenerSetupResponse.BullishBreakout,
        mockContext,
      );

      expect(description.title).toBe('Bullish Breakout Signal');
      expect(description.description).toContain(
        'MACD histogram positive at 0.0020 with price above EMA200',
      );
      expect(description.reasoning).toContain('Price at 50000 is above EMA200 (48000.00)');
      expect(description.values.macdHist).toBe('0.0020');
      expect(description.values.ema200).toBe('48000.00');
    });

    it('should generate bearish breakdown description', () => {
      const context = { ...mockContext, macdHist: -0.003, isAbove200Ema: false, ema200: 52000 };
      const description = service.generateSignalDescription(
        ScreenerSetupResponse.BearishBreakdown,
        context,
      );

      expect(description.title).toBe('Bearish Breakdown Signal');
      expect(description.description).toContain(
        'MACD histogram negative at -0.0030 with price below EMA200',
      );
      expect(description.reasoning).toContain('Price at 50000 is below EMA200 (52000.00)');
    });

    it('should generate low volatility squeeze description', () => {
      const description = service.generateSignalDescription(
        ScreenerSetupResponse.LowVolatilitySqueeze,
        mockContext,
      );

      expect(description.title).toBe('Low Volatility Squeeze Signal');
      expect(description.description).toContain(
        'Bollinger Bands width at 0.0300 indicates low volatility',
      );
      expect(description.reasoning).toContain('Upper band at 52000.00, lower band at 48000.00');
      expect(description.values.bbWidth).toBe('0.0300');
    });

    it('should generate volume spike description', () => {
      const description = service.generateSignalDescription(
        ScreenerSetupResponse.VolumeSpike,
        mockContext,
      );

      expect(description.title).toBe('Volume Spike Signal');
      expect(description.description).toContain('Volume spike detected at 1.80x average');
      expect(description.reasoning).toContain('Volume is 1.80x the average volume');
      expect(description.values.volumeSpike).toBe('1.80');
    });

    it('should generate break of structure description', () => {
      const description = service.generateSignalDescription(
        ScreenerSetupResponse.BreakOfStructure,
        mockContext,
      );

      expect(description.title).toBe('Break of Structure Signal');
      expect(description.description).toContain(
        'Strong trend (ADX: 30.00) with breakout confirmation',
      );
      expect(description.reasoning).toContain(
        'Breakout detected with price movement from 49000 to 50000',
      );
      expect(description.values.adx).toBe('30.00');
    });

    it('should calculate change percent correctly', () => {
      const description = service.generateSignalDescription(
        ScreenerSetupResponse.TrendReversalLong,
        mockContext,
      );

      expect(description.values.changePercent).toBe('2.04'); // (50000-49000)/49000 * 100
    });

    it('should handle missing optional values', () => {
      const contextWithoutOptional = {
        ...mockContext,
        ema200: undefined,
        bbUpper: undefined,
        bbLower: undefined,
        bbMiddle: undefined,
      };

      const description = service.generateSignalDescription(
        ScreenerSetupResponse.BullishBreakout,
        contextWithoutOptional,
      );

      expect(description.values.ema200).toBe('N/A');
      expect(description.values.bbUpper).toBe('N/A');
      expect(description.values.bbLower).toBe('N/A');
      expect(description.values.bbMiddle).toBe('N/A');
    });

    it('should generate default description for unknown signal type', () => {
      const description = service.generateSignalDescription(
        'UnknownSignal' as ScreenerSetupResponse,
        mockContext,
      );

      expect(description.title).toBe('UnknownSignal Signal');
      expect(description.description).toContain('Signal detected for BTCUSDT on 1h timeframe');
      expect(description.reasoning).toContain(
        'Technical analysis indicates unknownsignal conditions',
      );
    });
  });

  describe('helper methods', () => {
    it('should return all available signal types', () => {
      const signalTypes = service.getAvailableSignalTypes();

      expect(signalTypes).toContain(ScreenerSetupResponse.OversoldBounce);
      expect(signalTypes).toContain(ScreenerSetupResponse.OverboughtShort);
      expect(signalTypes).toContain(ScreenerSetupResponse.BullishBreakout);
      expect(signalTypes).toContain(ScreenerSetupResponse.BearishBreakdown);
      expect(signalTypes).toContain(ScreenerSetupResponse.LowVolatilitySqueeze);
      expect(signalTypes).toContain(ScreenerSetupResponse.VolumeSpike);
      expect(signalTypes).toContain(ScreenerSetupResponse.BreakOfStructure);
      expect(signalTypes).toContain(ScreenerSetupResponse.TrendReversalLong);
      expect(signalTypes).toContain(ScreenerSetupResponse.TrendReversalShort);
      expect(signalTypes).toContain(ScreenerSetupResponse.RsiDivergence);
    });

    it('should return template for specific signal type', () => {
      const template = service.getSignalTemplate(ScreenerSetupResponse.OversoldBounce);

      expect(template).toBeDefined();
      expect(template.title).toBe('Oversold Bounce Signal');
      expect(template.descriptionTemplate).toContain('{rsi}');
      expect(template.reasoningTemplate).toContain('{rsi}');
    });
  });
});
