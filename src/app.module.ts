import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BybitController } from './bybit/bybit.controller';
import { BybitService } from './bybit/bybit.service';
import { AuthModule } from './auth/auth.module';
import { JwtService } from './auth/jwt/jwt.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  controllers: [BybitController],
  providers: [BybitService, JwtService],
})
export class AppModule {}
