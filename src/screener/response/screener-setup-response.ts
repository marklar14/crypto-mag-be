export interface SignalDescription {
  title: string;
  description: string;
  reasoning: string;
  values: Record<string, number | string>;
}

export interface ScreenerSetup {
  type: ScreenerSetupResponse;
  description: SignalDescription;
}

export enum ScreenerSetupResponse {
  BullishBreakout = 'BullishBreakout',
  BearishBreakdown = 'BearishBreakdown',
  OversoldBounce = 'OversoldBounce',
  OverboughtShort = 'OverboughtShort',
  LowVolatilitySqueeze = 'LowVolatilitySqueeze',
  TrendReversalLong = 'TrendReversalLong',
  TrendReversalShort = 'TrendReversalShort',
  VolumeSpike = 'VolumeSpike',
  RsiDivergence = 'RsiDivergence',
  BreakOfStructure = 'BreakOfStructure',
}
