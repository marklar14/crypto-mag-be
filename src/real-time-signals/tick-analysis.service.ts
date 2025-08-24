import { Injectable } from '@nestjs/common';
import { BybitService } from '../bybit/bybit.service';
import { TickAnalysis } from './response/real-time-signal-response';

@Injectable()
export class TickAnalysisService {
  constructor(private readonly bybitService: BybitService) {}

  async analyzeTickData(symbol: string): Promise<TickAnalysis> {
    try {
      // Načteme posledních 100 ticků (1 minutové svíčky)
      const candles = await this.bybitService.getCandles(symbol, '1', 100);

      if (candles.length < 10) {
        return this.getDefaultTickAnalysis();
      }

      // Vypočítáme cenový momentum
      const priceMomentum = this.calculatePriceMomentum(candles);

      // Vypočítáme volume pressure
      const volumePressure = this.calculateVolumePressure(candles);

      // Vypočítáme tick frequency
      const tickFrequency = this.calculateTickFrequency(candles);

      // Vypočítáme large orders
      const largeOrders = this.calculateLargeOrders(candles);

      return {
        priceMomentum,
        volumePressure,
        tickFrequency,
        largeOrders,
      };
    } catch (error) {
      console.error(`Error analyzing tick data for ${symbol}:`, error);
      return this.getDefaultTickAnalysis();
    }
  }

  private calculatePriceMomentum(candles: any[]): number {
    if (candles.length < 5) return 0;

    // Vypočítáme momentum na základě posledních 5 svíček
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

    // Vypočítáme volume pressure na základě posledních 10 svíček
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
    if (totalVolume === 0) return 0.5; // Neutrální pokud není žádný volume

    // Vrátíme poměr buy pressure (0-1, kde 1 = čistě buy pressure)
    return buyPressure / totalVolume;
  }

  private calculateTickFrequency(candles: any[]): number {
    if (candles.length < 5) return 0;

    // Vypočítáme průměrnou frekvenci ticků na základě volume
    const recentCandles = candles.slice(-5);
    const totalVolume = recentCandles.reduce((sum, candle) => sum + parseFloat(candle.volume), 0);
    const avgVolume = totalVolume / recentCandles.length;

    // Normalizujeme na škálu 0-1 (vyšší = více ticků)
    // Použijeme menší normalizační faktor pro lepší citlivost
    return Math.min(avgVolume / 100000, 1); // Normalizováno na 100K volume
  }

  private calculateLargeOrders(candles: any[]): number {
    if (candles.length < 10) return 0;

    // Vypočítáme počet velkých objednávek na základě volume spike'ů
    const recentCandles = candles.slice(-10);
    const volumes = recentCandles.map((candle) => parseFloat(candle.volume));
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;

    let largeOrderCount = 0;
    for (const volume of volumes) {
      if (volume > avgVolume * 2) {
        // Volume spike 2x vyšší než průměr
        largeOrderCount++;
      }
    }

    return largeOrderCount;
  }

  private getDefaultTickAnalysis(): TickAnalysis {
    return {
      priceMomentum: 0,
      volumePressure: 0.5, // Neutrální
      tickFrequency: 0,
      largeOrders: 0,
    };
  }
}
