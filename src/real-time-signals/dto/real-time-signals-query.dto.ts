import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Timeframe } from '../enums/timeframe.enum';

export class RealTimeSignalsQueryDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Timeframe, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((tf: string) => tf.trim());
    }
    return value;
  })
  timeframes: Timeframe[] = [
    Timeframe.TF1M,
    Timeframe.TF5M,
    Timeframe.TF15M,
    Timeframe.TF1H,
    Timeframe.TF4H,
  ];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  threshold: number = 70;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  adaptiveThresholds: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  tickAnalysis: boolean = true;
}
