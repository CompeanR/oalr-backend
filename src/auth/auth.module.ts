import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GoogleStrategy, JwtStrategy } from './strategies';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        UserModule,

        PassportModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                defaultStrategy: configService.get('DEFAULT_STRATEGY', 'google'),
            }),
            inject: [ConfigService],
        }),

        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET_KEY'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRATION_TIME', '60s'),
                },
            }),

            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, JwtStrategy, GoogleStrategy],
    controllers: [AuthController],
})
export class AuthModule {}
