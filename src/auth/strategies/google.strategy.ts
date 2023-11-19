import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ValidateArgs = [string, string, Profile, VerifyCallback];

interface Profile {
    emails: { value: string }[];
    name: { givenName: string; familyName: string };
    photos: { value: string }[];
}

@Injectable()
class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private configService: ConfigService) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
            callbackURL: 'http://localhost:3000/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    public async validate(...args: ValidateArgs) {
        const [accessToken, , profile, done] = args;
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
