import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthResponse = {
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test@example.com',
      username: 'testuser',
      roles: ['user'],
    },
    accessToken: 'access-jwt-token',
    refreshToken: 'refresh-jwt-token',
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: vi.fn().mockResolvedValue(mockAuthResponse),
      login: vi.fn().mockResolvedValue(mockAuthResponse),
      refreshTokens: vi.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }),
    };

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
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and return auth tokens', async () => {
      const dto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      const result = await controller.register(dto);
      expect(result).toEqual(mockAuthResponse);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login a user and return auth tokens', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = await controller.login(dto);
      expect(result).toEqual(mockAuthResponse);
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens and return a new token pair', async () => {
      const dto = { refreshToken: 'valid-refresh-token' };

      const result = await controller.refresh(dto);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(service.refreshTokens).toHaveBeenCalledWith(dto.refreshToken);
    });
  });
});
