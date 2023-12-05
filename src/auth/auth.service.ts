import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';
import { JwtPayload } from './interfaces';
import { OAuthUserDto } from 'src/modules/user/dto/oauth-user-dto';
import { TokenCreationException } from 'src/common/exceptions/common.exception';

@Injectable()
class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Validates a user's credentials by checking if the email and password match an existing user.
     *
     * @param email The email of the user to validate.
     * @param password The password of the user to validate.
     *
     * @returns A Promise that resolves to the validated User object.
     * @throws UnauthorizedException if the credentials are invalid.
     */
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
     * @returns A promise that resolves to the JWT payload.
     * @throws NotFoundException if failed to validate OAuth login.
     */
    public async validateOAuthLogin(profile: OAuthUserDto): Promise<JwtPayload> {
        let user = await this.userService.getUserByEmail(profile.email);
        if (!user) {
            user = await this.userService.createOAuthUser(profile);
        }

        const token = await this.createTokenForUser(user);
        if (!token) {
            throw new TokenCreationException('Failed to validate OAuth login');
        }

        return token;
    }

    /**
     * Authenticates a user and returns a JWT payload.
     *
     * @param user The user to authenticate.
     * @returns A Promise that resolves to a JwtPayload.
     */
    public createTokenForUser(user: User): JwtPayload {
        const payload = { username: user.email, sub: user.id };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                userId: user.id,
                email: user.email,
                userName: user.userName,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        };
    }
}

export { AuthService };
