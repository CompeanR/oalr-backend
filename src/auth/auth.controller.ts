import { Body, Controller, Get, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UserService } from 'src/modules/user/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { JwtPayload, OAuthRequest } from './interfaces';
import { AuthGuard } from '@nestjs/passport';
import { OAuthUserInterceptor } from 'src/shared/interceptors/oauth-user.interceptor';
import { Response } from 'express';
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
    public async login(@Body() user: LoginDto): Promise<JwtPayload> {
        const validatedUser = await this.userService.validateUserCredentials(user.email, user.password);
        return this.authService.createTokenForUser(validatedUser);
    }

    @Get('validate')
    @UseGuards(AuthGuard('jwt'))
    public async validateToken(@Req() req: any): Promise<User> {
        return this.userService.getUserById(req.user.userId);
    }
}

export { AuthController };
