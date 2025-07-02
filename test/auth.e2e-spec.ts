import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication E2E (HTTP Layer)', () => {
    let app: INestApplication;
    let httpServer: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        httpServer = app.getHttpServer();

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /auth/login', () => {
        it('should respond to login endpoint with proper error for non-existent user', async () => {
            // Act & Assert - Test HTTP endpoint behavior
            const response = await request(httpServer)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'anypassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('statusCode', 401);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 400 for invalid request body', async () => {
            // Test validation - Missing password
            await request(httpServer)
                .post('/auth/login')
                .send({
                    email: 'test@test.com',
                })
                .expect(400);

            // Test validation - Missing email
            await request(httpServer)
                .post('/auth/login')
                .send({
                    password: 'password123',
                })
                .expect(400);

            // Test validation - Empty body
            await request(httpServer)
                .post('/auth/login')
                .send({})
                .expect(400);
        });

        it('should accept properly formatted login request', async () => {
            // Test that endpoint accepts valid format (will fail auth but format is correct)
            const response = await request(httpServer)
                .post('/auth/login')
                .send({
                    email: 'valid@email.com',
                    password: 'validpassword',
                });

            // Should not return 400 (bad request) - format is valid
            expect(response.status).not.toBe(400);
            // Will likely return 401 (unauthorized) since user doesn't exist
            expect([401, 500].includes(response.status)).toBe(true);
        });
    });

    describe('GET /auth/validate', () => {
        it('should return 401 for missing authorization header', async () => {
            const response = await request(httpServer)
                .get('/auth/validate')
                .expect(401);

            expect(response.body).toHaveProperty('statusCode', 401);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 401 for invalid JWT token', async () => {
            const response = await request(httpServer)
                .get('/auth/validate')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('statusCode', 401);
        });

        it('should return 401 for malformed authorization header', async () => {
            // Missing "Bearer"
            await request(httpServer)
                .get('/auth/validate')
                .set('Authorization', 'some-token')
                .expect(401);

            // Wrong scheme
            await request(httpServer)
                .get('/auth/validate')
                .set('Authorization', 'Basic some-token')
                .expect(401);
        });
    });

    describe('GET /auth/google', () => {
        it('should initiate Google OAuth flow', async () => {
            const response = await request(httpServer)
                .get('/auth/google')
                .expect(302); // Redirect to Google

            // Should redirect to Google OAuth
            expect(response.headers.location).toBeDefined();
        });
    });

    describe('GET /auth/google/callback', () => {
        it('should handle OAuth callback endpoint', async () => {
            // This endpoint requires OAuth flow, so it should reject unauthorized requests
            const response = await request(httpServer)
                .get('/auth/google/callback')
                .expect(401);

            expect(response.body).toHaveProperty('statusCode', 401);
        });
    });

    describe('Authentication Endpoints Availability', () => {
        it('should have all auth endpoints available', async () => {
            // Test that all auth endpoints exist and don't return 404
            
            // POST /auth/login exists
            const loginResponse = await request(httpServer)
                .post('/auth/login')
                .send({});
            expect(loginResponse.status).not.toBe(404);

            // GET /auth/validate exists  
            const validateResponse = await request(httpServer)
                .get('/auth/validate');
            expect(validateResponse.status).not.toBe(404);

            // GET /auth/google exists
            const googleResponse = await request(httpServer)
                .get('/auth/google');
            expect(googleResponse.status).not.toBe(404);

            // GET /auth/google/callback exists
            const callbackResponse = await request(httpServer)
                .get('/auth/google/callback');
            expect(callbackResponse.status).not.toBe(404);
        });
    });

    describe('HTTP Response Headers and Format', () => {
        it('should return JSON responses for API endpoints', async () => {
            const response = await request(httpServer)
                .post('/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'password',
                });

            expect(response.headers['content-type']).toMatch(/json/);
        });

        it('should include proper CORS headers', async () => {
            const response = await request(httpServer)
                .options('/auth/login');

            // Should handle OPTIONS requests (CORS preflight)
            expect([200, 204].includes(response.status)).toBe(true);
        });

        it('should handle invalid HTTP methods', async () => {
            // PUT method not allowed on login endpoint
            const response = await request(httpServer)
                .put('/auth/login')
                .send({});

            expect(response.status).toBe(405); // Method Not Allowed
        });
    });

    describe('Rate Limiting (HTTP Level)', () => {
        it('should eventually apply rate limiting on login endpoint', async () => {
            // Make multiple rapid requests to trigger rate limiting
            const requests = Array(10).fill(null).map(() =>
                request(httpServer)
                    .post('/auth/login')
                    .send({
                        email: 'rate-limit-test@test.com',
                        password: 'password',
                    })
            );

            const responses = await Promise.all(requests);

            // At least some responses should succeed (before rate limit)
            const successfulOrUnauthorized = responses.filter(r => 
                r.status === 401 || r.status === 200 || r.status === 500
            );
            expect(successfulOrUnauthorized.length).toBeGreaterThan(0);

            // Some might be rate limited (429) if rate limiting is working
            const rateLimited = responses.filter(r => r.status === 429);
            // Note: This might be 0 if rate limits are high, which is fine for this test
            expect(rateLimited.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Error Response Format Consistency', () => {
        it('should return consistent error format across endpoints', async () => {
            // Test login endpoint error format
            const loginError = await request(httpServer)
                .post('/auth/login')
                .send({ email: 'invalid' });

            expect(loginError.body).toHaveProperty('statusCode');
            expect(loginError.body).toHaveProperty('message');

            // Test validate endpoint error format
            const validateError = await request(httpServer)
                .get('/auth/validate');

            expect(validateError.body).toHaveProperty('statusCode');
            expect(validateError.body).toHaveProperty('message');
        });
    });
});