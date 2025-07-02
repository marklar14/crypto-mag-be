import { Injectable } from '@nestjs/common';
import { SignalDescription, ScreenerSetupResponse } from './response/screener-setup-response';

export interface SignalContext {
  symbol: string;
  timeframe: string;
  lastPrice: number;
  previousPrice: number;
  rsi: number;
  macdHist: number;
  adx: number;
  bbWidth: number;
  volumeSpike: number;
  isAbove200Ema: boolean;
  isBreakout: boolean;
  isBreakdown: boolean;
  ema200?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
}

@Injectable()
export class SignalDescriptionService {
  private readonly signalTemplates = {
    [ScreenerSetupResponse.OversoldBounce]: {
      title: 'Oversold Bounce Signal',
      descriptionTemplate: 'RSI indicates oversold conditions at {rsi}',
      reasoningTemplate:
        'Price is likely to bounce from oversold levels. RSI at {rsi} is below the oversold threshold of 30, suggesting potential reversal.',
    },
    [ScreenerSetupResponse.OverboughtShort]: {
      title: 'Overbought Short Signal',
      descriptionTemplate: 'RSI indicates overbought conditions at {rsi}',
      reasoningTemplate:
        'Price is likely to decline from overbought levels. RSI at {rsi} is above the overbought threshold of 70, suggesting potential reversal.',
    },
    [ScreenerSetupResponse.BullishBreakout]: {
      title: 'Bullish Breakout Signal',
      descriptionTemplate: 'MACD histogram positive at {macdHist} with price above EMA200',
      reasoningTemplate:
        'MACD histogram is positive ({macdHist}) indicating bullish momentum. Price at {lastPrice} is above EMA200 ({ema200}), confirming bullish trend.',
    },
    [ScreenerSetupResponse.BearishBreakdown]: {
      title: 'Bearish Breakdown Signal',
      descriptionTemplate: 'MACD histogram negative at {macdHist} with price below EMA200',
      reasoningTemplate:
        'MACD histogram is negative ({macdHist}) indicating bearish momentum. Price at {lastPrice} is below EMA200 ({ema200}), confirming bearish trend.',
    },
    [ScreenerSetupResponse.LowVolatilitySqueeze]: {
      title: 'Low Volatility Squeeze Signal',
      descriptionTemplate: 'Bollinger Bands width at {bbWidth} indicates low volatility',
      reasoningTemplate:
        'Bollinger Bands width is {bbWidth} (below 0.05 threshold), indicating low volatility and potential breakout. Upper band at {bbUpper}, lower band at {bbLower}.',
    },
    [ScreenerSetupResponse.VolumeSpike]: {
      title: 'Volume Spike Signal',
      descriptionTemplate: 'Volume spike detected at {volumeSpike}x average',
      reasoningTemplate:
        'Volume is {volumeSpike}x the average volume, indicating strong market interest and potential price movement.',
    },
    [ScreenerSetupResponse.BreakOfStructure]: {
      title: 'Break of Structure Signal',
      descriptionTemplate: 'Strong trend (ADX: {adx}) with breakout confirmation',
      reasoningTemplate:
        'ADX at {adx} indicates strong trend. Breakout detected with price movement from {previousPrice} to {lastPrice}, suggesting continuation of trend.',
    },
    [ScreenerSetupResponse.TrendReversalLong]: {
      title: 'Trend Reversal Long Signal',
      descriptionTemplate: 'Potential bullish reversal with RSI at {rsi}',
      reasoningTemplate:
        'RSI at {rsi} suggests potential bullish reversal. Price change from {previousPrice} to {lastPrice} ({changePercent}%) indicates momentum shift.',
    },
    [ScreenerSetupResponse.TrendReversalShort]: {
      title: 'Trend Reversal Short Signal',
      descriptionTemplate: 'Potential bearish reversal with RSI at {rsi}',
      reasoningTemplate:
        'RSI at {rsi} suggests potential bearish reversal. Price change from {previousPrice} to {lastPrice} ({changePercent}%) indicates momentum shift.',
    },
    [ScreenerSetupResponse.RsiDivergence]: {
      title: 'RSI Divergence Signal',
      descriptionTemplate: 'RSI divergence detected at {rsi}',
      reasoningTemplate:
        'RSI divergence detected at {rsi}. Price and RSI are moving in opposite directions, suggesting potential reversal.',
    },
  };

  generateSignalDescription(
    signalType: ScreenerSetupResponse,
    context: SignalContext,
  ): SignalDescription {
    const template = this.signalTemplates[signalType];
    if (!template) {
      return this.generateDefaultDescription(signalType, context);
    }

    const changePercent =
      ((context.lastPrice - context.previousPrice) / context.previousPrice) * 100;

    const values = {
      symbol: context.symbol,
      timeframe: context.timeframe,
      lastPrice: context.lastPrice,
      previousPrice: context.previousPrice,
      changePercent: changePercent.toFixed(2),
      rsi: context.rsi.toFixed(2),
      macdHist: context.macdHist.toFixed(4),
      adx: context.adx.toFixed(2),
      bbWidth: context.bbWidth.toFixed(4),
      volumeSpike: context.volumeSpike.toFixed(2),
      isAbove200Ema: context.isAbove200Ema.toString(),
      ema200: context.ema200?.toFixed(2) || 'N/A',
      bbUpper: context.bbUpper?.toFixed(2) || 'N/A',
      bbLower: context.bbLower?.toFixed(2) || 'N/A',
      bbMiddle: context.bbMiddle?.toFixed(2) || 'N/A',
    };

    return {
      title: template.title,
      description: this.replaceTemplateVariables(template.descriptionTemplate, values),
      reasoning: this.replaceTemplateVariables(template.reasoningTemplate, values),
      values,
    };
  }

  private replaceTemplateVariables(
    template: string,
    values: Record<string, number | string>,
  ): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return values[key]?.toString() || match;
    });
  }

  private generateDefaultDescription(
    signalType: ScreenerSetupResponse,
    context: SignalContext,
  ): SignalDescription {
    return {
      title: `${signalType} Signal`,
      description: `Signal detected for ${context.symbol} on ${context.timeframe} timeframe`,
      reasoning: `Technical analysis indicates ${signalType.toLowerCase()} conditions with current price at ${context.lastPrice}`,
      values: {
        symbol: context.symbol,
        timeframe: context.timeframe,
        lastPrice: context.lastPrice,
        previousPrice: context.previousPrice,
        rsi: context.rsi.toFixed(2),
        macdHist: context.macdHist.toFixed(4),
        adx: context.adx.toFixed(2),
        bbWidth: context.bbWidth.toFixed(4),
        volumeSpike: context.volumeSpike.toFixed(2),
      },
    };
  }

  // Helper method to get all available signal types
  getAvailableSignalTypes(): ScreenerSetupResponse[] {
    return Object.values(ScreenerSetupResponse);
  }

  // Helper method to get template for a specific signal type
  getSignalTemplate(signalType: ScreenerSetupResponse) {
    return this.signalTemplates[signalType];
  }
}
