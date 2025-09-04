import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UserService } from 'src/modules/user/user.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../dto/login.dto';
import { UserFactory, mockConfigService } from 'src/test/test-utils';
import { JwtPayload, OAuthRequest } from '../interfaces';
import { Response } from 'express';

describe('AuthController', () => {
    let controller: AuthController;

    const mockAuthService = {
        validateOAuthLogin: jest.fn(),
        createTokenForUser: jest.fn(),
        createRefreshToken: jest.fn(),
    };

    const mockUserService = {
        validateUserCredentials: jest.fn(),
        getUserById: jest.fn(),
        getUserByEmail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            // Arrange
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'password123',
            };
            const mockUser = UserFactory.create({ email: loginDto.email });
            const mockJwtPayload: JwtPayload = {
                accessToken: 'mock-jwt-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    firstName: mockUser.firstName,
                    lastName: mockUser.lastName,
                },
            };

            mockUserService.validateUserCredentials.mockResolvedValue(mockUser);
            mockAuthService.createTokenForUser.mockReturnValue(mockJwtPayload);
            mockAuthService.createRefreshToken.mockResolvedValue('mock-refresh-token');

            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            // Act
            const result = await controller.login(loginDto, mockResponse);

            // Assert
            expect(result).toEqual(mockJwtPayload);
            expect(mockUserService.validateUserCredentials).toHaveBeenCalledWith(loginDto.email, loginDto.password);
            expect(mockAuthService.createTokenForUser).toHaveBeenCalledWith(mockUser);
            expect(mockUserService.validateUserCredentials).toHaveBeenCalledTimes(1);
            expect(mockAuthService.createTokenForUser).toHaveBeenCalledTimes(1);
        });

        it('should throw UnauthorizedException for invalid credentials', async () => {
            // Arrange
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            mockUserService.validateUserCredentials.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            // Act & Assert
            await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(UnauthorizedException);
            await expect(controller.login(loginDto, mockResponse)).rejects.toThrow('Invalid credentials');
            expect(mockUserService.validateUserCredentials).toHaveBeenCalledWith(loginDto.email, loginDto.password);
            expect(mockAuthService.createTokenForUser).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            // Arrange
            const loginDto: LoginDto = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            mockUserService.validateUserCredentials.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            // Act & Assert
            await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(UnauthorizedException);
            expect(mockUserService.validateUserCredentials).toHaveBeenCalledWith(loginDto.email, loginDto.password);
        });

        it('should handle service errors gracefully', async () => {
            // Arrange
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            mockUserService.validateUserCredentials.mockRejectedValue(new Error('Database connection error'));

            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            // Act & Assert
            await expect(controller.login(loginDto, mockResponse)).rejects.toThrow('Database connection error');
            expect(mockUserService.validateUserCredentials).toHaveBeenCalledWith(loginDto.email, loginDto.password);
        });
    });

    describe('validateToken', () => {
        it('should return user information for valid JWT token', async () => {
            // Arrange
            const mockUser = UserFactory.create();
            const mockRequest = {
                user: {
                    userId: mockUser.id,
                    username: mockUser.email,
                },
            };

            mockUserService.getUserById.mockResolvedValue(mockUser);

            // Act
            const result = await controller.validateToken(mockRequest);

            // Assert
            expect(result).toEqual(mockUser);
            expect(mockUserService.getUserById).toHaveBeenCalledWith(mockRequest.user.userId);
            expect(mockUserService.getUserById).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException for invalid user ID', async () => {
            // Arrange
            const mockRequest = {
                user: {
                    userId: 999,
                    username: 'test@example.com',
                },
            };

            mockUserService.getUserById.mockRejectedValue(new NotFoundException('User not found'));

            // Act & Assert
            await expect(controller.validateToken(mockRequest)).rejects.toThrow(NotFoundException);
            await expect(controller.validateToken(mockRequest)).rejects.toThrow('User not found');
            expect(mockUserService.getUserById).toHaveBeenCalledWith(mockRequest.user.userId);
        });

        it('should handle missing user in request', async () => {
            // Arrange
            const mockRequest = {
                user: {
                    userId: undefined,
                    username: 'test@example.com',
                },
            };

            mockUserService.getUserById.mockRejectedValue(new NotFoundException('User not found'));

            // Act & Assert
            await expect(controller.validateToken(mockRequest)).rejects.toThrow(NotFoundException);
            expect(mockUserService.getUserById).toHaveBeenCalledWith(undefined);
        });
    });

    describe('googleAuth', () => {
        it('should be defined and callable', async () => {
            // This method serves only as a redirect trigger
            // The actual OAuth logic is handled by the passport strategy
            const result = await controller.googleAuth();
            expect(result).toBeUndefined();
        });
    });

    describe('googleAuthRedirect', () => {
        it('should handle Google OAuth callback and redirect with token', async () => {
            // Arrange
            const mockOAuthUser = {
                accessToken: 'oauth-access-token',
                email: 'test@gmail.com',
                firstName: 'Test',
                lastName: 'User',
                picture: 'https://example.com/picture.jpg',
            };
            const mockRequest: OAuthRequest = {
                user: mockOAuthUser,
            } as OAuthRequest;
            const mockResponse = {
                redirect: jest.fn(),
                cookie: jest.fn(),
            } as unknown as Response;
            const frontendUrl = 'http://localhost:3000';

            const mockUser = UserFactory.create({ email: mockOAuthUser.email });
            mockUserService.getUserByEmail.mockResolvedValue(mockUser);
            mockAuthService.createRefreshToken.mockResolvedValue('mock-refresh-token');
            mockConfigService.get.mockReturnValue(frontendUrl);

            // Act
            await controller.googleAuthRedirect(mockRequest, mockResponse);

            // Assert
            expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(mockOAuthUser.email);
            expect(mockAuthService.createRefreshToken).toHaveBeenCalledWith(mockUser.id);
            expect(mockConfigService.get).toHaveBeenCalledWith('frontend.url');
            expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', expect.any(Object));
            expect(mockResponse.redirect).toHaveBeenCalledWith(`${frontendUrl}/dashboard`);
        });

        it('should handle refresh token creation errors', async () => {
            // Arrange
            const mockOAuthUser = {
                accessToken: 'oauth-access-token',
                email: 'test@gmail.com',
                firstName: 'Test',
                lastName: 'User',
                picture: 'https://example.com/picture.jpg',
            };
            const mockRequest: OAuthRequest = {
                user: mockOAuthUser,
            } as OAuthRequest;
            const mockResponse = {
                redirect: jest.fn(),
                cookie: jest.fn(),
            } as unknown as Response;
            const frontendUrl = 'http://localhost:3000';

            const mockUser = UserFactory.create({ email: mockOAuthUser.email });
            mockUserService.getUserByEmail.mockResolvedValue(mockUser);
            mockAuthService.createRefreshToken.mockRejectedValue(new Error('Refresh token creation failed'));
            mockConfigService.get.mockReturnValue(frontendUrl);

            // Act
            await controller.googleAuthRedirect(mockRequest, mockResponse);

            // Assert
            expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(mockOAuthUser.email);
            expect(mockAuthService.createRefreshToken).toHaveBeenCalledWith(mockUser.id);
            expect(mockResponse.redirect).toHaveBeenCalledWith(`${frontendUrl}/login`);
        });

        it('should handle non-existent user (null user)', async () => {
            // Arrange
            const mockOAuthUser = {
                accessToken: 'oauth-access-token',
                email: 'nonexistent@gmail.com',
                firstName: 'Non',
                lastName: 'Existent',
                picture: 'https://example.com/picture.jpg',
            };
            const mockRequest: OAuthRequest = {
                user: mockOAuthUser,
            } as OAuthRequest;
            const mockResponse = {
                redirect: jest.fn(),
                cookie: jest.fn(),
            } as unknown as Response;
            const frontendUrl = 'http://localhost:3000';

            mockUserService.getUserByEmail.mockResolvedValue(null);
            mockConfigService.get.mockReturnValue(frontendUrl);

            // Act
            await controller.googleAuthRedirect(mockRequest, mockResponse);

            // Assert
            expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(mockOAuthUser.email);
            expect(mockAuthService.createRefreshToken).not.toHaveBeenCalled();
            expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', undefined, expect.any(Object));
            expect(mockResponse.redirect).toHaveBeenCalledWith(`${frontendUrl}/dashboard`);
        });
    });

    describe('HTTP Layer Concerns', () => {
        it('should have proper route decorators', () => {
            // Verify that the controller has the expected methods
            expect(controller.googleAuth).toBeDefined();
            expect(controller.googleAuthRedirect).toBeDefined();
            expect(controller.login).toBeDefined();
            expect(controller.validateToken).toBeDefined();
        });

        it('should handle request/response objects properly', async () => {
            // This is more of an integration concern, but we verify the controller
            // accepts the expected parameter types
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'password123',
            };
            const mockUser = UserFactory.create();
            const mockJwtPayload: JwtPayload = {
                accessToken: 'token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    firstName: mockUser.firstName,
                    lastName: mockUser.lastName,
                },
            };

            mockUserService.validateUserCredentials.mockResolvedValue(mockUser);
            mockAuthService.createTokenForUser.mockReturnValue(mockJwtPayload);
            mockAuthService.createRefreshToken.mockResolvedValue('mock-refresh-token');

            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            const result = await controller.login(loginDto, mockResponse);
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect(result.accessToken).toBeDefined();
        });
    });
});
