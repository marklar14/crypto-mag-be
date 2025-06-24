import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    issueToken: jest.fn().mockReturnValue({
      access_token: 'mocked-token',
      token_type: 'Bearer',
      expires_in: 3600,
    }),
  };

  beforeEach(async () => {
    process.env.FRONTEND_API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return token for valid API key', () => {
    const result = controller.getAccessToken('test-api-key');
    expect(result).toEqual({
      access_token: 'mocked-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });
    expect(authService.issueToken).toHaveBeenCalledWith('frontend-angular-app');
  });

  it('should throw UnauthorizedException for invalid API key', () => {
    expect(() => controller.getAccessToken('invalid-key')).toThrow(UnauthorizedException);
  });
});
