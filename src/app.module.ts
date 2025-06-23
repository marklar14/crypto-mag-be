import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BybitController } from './bybit/bybit.controller';
import { BybitService } from './bybit/bybit.service';

@Module({
  imports: [],
  controllers: [AppController, BybitController],
  providers: [AppService, BybitService],
})
export class AppModule {}
