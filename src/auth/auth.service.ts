import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';
import { JwtPayload } from './interfaces';
import { OAuthUserDto } from 'src/modules/user/dto/oauth-user-dto';
import { TokenCreationException } from 'src/shared/exceptions/common.exception';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    public async validateUser(email: string, password: string): Promise<User> {
        const validatedUser = await this.userService.validateUserCredentials(email, password);
        if (!validatedUser) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return validatedUser;
    }

    /**
     * Validates the OAuth login by checking if the user exists in the database.
     * If the user does not exist, a new OAuth user is created. Finally, a JWT token is created for the user.
     *
     * @param profile - The OAuth user profile.
     *
     * @returns A promise that resolves to the access token.
     * @throws NotFoundException if failed to validate OAuth login.
     */
    public async validateOAuthLogin(profile: OAuthUserDto): Promise<string> {
        let user = await this.userService.getUserByEmail(profile.email);
        if (!user) {
            user = await this.userService.createOAuthUser(profile);
        }

        const accessToken = this.createTokenForUser(user).accessToken;
        if (!accessToken) {
            throw new TokenCreationException('Failed to validate OAuth login');
        }

        return accessToken;
    }

    public createTokenForUser(user: User): JwtPayload {
        const payload = { username: user.email, sub: user.id };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        };
    }

    public async createRefreshToken(userId: number): Promise<string> {
        // Revoke existing refresh tokens for this user
        await this.refreshTokenRepository.update({ userId, isRevoked: false }, { isRevoked: true });

        // Create new refresh token
        const payload = { sub: userId, type: 'refresh' };
        const token = this.jwtService.sign(payload, { expiresIn: '30d' });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const refreshToken = this.refreshTokenRepository.create({
            token,
            userId,
            expiresAt,
        });

        await this.refreshTokenRepository.save(refreshToken);
        return token;
    }

    public async validateRefreshToken(token: string): Promise<User> {
        // Verify JWT signature and expiration
        let payload: any;
        try {
            payload = this.jwtService.verify(token);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Check if token exists in database and is not revoked
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: { token, isRevoked: false },
            relations: ['user'],
        });

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found or revoked');
        }

        // Check if token is expired
        if (refreshToken.expiresAt < new Date()) {
            await this.refreshTokenRepository.update({ id: refreshToken.id }, { isRevoked: true });
            throw new UnauthorizedException('Refresh token expired');
        }

        return refreshToken.user;
    }

    public async revokeRefreshToken(token: string): Promise<void> {
        await this.refreshTokenRepository.update({ token }, { isRevoked: true });
    }

    public async revokeAllUserRefreshTokens(userId: number): Promise<void> {
        await this.refreshTokenRepository.update({ userId, isRevoked: false }, { isRevoked: true });
    }

    public async cleanupExpiredTokens(): Promise<void> {
        await this.refreshTokenRepository.delete({
            expiresAt: LessThan(new Date()),
        });
    }

    @Cron(process.env.NODE_ENV === 'production' ? CronExpression.EVERY_DAY_AT_MIDNIGHT : CronExpression.EVERY_HOUR)
    public async scheduledTokenCleanup(): Promise<void> {
        await this.cleanupExpiredTokens();
    }
}

export { AuthService };
