export interface DynamicThresholds {
  priceChange: {
    moderate: number;
    significant: number;
    strong: number;
    explosive: number;
  };
  volumeSpike: {
    moderate: number;
    high: number;
    extreme: number;
  };
  percentiles: {
    priceChange: number[];
    volumeSpike: number[];
  };
}

export interface TickAnalysis {
  priceMomentum: number;
  volumePressure: number;
  tickFrequency: number;
  largeOrders: number;
}

import { Timeframe } from '../enums/timeframe.enum';

export type SignalType = 'pump' | 'dump' | 'sideways';

export interface RealTimeSignal {
  symbol: string;
  timeframe: Timeframe;
  signalType: SignalType;
  confidence: number;
  priceChange: number;
  volumeChange: number;
  metrics: {
    priceChange: number;
    volumeSpike: number;
    momentum: number;
    volatility: number;
  };
  tickAnalysis?: TickAnalysis | null;
  timestamp: string;
}

export interface RealTimeSignalResponse {
  signals: RealTimeSignal[];
  metadata: {
    scanTime: number;
    totalInstruments: number;
    signalsFound: number;
    thresholds: { [key: string]: DynamicThresholds };
  };
}
