import { Module } from '@nestjs/common';
import { BybitController } from './bybit.controller';
import { BybitService } from './bybit.service';

@Module({
  controllers: [BybitController],
  providers: [BybitService],
  exports: [BybitService],
})
export class BybitModule {}
