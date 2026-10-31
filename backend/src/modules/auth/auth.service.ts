import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto.js';
import { UserRole } from '@modules/users/entities/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(registerDto: CreateUserDto) {
    const user = await this.usersService.create(registerDto);
    const tokens = await this.generateTokens(user.id, user.roles);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Incorrect login credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect login credentials');
    }

    const tokens = await this.generateTokens(user.id, user.roles);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
      },
      ...tokens,
    };
  }

  async generateTokens(userId: string, roles: UserRole[] | string[]) {
    const jti = crypto.randomUUID();
    const payload = { sub: userId, roles, jti };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'secretKey',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refreshSecretKey',
        expiresIn: '7d',
      }),
    ]);

    await this.saveRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, rawToken: string): Promise<RefreshToken> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
      isRevoked: false,
    });

    return await this.refreshTokenRepository.save(refreshTokenEntity);
  }

  async refreshTokens(rawRefreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refreshSecretKey',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    let tokenRecord = await this.refreshTokenRepository.findOne({
      where: { tokenHash, isRevoked: false },
    });

    if (!tokenRecord) {
      tokenRecord = await this.refreshTokenRepository.findOne({
        where: { tokenHash: rawRefreshToken, isRevoked: false },
      });
    }

    if (!tokenRecord) {
      throw new UnauthorizedException('The token has been invalidated or does not exist');
    }

    if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('The token has expired');
    }

    tokenRecord.isRevoked = true;
    await this.refreshTokenRepository.save(tokenRecord);

    const user = await this.usersService.findOne(payload.sub);
    const tokens = await this.generateTokens(user.id, user.roles);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.refreshTokenRepository.update({ tokenHash }, { isRevoked: true });
    await this.refreshTokenRepository.update({ tokenHash: refreshToken }, { isRevoked: true });
  }
}
