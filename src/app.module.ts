import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BybitController } from './bybit/bybit.controller';
import { BybitService } from './bybit/bybit.service';
import { AuthModule } from './auth/auth.module';
import { JwtService } from './auth/jwt/jwt.service';
import { ScreenerModule } from './screener/screener.module';
import { CoinGeckoModule } from './integrations/coingecko/coingecko.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, ScreenerModule, CoinGeckoModule],
  controllers: [BybitController],
  providers: [BybitService, JwtService],
})
export class AppModule {}
