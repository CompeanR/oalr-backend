import { Body, Controller, Get, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, OAuthRequest } from './interfaces';
import { AuthGuard } from '@nestjs/passport';
import { OAuthUserInterceptor } from 'src/shared/interceptors/oauth-user.interceptor';
import { Response } from 'express';
import { User } from 'src/modules/user/entities/user.entity';

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
     * Handles the Google authentication redirect.
     *
     * @param req - The request object.
     * @param res - The response object.

     * @returns A Promise that resolves to void.
     */
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @UseInterceptors(OAuthUserInterceptor)
    public async googleAuthRedirect(@Req() req: OAuthRequest, @Res() res: Response): Promise<void> {
        const token = await this.authService.validateOAuthLogin(req.user);
        res.redirect(`http://localhost:5173/authenticated?token=${token}`);
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

    /**
     * Validates the current JWT token and returns the user information.
     *
     * @param req The request object containing the validated user.
     * @returns A Promise that resolves to the User object.
     */
    @Get('validate')
    @UseGuards(AuthGuard('jwt'))
    public async validateToken(@Req() req: any): Promise<User> {
        return this.userService.getUserById(req.user.userId);
    }
}

export { AuthController };
