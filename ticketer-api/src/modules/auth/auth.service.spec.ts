// uuid v13 is ESM-only; mock it for Jest's CommonJS transform environment
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4-value'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { OtpService } from './otp/otp.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockOtpService = () => ({
  generateAndSend: jest.fn(),
  verify: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-access-token'),
});

const mockRedis = () => ({
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockRepo>;
  let otpSvc: ReturnType<typeof mockOtpService>;
  let jwtSvc: ReturnType<typeof mockJwtService>;
  let redis: ReturnType<typeof mockRedis>;

  function makeUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-uuid',
      email: 'user@test.com',
      phone: null,
      name: 'Test User',
      avatar_url: null,
      auth_provider: 'email',
      capabilities: ['BUYER'],
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    } as User;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: OtpService,      useFactory: mockOtpService },
        { provide: JwtService,      useFactory: mockJwtService },
        { provide: 'REDIS_CLIENT',  useFactory: mockRedis },
      ],
    }).compile();

    service  = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    otpSvc   = module.get(OtpService);
    jwtSvc   = module.get(JwtService);
    redis    = module.get('REDIS_CLIENT');
  });

  // ─── requestOtp ─────────────────────────────────────────────────────────────

  describe('requestOtp()', () => {
    it('AUTH-001: calls otpService.generateAndSend with provided identifier', async () => {
      otpSvc.generateAndSend.mockResolvedValue(undefined);
      await service.requestOtp('user@test.com');
      expect(otpSvc.generateAndSend).toHaveBeenCalledWith('user@test.com');
    });

    it('throws UnauthorizedException if identifier is empty', async () => {
      await expect(service.requestOtp('')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── verifyOtp ──────────────────────────────────────────────────────────────

  describe('verifyOtp()', () => {
    it('AUTH-002: correct OTP + existing user → returns tokens, does not create duplicate', async () => {
      otpSvc.verify.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(makeUser());
      redis.set.mockResolvedValue('OK');

      const tokens = await service.verifyOtp('user@test.com', '123456');

      expect(tokens.access_token).toBe('mock-jwt-access-token');
      expect(tokens.refresh_token).toBeTruthy();
      expect(userRepo.save).not.toHaveBeenCalled(); // no new user created
    });

    it('AUTH-003: correct OTP + new user → creates user with BUYER capability', async () => {
      otpSvc.verify.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(null);
      const newUser = makeUser({ capabilities: ['BUYER'] });
      userRepo.create.mockReturnValue(newUser);
      userRepo.save.mockResolvedValue(newUser);
      redis.set.mockResolvedValue('OK');

      const tokens = await service.verifyOtp('newuser@test.com', '654321');

      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(tokens.access_token).toBeTruthy();
    });

    it('AUTH-004: wrong OTP → throws UnauthorizedException', async () => {
      otpSvc.verify.mockResolvedValue(false);
      await expect(service.verifyOtp('user@test.com', '999999')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── refreshTokens ──────────────────────────────────────────────────────────

  describe('refreshTokens()', () => {
    it('AUTH-005: valid refresh token → rotates token (deletes old), returns new pair', async () => {
      redis.get.mockResolvedValue('user-uuid');
      redis.del.mockResolvedValue(1);
      userRepo.findOne.mockResolvedValue(makeUser());
      redis.set.mockResolvedValue('OK');

      const tokens = await service.refreshTokens('valid-refresh-token');

      expect(redis.del).toHaveBeenCalledWith('rt:valid-refresh-token');
      expect(tokens.access_token).toBeTruthy();
      expect(tokens.refresh_token).toBeTruthy();
      // New refresh token must be different
      expect(tokens.refresh_token).not.toBe('valid-refresh-token');
    });

    it('AUTH-006: invalid / expired refresh token → throws UnauthorizedException', async () => {
      redis.get.mockResolvedValue(null);
      await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('AUTH-015: token rotation — reusing the same refresh token a second time fails', async () => {
      // First call: token is valid
      redis.get
        .mockResolvedValueOnce('user-uuid')
        .mockResolvedValueOnce(null); // second call: already deleted
      redis.del.mockResolvedValue(1);
      userRepo.findOne.mockResolvedValue(makeUser());
      redis.set.mockResolvedValue('OK');

      const first = await service.refreshTokens('old-rt');
      // Simulate trying to reuse the original token (which was deleted)
      await expect(service.refreshTokens('old-rt')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── generateTokens ─────────────────────────────────────────────────────────

  describe('generateTokens()', () => {
    it('AUTH-007: JWT payload contains sub and capabilities', async () => {
      redis.set.mockResolvedValue('OK');
      const user = makeUser({ id: 'uid-1', capabilities: ['BUYER', 'HOST'] });

      await service.generateTokens(user);

      expect(jwtSvc.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'uid-1', capabilities: ['BUYER', 'HOST'] })
      );
    });

    it('refresh token is stored in Redis with 7-day TTL', async () => {
      redis.set.mockResolvedValue('OK');
      const user = makeUser();

      await service.generateTokens(user);

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^rt:/),
        user.id,
        'EX',
        7 * 24 * 60 * 60,
      );
    });
  });

  // ─── validateOAuthUser ──────────────────────────────────────────────────────

  describe('validateOAuthUser()', () => {
    it('AUTH-008: new Google user is created with auth_provider: google', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const profile = { email: 'new@google.com', name: 'Google User', picture: null, provider: 'google' };
      const newUser = makeUser({ email: profile.email, auth_provider: 'google' });
      userRepo.create.mockReturnValue(newUser);
      userRepo.save.mockResolvedValue(newUser);

      const result = await service.validateOAuthUser(profile);

      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(result.auth_provider).toBe('google');
    });

    it('AUTH-009: existing user is returned without creating a duplicate', async () => {
      const existingUser = makeUser({ email: 'existing@google.com' });
      userRepo.findOne.mockResolvedValue(existingUser);

      const result = await service.validateOAuthUser({ email: 'existing@google.com', name: 'X', picture: null, provider: 'google' });

      expect(userRepo.save).not.toHaveBeenCalled();
      expect(result).toBe(existingUser);
    });
  });
});
