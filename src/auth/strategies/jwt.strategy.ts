import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private userService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true,
            secretOrKey: configService.get('JWT_SECRET_KEY'),
        });
    }

    public async validate(payload: any): Promise<{ userId: number; username: string }> {
        const user = await this.userService.getUserById(payload.sub);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }
        return { userId: payload.sub, username: payload.username };
    }
}

export { JwtStrategy };
