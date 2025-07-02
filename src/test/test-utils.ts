import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, ObjectLiteral } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';

/**
 * Mock factory for creating test users following the established User entity pattern.
 */
export class UserFactory {
    /**
     * Creates a single test user with optional property overrides.
     *
     * @param overrides Partial user properties to override defaults.
     * @returns A complete User entity for testing.
     */
    public static create(overrides: Partial<User> = {}): User {
        const user = new User();
        user.id = overrides.id || 123;
        user.email = overrides.email || 'test@example.com';
        user.userName = overrides.userName || 'testuser';
        user.firstName = overrides.firstName || 'Test';
        user.lastName = overrides.lastName || 'User';
        user.hashedPassword = overrides.hashedPassword || 'hashedpassword123';
        user.isOauth = overrides.isOauth || false;
        user.isActive = overrides.isActive || true;
        user.joinedDate = overrides.joinedDate || new Date();
        user.bio = overrides.bio ?? null;
        return user;
    }

    /**
     * Creates multiple test users with unique identifiers.
     *
     * @param count Number of users to create.
     * @param overrides Base properties to apply to all users.
     * @returns Array of User entities for testing.
     */
    public static createMany(count: number, overrides: Partial<User> = {}): User[] {
        return Array.from({ length: count }, (_, index) =>
            this.create({
                ...overrides,
                id: 123 + index,
                email: `test${index}@example.com`,
                userName: `testuser${index}`,
            }),
        );
    }
}

/**
 * Mock ConfigService implementation matching our environment configuration structure.
 */
export const mockConfigService = {
    get: jest.fn((key: string) => {
        const config: Record<string, any> = {
            'nodeEnv': 'test',
            'port': 3000,
            'jwt.secret': 'test-secret-key-for-testing-purposes-only',
            'jwt.expirationTime': '1h',
            'frontend.url': 'http://localhost:3000',
            'database.host': 'localhost',
            'database.port': 5432,
            'database.username': 'test',
            'database.password': 'test',
            'database.name': 'test_db',
        };
        return config[key];
    }),
};

/**
 * Mock JwtService for testing authentication flows.
 */
export const mockJwtService = {
    sign: jest.fn(() => 'mock-jwt-token-for-testing'),
    verify: jest.fn(() => ({ userId: '123', username: 'test@example.com' })),
    decode: jest.fn(() => ({ userId: '123', username: 'test@example.com' })),
};

/**
 * Creates a mock TypeORM repository with jest functions for all common methods.
 *
 * @returns Partial repository implementation with mocked methods.
 */
export function createMockRepository<T extends ObjectLiteral = any>(): Partial<Repository<T>> {
    return {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        remove: jest.fn(),
        count: jest.fn(),
        findAndCount: jest.fn(),
    };
}

/**
 * Mock DataSource for testing database operations without actual database connections.
 */
export const mockDataSource = {
    query: jest.fn(() => Promise.resolve([{ result: 1 }])),
    manager: {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    isInitialized: true,
    destroy: jest.fn(),
    entityMetadatas: [],
    getRepository: jest.fn(() => createMockRepository()),
};

/**
 * Creates a testing module with common mocks and providers following NestJS testing patterns.
 *
 * @param metadata Testing module metadata with controllers, providers, etc.
 * @returns Compiled testing module ready for use.
 */
export async function createTestingModule(metadata: any): Promise<TestingModule> {
    return Test.createTestingModule({
        ...metadata,
        providers: [
            ...(metadata.providers || []),
            {
                provide: ConfigService,
                useValue: mockConfigService,
            },
            {
                provide: JwtService,
                useValue: mockJwtService,
            },
            {
                provide: DataSource,
                useValue: mockDataSource,
            },
            {
                provide: getRepositoryToken(User),
                useValue: createMockRepository(),
            },
        ],
    }).compile();
}

/**
 * Helper class for database testing operations.
 */
export class DatabaseTestHelper {
    /**
     * Clears all data from test database entities.
     *
     * @param dataSource The test database connection.
     */
    public static async clearDatabase(dataSource: DataSource): Promise<void> {
        const entities = dataSource.entityMetadatas;
        
        for (const entity of entities) {
            const repository = dataSource.getRepository(entity.name);
            await repository.clear();
        }
    }

    /**
     * Safely closes database connection after tests.
     *
     * @param dataSource The database connection to close.
     */
    public static async closeConnection(dataSource: DataSource): Promise<void> {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

/**
 * Test helpers for authentication and authorization testing.
 */
export class AuthTestHelper {
    /**
     * Creates a mock JWT token payload for testing authenticated endpoints.
     *
     * @param payload Custom payload properties to include in token.
     * @returns Base64 encoded mock JWT token.
     */
    public static createMockJwtToken(payload: any = {}): string {
        const defaultPayload = {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            username: 'test@example.com',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            ...payload,
        };
        
        return Buffer.from(JSON.stringify(defaultPayload)).toString('base64');
    }

    /**
     * Creates authorization header for testing protected endpoints.
     *
     * @param token Optional custom token, uses mock token if not provided.
     * @returns Authorization header object.
     */
    public static createAuthHeader(token?: string): { Authorization: string } {
        const authToken = token || this.createMockJwtToken();
        return {
            Authorization: `Bearer ${authToken}`,
        };
    }
}

