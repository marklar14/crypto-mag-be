import { IsArray, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTickersQuery {
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  @IsString({ each: true })
  symbols?: string[];
}
