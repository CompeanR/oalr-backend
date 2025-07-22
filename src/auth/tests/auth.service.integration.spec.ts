import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

import { AuthService } from '../auth.service';
import { UserService } from 'src/modules/user/user.service';
import { User } from 'src/modules/user/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { TokenCreationException } from 'src/shared/exceptions/common.exception';
import { OAuthUserDto } from 'src/modules/user/dto/oauth-user-dto';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import configuration from 'src/config/configuration';
import { validateEnvironment } from 'src/config/validation';

describe('AuthService Integration Tests', () => {
    let authService: AuthService;
    let userService: UserService;
    let dataSource: DataSource;
    let module: TestingModule;

    // Test database configuration
    const testDbConfig = {
        type: 'postgres' as const,
        host: 'localhost',
        port: 5432,
        username: 'oalr',
        password: 'oalr123',
        database: 'oalr_test', // Different database for tests
        entities: [User],
        synchronize: true, // Auto-sync schema for tests
        dropSchema: true, // Clean database on each test run
        logging: false,
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                // Test database connection
                TypeOrmModule.forRoot(testDbConfig),
                TypeOrmModule.forFeature([User]),

                // Configuration
                ConfigModule.forRoot({
                    load: [configuration],
                    validate: validateEnvironment,
                    isGlobal: true,
                }),

                // JWT Module with test config
                JwtModule.registerAsync({
                    imports: [ConfigModule],
                    useFactory: () => ({
                        secret: 'test-jwt-secret-for-integration-tests',
                        signOptions: { expiresIn: '1h' },
                    }),
                }),
            ],
            providers: [AuthService, UserService],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
        dataSource = module.get<DataSource>(DataSource);
    });

    afterAll(async () => {
        // Clean up database connection
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
        await module.close();
    });

    beforeEach(async () => {
        // Clear all users before each test
        const userRepository = dataSource.getRepository(User);
        await userRepository.clear();
    });

    describe('validateUser', () => {
        it('should validate user with correct credentials', async () => {
            // Arrange - Create a real user in the test database
            const email = 'test@integration.com';
            const password = 'Password123!';

            const userData: CreateUserDto = {
                email,
                userName: 'integrationtest',
                firstName: 'Integration',
                lastName: 'Test',
                password, // UserService.createUser handles hashing
            };

            const savedUser = await userService.createUser(userData);

            // Act - Test the validateUser method
            const result = await authService.validateUser(email, password);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(savedUser.id);
            expect(result.email).toBe(email);
            expect(result.userName).toBe('integrationtest');
            expect(result.hashedPassword).toBeDefined(); // UserService returns the full user
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            // Act & Assert
            await expect(authService.validateUser('nonexistent@test.com', 'anypassword')).rejects.toThrow(
                UnauthorizedException,
            );

            await expect(authService.validateUser('nonexistent@test.com', 'anypassword')).rejects.toThrow(
                'Invalid credentials',
            );
        });

        it('should throw UnauthorizedException for wrong password', async () => {
            // Arrange - Create user with known password
            const email = 'wrongpass@test.com';
            const correctPassword = 'CorrectPass123!';
            const wrongPassword = 'WrongPass123!';

            const userData: CreateUserDto = {
                email,
                userName: 'wrongpasstest',
                firstName: 'Wrong',
                lastName: 'Pass',
                password: correctPassword,
            };

            await userService.createUser(userData);

            // Act & Assert
            await expect(authService.validateUser(email, wrongPassword)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for inactive user', async () => {
            // Arrange - Create user first, then manually deactivate in database
            const email = 'inactive@test.com';
            const password = 'Password123!';

            const userData: CreateUserDto = {
                email,
                userName: 'inactivetest',
                firstName: 'Inactive',
                lastName: 'User',
                password,
            };

            const user = await userService.createUser(userData);

            // Manually deactivate user in database (since UserService doesn't support isActive in CreateUserDto)
            const userRepository = dataSource.getRepository(User);
            await userRepository.update(user.id, { isActive: false });

            // Act & Assert
            await expect(authService.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('validateOAuthLogin', () => {
        it('should create token for existing OAuth user', async () => {
            // Arrange - Create existing OAuth user using createOAuthUser
            const email = 'oauth@test.com';
            const oauthProfile: OAuthUserDto = {
                accessToken: 'oauth-access-token',
                email,
                firstName: 'OAuth',
                lastName: 'User',
                picture: 'https://example.com/picture.jpg',
            };

            // Create user first time (simulating previous OAuth registration)
            const existingUser = await userService.createOAuthUser(oauthProfile);

            // Act - Test subsequent OAuth login
            const result = await authService.validateOAuthLogin(oauthProfile);

            // Assert
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);

            // Verify the user wasn't duplicated
            const users = await userService.getAllUsers();
            const userWithEmail = users.filter((u) => u.email === email);
            expect(userWithEmail).toHaveLength(1);
        });

        it('should create new user for OAuth login when user does not exist', async () => {
            // Arrange
            const oauthProfile: OAuthUserDto = {
                accessToken: 'new-oauth-token',
                email: 'newuser@oauth.com',
                firstName: 'New',
                lastName: 'OAuthUser',
                picture: 'https://example.com/newuser.jpg',
            };

            // Act
            const result = await authService.validateOAuthLogin(oauthProfile);

            // Assert
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');

            // Verify new user was created
            const createdUser = await userService.getUserByEmail(oauthProfile.email);
            expect(createdUser).toBeDefined();
            expect(createdUser).not.toBeNull();
            expect(createdUser!.email).toBe(oauthProfile.email);
            expect(createdUser!.firstName).toBe(oauthProfile.firstName);
            expect(createdUser!.lastName).toBe(oauthProfile.lastName);
            expect(createdUser!.isOauth).toBe(true);
            expect(createdUser!.hashedPassword).toBeNull();
        });
    });

    describe('createTokenForUser', () => {
        it('should create valid JWT token with user information', async () => {
            // Arrange - Create a real user
            const userData: CreateUserDto = {
                email: 'token@test.com',
                userName: 'tokentest',
                firstName: 'Token',
                lastName: 'Test',
                password: 'TestPassword123!',
            };

            const user = await userService.createUser(userData);

            // Act
            const result = authService.createTokenForUser(user);

            // Assert
            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(typeof result.accessToken).toBe('string');
            expect(result.accessToken.length).toBeGreaterThan(0);

            expect(result.user).toBeDefined();
            expect(result.user.userId).toBe(user.id);
            expect(result.user.email).toBe(user.email);
            expect(result.user.userName).toBe(user.userName);
            expect(result.user.firstName).toBe(user.firstName);
            expect(result.user.lastName).toBe(user.lastName);
        });
    });

    describe('Full Authentication Flow Integration', () => {
        it('should complete full registration and login flow', async () => {
            // Step 1: Register new user
            const password = 'FullFlowPass123!';
            const userData: CreateUserDto = {
                email: 'fullflow@test.com',
                userName: 'fullflowtest',
                firstName: 'Full',
                lastName: 'Flow',
                password,
            };

            const registeredUser = await userService.createUser(userData);
            expect(registeredUser).toBeDefined();
            expect(registeredUser.id).toBeDefined();

            // Step 2: Validate credentials
            const validatedUser = await authService.validateUser(userData.email, password);
            expect(validatedUser).toBeDefined();
            expect(validatedUser.id).toBe(registeredUser.id);

            // Step 3: Create token
            const tokenResult = authService.createTokenForUser(validatedUser);
            expect(tokenResult.accessToken).toBeDefined();
            expect(tokenResult.user.userId).toBe(registeredUser.id);

            // Full flow completed successfully
        });
    });
});
