import { Body, Controller, Get, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, OAuthRequest } from './interfaces';
import { AuthGuard } from '@nestjs/passport';
import { OAuthUserInterceptor } from 'src/common/interceptors/oauth-user.interceptor';

@Controller('auth')
class AuthController {
    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) {}

    /**
     * It serves only as a redirect to the Google OAuth login page.
     */
    @Get('google')
    @UseGuards(AuthGuard('google'))
    public async googleAuth(): Promise<void> {}

    /**
     * Handles the Google authentication redirect and logs in the user.
     *
     * @param req - The request object containing the authenticated user.
     * @returns A Promise that resolves to the result of the login operation.
     */
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @UseInterceptors(OAuthUserInterceptor)
    public async googleAuthRedirect(@Req() req: OAuthRequest): Promise<JwtPayload> {
        return this.authService.validateOAuthLogin(req.user);
    }

    /**
     * Logs in a user with the provided email and password.
     *
     * @param user The user's login credentials.
     * @returns A Promise that resolves to a JWT payload.
     */
    @Post('login')
    public async login(@Body() user: LoginDto): Promise<JwtPayload> {
        const validatedUser = await this.userService.validateUserCredentials(user.email, user.password);
        return this.authService.createTokenForUser(validatedUser);
    }
}

export { AuthController };
