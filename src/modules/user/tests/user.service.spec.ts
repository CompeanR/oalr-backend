import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user.service';
import { User } from '../entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { UserCreationException } from 'src/shared/exceptions/common.exception';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
    let userService: UserService;
    let mockRepository: any;

    beforeEach(async () => {
        mockRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);

        jest.clearAllMocks();
    });

    describe('getUserById', () => {
        it('should return user when found', async () => {
            // Arrange
            const userId = 1;
            const expectedUser = { id: 1, email: 'test@test.com', firstName: 'John' };
            mockRepository.findOne.mockResolvedValue(expectedUser);

            // Act
            const result = await userService.getUserById(userId);

            // Assert
            expect(result).toEqual(expectedUser);
            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
            expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException when user not found', async () => {
            // Arrange
            const userId = 999;
            mockRepository.findOne.mockResolvedValue(null);

            // Act
            await expect(userService.getUserById(userId)).rejects.toThrow(NotFoundException);
            await expect(userService.getUserById(userId)).rejects.toThrow('User not found');

            // Assert
            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
        });
    });

    describe('createUser', () => {
        it('should create user with hashed password', async () => {
            // Arrange
            const createUserDto = {
                email: 'test@test.com',
                password: 'testPassword',
                firstName: 'xd',
                lastName: 'xd2',
            };

            const hashedPassword = 'hashedPassword123';
            const createdUser = { ...createUserDto, hashedPassword };
            const savedUser = { id: 1, ...createdUser };

            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

            mockRepository.create.mockReturnValue(createdUser);
            mockRepository.save.mockResolvedValue(savedUser);

            // Act
            const result = await userService.createUser(createUserDto);

            // Assert
            expect(result).toEqual(savedUser);
            expect(mockedBcrypt.hash).toHaveBeenCalledWith('testPassword', 10);
            expect(mockRepository.create).toHaveBeenCalledWith({
                ...createUserDto,
                hashedPassword,
            });
            expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
        });
    });

    describe('createOAuthUser', () => {
        it('should create Oauth user successfully', async () => {
            // Arrange
            const oauthuserDto = {
                email: 'test@test.com',
                firstName: 'John',
                lastName: 'Doe',
                accessToken: 'fake-oauth-token',
                picture: 'https://example.com/profile.jpg',
            };

            const createdUser = {
                ...oauthuserDto,
                hashedPassword: null,
                isOauth: true,
            };
            const savedUser = { id: 1, ...createdUser };

            mockRepository.create.mockReturnValue(createdUser);
            mockRepository.save.mockResolvedValue(savedUser);

            // Act
            const result = await userService.createOAuthUser(oauthuserDto);

            // Assert
            expect(result).toEqual(savedUser);
            expect(mockRepository.create).toHaveBeenCalledWith({
                ...oauthuserDto,
                hashedPassword: null,
                isOauth: true,
            });
            expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
        });

        it('should throw UserCreationexception when save fails', async () => {
            // Arrange
            const oauthuserDto = {
                email: 'test@test.com',
                firstName: 'John',
                lastName: 'Doe',
                accessToken: 'fake-oauth',
                picture: 'https://example.com/profile.jpg',
            };

            const createdUser = {
                ...oauthuserDto,
                hashedPassword: null,
                isOauth: true,
            };

            mockRepository.create.mockReturnValue(createdUser);
            mockRepository.save.mockResolvedValue(null);

            // Act
            await expect(userService.createOAuthUser(oauthuserDto)).rejects.toThrow(UserCreationException);
            await expect(userService.createOAuthUser(oauthuserDto)).rejects.toThrow('Failed to create OAuth user');

            // Assert
            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
        });
    });
});
