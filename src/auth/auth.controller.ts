import { Body, Controller, Get, Post, Req, Res, UseGuards, UseInterceptors, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UserService } from 'src/modules/user/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { JwtPayload, OAuthRequest } from './interfaces';
import { AuthGuard } from '@nestjs/passport';
import { OAuthUserInterceptor } from 'src/shared/interceptors/oauth-user.interceptor';
import { Request, Response } from 'express';
import { User } from 'src/modules/user/entities/user.entity';
import { RateLimitGuard } from 'src/shared/guards/rate-limit.guard';

@ApiTags('auth')
@Controller('auth')
class AuthController {
    constructor(
        private userService: UserService,
        private authService: AuthService,
        private configService: ConfigService,
    ) {}

    @Get('google')
    @UseGuards(AuthGuard('google'))
    public async googleAuth(): Promise<void> {}

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @UseInterceptors(OAuthUserInterceptor)
    public async googleAuthRedirect(@Req() req: OAuthRequest, @Res() res: Response): Promise<void> {
        const token = await this.authService.validateOAuthLogin(req.user);
        const frontendUrl = this.configService.get('frontend.url');
        res.redirect(`${frontendUrl}/authenticated?token=${token}`);
    }

    @Post('login')
    @UseGuards(RateLimitGuard)
    @ApiOperation({ summary: 'User login' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        type: JwtPayloadDto,
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    public async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<JwtPayload> {
        const validatedUser = await this.userService.validateUserCredentials(loginDto.email, loginDto.password);
        const tokenPayload = this.authService.createTokenForUser(validatedUser);
        
        // Create and set refresh token in httpOnly cookie
        const refreshToken = await this.authService.createRefreshToken(validatedUser.id);
        const isProduction = this.configService.get('nodeEnv') === 'production';
        
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction, // Only secure in production (HTTPS)
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/',
        });

        return tokenPayload;
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
    @ApiResponse({
        status: 200,
        description: 'Token refreshed successfully',
        type: JwtPayloadDto,
    })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    public async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<JwtPayload> {
        const refreshToken = request.cookies?.refreshToken;
        
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        // Validate refresh token and get user
        const user = await this.authService.validateRefreshToken(refreshToken);
        
        // Create new tokens
        const tokenPayload = this.authService.createTokenForUser(user);
        const newRefreshToken = await this.authService.createRefreshToken(user.id);
        
        // Set new refresh token in httpOnly cookie
        const isProduction = this.configService.get('nodeEnv') === 'production';
        response.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/',
        });

        return tokenPayload;
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout user and revoke refresh token' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    public async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<{ message: string }> {
        const refreshToken = request.cookies?.refreshToken;
        
        if (refreshToken) {
            // Revoke the refresh token
            await this.authService.revokeRefreshToken(refreshToken);
        }

        // Clear the httpOnly cookie
        response.clearCookie('refreshToken', {
            httpOnly: true,
            secure: this.configService.get('nodeEnv') === 'production',
            sameSite: 'strict',
            path: '/',
        });

        return { message: 'Logout successful' };
    }

    @Get('validate')
    @UseGuards(AuthGuard('jwt'))
    public async validateToken(@Req() req: any): Promise<User> {
        return this.userService.getUserById(req.user.userId);
    }
}

export { AuthController };
