import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';
import { JwtPayload } from './interfaces';
import { OAuthUserDto } from 'src/modules/user/dto/oauth-user-dto';
import { TokenCreationException } from 'src/shared/exceptions/common.exception';

@Injectable()
class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
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
        const accessToken = this.jwtService.sign(payload);

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
}

export { AuthService };
