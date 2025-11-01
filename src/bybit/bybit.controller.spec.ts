import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BybitController } from './bybit.controller';
import { BybitService } from './bybit.service';

describe('BybitController', () => {
  let controller: BybitController;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'BYBIT_API_KEY') return 'test-api-key';
        if (key === 'BYBIT_API_SECRET') return 'test-api-secret';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BybitController],
      providers: [
        BybitService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<BybitController>(BybitController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
