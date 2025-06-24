import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  };

  beforeEach(async () => {
    process.env.OAUTH_CLIENT_ID = 'test-client';
    process.env.OAUTH_CLIENT_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueToken', () => {
    it('should return a valid token object', () => {
      const result = service.issueToken('test-client');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { clientId: 'test-client' },
        { expiresIn: '1h' },
      );
      expect(result).toEqual({
        access_token: 'mocked-jwt-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });
    });
  });
});
