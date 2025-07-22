import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UserService } from 'src/modules/user/user.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../dto/login.dto';
import { UserFactory, mockConfigService } from 'src/test/test-utils';
import { User } from 'src/modules/user/entities/user.entity';
import { JwtPayload, OAuthRequest } from '../interfaces';
import { Response } from 'express';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;
    let userService: UserService;
    let configService: ConfigService;

    const mockAuthService = {
        validateOAuthLogin: jest.fn(),
        createTokenForUser: jest.fn(),
    };

    const mockUserService = {
        validateUserCredentials: jest.fn(),
        getUserById: jest.fn(),
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
        authService = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
        configService = module.get<ConfigService>(ConfigService);

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
                    userId: mockUser.id,
                    email: mockUser.email,
                    userName: mockUser.userName,
                    firstName: mockUser.firstName,
                    lastName: mockUser.lastName,
                },
            };

            mockUserService.validateUserCredentials.mockResolvedValue(mockUser);
            mockAuthService.createTokenForUser.mockReturnValue(mockJwtPayload);

            // Act
            const result = await controller.login(loginDto);

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

            // Act & Assert
            await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
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

            // Act & Assert
            await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
            expect(mockUserService.validateUserCredentials).toHaveBeenCalledWith(loginDto.email, loginDto.password);
        });

        it('should handle service errors gracefully', async () => {
            // Arrange
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            mockUserService.validateUserCredentials.mockRejectedValue(new Error('Database connection error'));

            // Act & Assert
            await expect(controller.login(loginDto)).rejects.toThrow('Database connection error');
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
            } as unknown as Response;
            const mockToken = 'generated-jwt-token';
            const frontendUrl = 'http://localhost:3000';

            mockAuthService.validateOAuthLogin.mockResolvedValue(mockToken);
            mockConfigService.get.mockReturnValue(frontendUrl);

            // Act
            await controller.googleAuthRedirect(mockRequest, mockResponse);

            // Assert
            expect(mockAuthService.validateOAuthLogin).toHaveBeenCalledWith(mockOAuthUser);
            expect(mockConfigService.get).toHaveBeenCalledWith('frontend.url');
            expect(mockResponse.redirect).toHaveBeenCalledWith(`${frontendUrl}/authenticated?token=${mockToken}`);
        });

        it('should handle OAuth validation errors', async () => {
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
            } as unknown as Response;

            mockAuthService.validateOAuthLogin.mockRejectedValue(new Error('OAuth validation failed'));

            // Act & Assert
            await expect(controller.googleAuthRedirect(mockRequest, mockResponse)).rejects.toThrow(
                'OAuth validation failed',
            );
            expect(mockAuthService.validateOAuthLogin).toHaveBeenCalledWith(mockOAuthUser);
            expect(mockResponse.redirect).not.toHaveBeenCalled();
        });

        it('should handle missing OAuth user data', async () => {
            // Arrange
            const mockRequest = {
                user: undefined,
            } as unknown as OAuthRequest;
            const mockResponse = {
                redirect: jest.fn(),
            } as unknown as Response;

            // Act & Assert
            await expect(controller.googleAuthRedirect(mockRequest, mockResponse)).rejects.toThrow();
            expect(mockAuthService.validateOAuthLogin).toHaveBeenCalledWith(undefined);
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
                    userId: mockUser.id,
                    email: mockUser.email,
                    userName: mockUser.userName,
                    firstName: mockUser.firstName,
                    lastName: mockUser.lastName,
                },
            };

            mockUserService.validateUserCredentials.mockResolvedValue(mockUser);
            mockAuthService.createTokenForUser.mockReturnValue(mockJwtPayload);

            const result = await controller.login(loginDto);
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect(result.accessToken).toBeDefined();
        });
    });
});
