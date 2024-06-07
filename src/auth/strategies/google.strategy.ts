import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile } from './strategies.types';

@Injectable()
class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private configService: ConfigService) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
            callbackURL: 'http://localhost:3001/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    public async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<void> {
        const { name, emails, photos } = profile;

        const user = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos[0].value,
            accessToken,
        };

        done(null, user);
    }
}

export { GoogleStrategy };
