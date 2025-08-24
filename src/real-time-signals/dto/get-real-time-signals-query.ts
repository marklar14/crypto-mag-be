import { IsArray, IsBoolean, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { Timeframe } from '../enums/timeframe.enum';

export class GetRealTimeSignalsQuery {
  @IsArray()
  @IsEnum(Timeframe, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Pokud je string s čárkami, rozděl na pole
      return value.split(',').map((v) => v.trim()) as Timeframe[];
    }
    if (Array.isArray(value)) {
      return value;
    }
    // Pokud není zadáno, vrať default
    return [Timeframe.TF1M, Timeframe.TF5M, Timeframe.TF15M, Timeframe.TF1H, Timeframe.TF4H];
  })
  timeframes: Timeframe[] = [
    Timeframe.TF1M,
    Timeframe.TF5M,
    Timeframe.TF15M,
    Timeframe.TF1H,
    Timeframe.TF4H,
  ];

  @IsNumber()
  @Min(40)
  @Max(95)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 70;
    return Number(value);
  })
  threshold: number = 70;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 20;
    return Number(value);
  })
  limit: number = 20;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return Boolean(value);
  })
  adaptiveThresholds: boolean = true;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return Boolean(value);
  })
  tickAnalysis: boolean = true;
}
