import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
class SecurityMiddleware implements NestMiddleware {
    constructor(private configService: ConfigService) {}

    /**
     * Applies security headers to all requests.
     *
     * @param req The HTTP request object.
     * @param res The HTTP response object.
     * @param next The next function in the middleware chain.
     */
    public use(req: Request, res: Response, next: NextFunction): void {
        // Content Security Policy
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none';",
        );

        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');

        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Enable XSS protection
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Referrer Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy (Feature Policy replacement)
        res.setHeader(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()',
        );

        // HSTS (only in production with HTTPS)
        if (this.configService.get('nodeEnv') === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Hide server information
        res.removeHeader('Server');

        next();
    }
}

export { SecurityMiddleware };
