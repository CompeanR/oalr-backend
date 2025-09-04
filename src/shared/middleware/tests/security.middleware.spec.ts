import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { SecurityMiddleware } from '../security.middleware';
import { mockConfigService } from 'src/test/test-utils';

describe('SecurityMiddleware', () => {
    let middleware: SecurityMiddleware;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SecurityMiddleware,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        middleware = module.get<SecurityMiddleware>(SecurityMiddleware);

        mockRequest = {};
        mockResponse = {
            setHeader: jest.fn(),
            removeHeader: jest.fn(),
        };
        mockNext = jest.fn();

        jest.clearAllMocks();
    });

    describe('security headers', () => {
        it('should apply all essential security headers', () => {
            mockConfigService.get.mockReturnValue('development');

            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Content-Security-Policy',
                expect.stringContaining("default-src 'self'"),
            );
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Permissions-Policy',
                expect.stringContaining('geolocation=()'),
            );
        });

        it('should remove server header for security', () => {
            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.removeHeader).toHaveBeenCalledWith('Server');
        });

        it('should call next middleware in chain', () => {
            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
        });
    });

    describe('HSTS behavior', () => {
        it('should add HSTS header in production environment', () => {
            mockConfigService.get.mockReturnValue('production');

            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload',
            );
        });

        it('should not add HSTS header in non-production environments', () => {
            mockConfigService.get.mockReturnValue('development');

            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.setHeader).not.toHaveBeenCalledWith('Strict-Transport-Security', expect.any(String));
        });
    });

    describe('CSP policy', () => {
        it('should enforce strict Content Security Policy', () => {
            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            const cspCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
                (call) => call[0] === 'Content-Security-Policy',
            );
            const cspValue = cspCall[1];

            expect(cspValue).toContain("default-src 'self'");
            expect(cspValue).toContain("script-src 'self'");
            expect(cspValue).toContain("frame-src 'none'");
            expect(cspValue).toContain("object-src 'none'");
        });
    });
});
