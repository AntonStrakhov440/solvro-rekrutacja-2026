import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UsersService } from '@modules/users/users.service.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { UserRole } from '@modules/users/entities/user.entity.js';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => {
  return {
    compare: vi.fn(),
    hash: vi.fn(),
    genSalt: vi.fn(),
    default: {
      compare: vi.fn(),
      hash: vi.fn(),
      genSalt: vi.fn(),
    },
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let refreshTokenRepository: any;

  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2b$10$hashedpassword',
    roles: [UserRole.USER],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    usersService = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findOne: vi.fn(),
    };

    jwtService = {
      signAsync: vi.fn(),
      verify: vi.fn(),
    };

    refreshTokenRepository = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'StrongPassword123!',
    };

    it('should register a new user and return tokens and user profile', async () => {
      // Arrange
      usersService.create.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token-xyz')
        .mockResolvedValueOnce('refresh-token-xyz');
      refreshTokenRepository.create.mockImplementation((dto: any) => dto);
      refreshTokenRepository.save.mockResolvedValue({});

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(result.accessToken).toBe('access-token-xyz');
      expect(result.refreshToken).toBe('refresh-token-xyz');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        roles: mockUser.roles,
      });
      expect(refreshTokenRepository.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'CorrectPassword123!',
    };

    it('should authenticate user and return tokens when credentials are valid', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token-123')
        .mockResolvedValueOnce('refresh-token-123');
      refreshTokenRepository.create.mockImplementation((dto: any) => dto);
      refreshTokenRepository.save.mockResolvedValue({});

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-123');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    const rawRefreshToken = 'valid-refresh-token';

    it('should return a new pair of tokens when refresh token is valid', async () => {
      // Arrange
      jwtService.verify.mockReturnValue({ sub: mockUser.id, roles: mockUser.roles });
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const tokenRecord = {
        id: 'token-uuid',
        tokenHash: 'hashed-token',
        isRevoked: false,
        expiresAt: futureDate,
      };
      refreshTokenRepository.findOne.mockResolvedValue(tokenRecord);
      refreshTokenRepository.save.mockResolvedValue(tokenRecord);
      usersService.findOne.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      refreshTokenRepository.create.mockImplementation((dto: any) => dto);

      // Act
      const result = await service.refreshTokens(rawRefreshToken);

      // Assert
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(tokenRecord.isRevoked).toBe(true);
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(tokenRecord);
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      // Act & Assert
      await expect(service.refreshTokens(rawRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token record is not found in database', async () => {
      // Arrange
      jwtService.verify.mockReturnValue({ sub: mockUser.id });
      refreshTokenRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshTokens(rawRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is expired in database', async () => {
      // Arrange
      jwtService.verify.mockReturnValue({ sub: mockUser.id });
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      refreshTokenRepository.findOne.mockResolvedValue({
        id: 'token-uuid',
        isRevoked: false,
        expiresAt: pastDate,
      });

      // Act & Assert
      await expect(service.refreshTokens(rawRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke token in repository', async () => {
      refreshTokenRepository.update.mockResolvedValue({ affected: 1 });
      await service.logout('refresh-token-xyz');
      expect(refreshTokenRepository.update).toHaveBeenCalled();
    });
  });
});
