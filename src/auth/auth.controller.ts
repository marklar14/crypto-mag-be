import { Controller, Post, UnauthorizedException, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('token')
  getAccessToken(@Headers('x-api-key') apiKey: string) {
    const frontendApiKey = this.configService.get<string>('FRONTEND_API_KEY');
    if (apiKey !== frontendApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    const clientId = 'frontend-angular-app';
    return this.authService.issueToken(clientId);
  }
}
