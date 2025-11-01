import { Injectable, Logger } from '@nestjs/common';
import { BybitService } from '../bybit/bybit.service';
import { TickAnalysis } from './response/real-time-signal-response';

@Injectable()
export class TickAnalysisService {
  private readonly logger = new Logger(TickAnalysisService.name);

  constructor(private readonly bybitService: BybitService) {}

  async analyzeTickData(symbol: string): Promise<TickAnalysis> {
    try {
      const candles = await this.bybitService.getCandles(symbol, '1', 100);

      if (candles.length < 10) {
        return this.getDefaultTickAnalysis();
      }

      const priceMomentum = this.calculatePriceMomentum(candles);
      const volumePressure = this.calculateVolumePressure(candles);
      const tickFrequency = this.calculateTickFrequency(candles);
      const largeOrders = this.calculateLargeOrders(candles);

      return {
        priceMomentum,
        volumePressure,
        tickFrequency,
        largeOrders,
      };
    } catch (error) {
      this.logger.debug(
        `Error analyzing tick data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return this.getDefaultTickAnalysis();
    }
  }

  private calculatePriceMomentum(candles: any[]): number {
    if (candles.length < 5) return 0;

    const recentCandles = candles.slice(-5);
    let momentum = 0;

    for (let i = 1; i < recentCandles.length; i++) {
      const prevClose = parseFloat(recentCandles[i - 1].close);
      const currentClose = parseFloat(recentCandles[i].close);
      const change = ((currentClose - prevClose) / prevClose) * 100;
      momentum += change;
    }

    return momentum / (recentCandles.length - 1);
  }

  private calculateVolumePressure(candles: any[]): number {
    if (candles.length < 10) return 0;

    const recentCandles = candles.slice(-10);
    let buyPressure = 0;
    let sellPressure = 0;

    for (let i = 1; i < recentCandles.length; i++) {
      const prevClose = parseFloat(recentCandles[i - 1].close);
      const currentClose = parseFloat(recentCandles[i].close);
      const volume = parseFloat(recentCandles[i].volume);

      if (currentClose > prevClose) {
        buyPressure += volume;
      } else if (currentClose < prevClose) {
        sellPressure += volume;
      }
    }

    const totalVolume = buyPressure + sellPressure;
    if (totalVolume === 0) return 0.5;

    return buyPressure / totalVolume;
  }

  private calculateTickFrequency(candles: any[]): number {
    if (candles.length < 5) return 0;

    const recentCandles = candles.slice(-5);
    const totalVolume = recentCandles.reduce((sum, candle) => sum + parseFloat(candle.volume), 0);
    const avgVolume = totalVolume / recentCandles.length;

    return Math.min(avgVolume / 100000, 1);
  }

  private calculateLargeOrders(candles: any[]): number {
    if (candles.length < 10) return 0;

    const recentCandles = candles.slice(-10);
    const volumes = recentCandles.map((candle) => parseFloat(candle.volume));
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;

    let largeOrderCount = 0;
    for (const volume of volumes) {
      if (volume > avgVolume * 2) {
        largeOrderCount++;
      }
    }

    return largeOrderCount;
  }

  private getDefaultTickAnalysis(): TickAnalysis {
    return {
      priceMomentum: 0,
      volumePressure: 0.5,
      tickFrequency: 0,
      largeOrders: 0,
    };
  }
}
