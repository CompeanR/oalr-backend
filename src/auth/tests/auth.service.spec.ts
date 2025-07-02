import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from 'src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserFactory, mockJwtService, createTestingModule } from 'src/test/test-utils';
import { TokenCreationException } from 'src/shared/exceptions/common.exception';
import { OAuthUserDto } from 'src/modules/user/dto/oauth-user-dto';

describe('AuthService', () => {
    let service: AuthService;
    let userService: UserService;
    let jwtService: JwtService;

    const mockUserService = {
        validateUserCredentials: jest.fn(),
        getUserByEmail: jest.fn(),
        createOAuthUser: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
            ],
        });

        service = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
        jwtService = module.get<JwtService>(JwtService);

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    describe('validateUser', () => {
        it('should validate user with correct credentials', async () => {
            // Arrange
            const email = 'test@example.com';
            const password = 'password123';
            const mockUser = UserFactory.create({ email });
            mockUserService.validateUserCredentials.mockResolvedValue(mockUser);

            // Act
            const result = await service.validateUser(email, password);

            // Assert
            expect(result).toEqual(mockUser);
            expect(mockUserService.validateUserCredentials).toHaveBeenCalledWith(email, password);
            expect(mockUserService.validateUserCredentials).toHaveBeenCalledTimes(1);
        });

        it('should throw UnauthorizedException for invalid credentials', async () => {
            // Arrange
            const email = 'test@example.com';
            const password = 'wrongpassword';
            mockUserService.validateUserCredentials.mockResolvedValue(null);

            // Act & Assert
            await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
            await expect(service.validateUser(email, password)).rejects.toThrow('Invalid credentials');
            expect(mockUserService.validateUserCredentials).toHaveBeenCalledWith(email, password);
        });
    });

    describe('validateOAuthLogin', () => {
        it('should create token for existing OAuth user', async () => {
            // Arrange
            const oauthProfile: OAuthUserDto = {
                accessToken: 'oauth-access-token',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                picture: 'https://example.com/picture.jpg',
            };
            const existingUser = UserFactory.create({ email: oauthProfile.email });
            mockUserService.getUserByEmail.mockResolvedValue(existingUser);
            mockJwtService.sign.mockReturnValue('mock-access-token');

            // Act
            const result = await service.validateOAuthLogin(oauthProfile);

            // Assert
            expect(result).toBe('mock-access-token');
            expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(oauthProfile.email);
            expect(mockUserService.createOAuthUser).not.toHaveBeenCalled();
        });

        it('should create new user for OAuth login if user does not exist', async () => {
            // Arrange
            const oauthProfile: OAuthUserDto = {
                accessToken: 'oauth-access-token',
                email: 'newuser@example.com',
                firstName: 'New',
                lastName: 'User',
                picture: 'https://example.com/newuser.jpg',
            };
            const newUser = UserFactory.create({ email: oauthProfile.email });
            mockUserService.getUserByEmail.mockResolvedValue(null);
            mockUserService.createOAuthUser.mockResolvedValue(newUser);
            mockJwtService.sign.mockReturnValue('mock-access-token');

            // Act
            const result = await service.validateOAuthLogin(oauthProfile);

            // Assert
            expect(result).toBe('mock-access-token');
            expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(oauthProfile.email);
            expect(mockUserService.createOAuthUser).toHaveBeenCalledWith(oauthProfile);
        });

        it('should throw TokenCreationException if token creation fails', async () => {
            // Arrange
            const oauthProfile: OAuthUserDto = {
                accessToken: 'oauth-access-token',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                picture: 'https://example.com/picture.jpg',
            };
            const existingUser = UserFactory.create({ email: oauthProfile.email });
            mockUserService.getUserByEmail.mockResolvedValue(existingUser);
            mockJwtService.sign.mockReturnValue('');

            // Act & Assert
            await expect(service.validateOAuthLogin(oauthProfile)).rejects.toThrow(TokenCreationException);
            await expect(service.validateOAuthLogin(oauthProfile)).rejects.toThrow('Failed to validate OAuth login');
        });
    });

    describe('createTokenForUser', () => {
        it('should create JWT payload with user information', () => {
            // Arrange
            const user = UserFactory.create({
                id: 123,
                email: 'test@example.com',
                userName: 'testuser',
                firstName: 'Test',
                lastName: 'User',
            });
            mockJwtService.sign.mockReturnValue('mock-jwt-token');

            // Act
            const result = service.createTokenForUser(user);

            // Assert
            expect(result).toEqual({
                accessToken: 'mock-jwt-token',
                user: {
                    userId: 123,
                    email: 'test@example.com',
                    userName: 'testuser',
                    firstName: 'Test',
                    lastName: 'User',
                },
            });
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                username: user.email,
                sub: user.id,
            });
        });

        it('should handle user with minimal information', () => {
            // Arrange
            const user = UserFactory.create({
                id: 456,
                email: 'minimal@example.com',
                userName: 'minimaluser',
                firstName: 'Minimal',
                lastName: 'User',
            });
            mockJwtService.sign.mockReturnValue('another-mock-token');

            // Act
            const result = service.createTokenForUser(user);

            // Assert
            expect(result.accessToken).toBe('another-mock-token');
            expect(result.user.userId).toBe(456);
            expect(result.user.email).toBe('minimal@example.com');
        });
    });
});
