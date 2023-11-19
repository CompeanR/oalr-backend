import { Request } from 'express';

interface OAuthRequest extends Request {
    user: {
        accessToken: string;
        email: string;
        firstName: string;
        lastName: string;
        picture: string;
    };
}

export { OAuthRequest };
