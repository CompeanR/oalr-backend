import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

@Injectable()
class RateLimitGuard implements CanActivate {
    private readonly storage = new Map<string, RateLimitRecord>();
    private readonly maxRequests: number;
    private readonly windowMs: number;

    constructor(private configService: ConfigService) {
        // Default: 100 requests per 15 minutes
        this.maxRequests = 100;
        this.windowMs = 15 * 60 * 1000; // 15 minutes

        // Clean up old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Determines if the request should be allowed based on rate limiting.
     *
     * @param context The execution context containing request information.
     * @returns True if request is allowed, throws exception if rate limited.
     */
    public canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const key = this.generateKey(request);
        const now = Date.now();

        const record = this.storage.get(key);

        if (!record || now > record.resetTime) {
            // New window or expired record
            this.storage.set(key, {
                count: 1,
                resetTime: now + this.windowMs,
            });
            return true;
        }

        if (record.count >= this.maxRequests) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Too many requests',
                    retryAfter: Math.ceil((record.resetTime - now) / 1000),
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        record.count++;
        return true;
    }

    /**
     * Generates a unique key for rate limiting based on IP and user.
     *
     * @param request The HTTP request object.
     * @returns A unique key for this request source.
     */
    private generateKey(request: Request): string {
        // Use IP as primary identifier
        const ip = request.ip || request.connection.remoteAddress || 'unknown';

        // If user is authenticated, include user ID for more specific limiting
        const userId = (request as any).user?.userId;

        return userId ? `${ip}:${userId}` : ip;
    }

    /**
     * Removes expired rate limit records to prevent memory leaks.
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, record] of this.storage.entries()) {
            if (now > record.resetTime) {
                this.storage.delete(key);
            }
        }
    }
}

export { RateLimitGuard };
