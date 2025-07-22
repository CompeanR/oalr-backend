import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DeleteResult, Repository } from 'typeorm';
import { OAuthUserDto } from './dto/oauth-user-dto';
import { UserCreationException } from 'src/shared/exceptions/common.exception';

/**
 * Service responsible for managing User entities.
 */
@Injectable()
class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    /**
     * Retrieves all users from the database.
     *
     * @returns {Promise<User[]>} A promise that resolves to an array of User objects.
     */
    public async getAllUsers(): Promise<User[]> {
        return await this.userRepository.find();
    }

    /**
     * Retrieves a user by their ID.
     *
     * @param userId The ID of the user to retrieve.
     * @returns A Promise that resolves to the retrieved User object.
     */
    public async getUserById(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    /**
     * Retrieves a user by their email address.
     *
     * @param email - The email address of the user to retrieve.
     * @returns A Promise that resolves to the User object if found, or throws a NotFoundException if not found.
     */
    public async getUserByEmail(email: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { email } });
        return user;
    }

    /**
     * Creates a new user with the given input data.
     *
     * @param userInput - The data for the new user.
     * @returns The newly created user.
     */
    public async createUser(userInput: CreateUserDto): Promise<User> {
        const hashedPassword = await bcrypt.hash(userInput.password, 10);

        const user = this.userRepository.create({
            ...userInput,
            hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);
        return savedUser;
    }

    /**
     * Creates a new OAuth user.
     *
     * @param userInput - The input data for creating the user.
     *
     * @returns A Promise that resolves to the created user.
     * @throws NotFoundException if failed to create the OAuth user.
     */
    public async createOAuthUser(userInput: OAuthUserDto): Promise<User> {
        const user = this.userRepository.create({
            ...userInput,
            hashedPassword: null,
            isOauth: true,
        });

        const savedUser = await this.userRepository.save(user);
        if (!savedUser) {
            throw new UserCreationException('Failed to create OAuth user');
        }

        return savedUser;
    }

    /**
     * Updates a user with the given ID.
     *
     * @param userId - The ID of the user to update.
     * @param userUpdate - The data to update the user with.
     *
     * @returns The updated user.
     */
    public async updateUser(userId: number, userUpdate: UpdateUserDto): Promise<User> {
        const existingUser = await this.getUserById(userId);
        const updatedUser = { ...existingUser, ...userUpdate };

        return await this.userRepository.save(updatedUser);
    }

    /**
     * Deletes a user with the specified ID.
     *
     * @param userId The ID of the user to delete.
     */
    public async deleteUser(userId: number): Promise<DeleteResult> {
        const deletionResponse = await this.userRepository.delete({ id: userId });
        if (deletionResponse.affected === 0) {
            throw new NotFoundException('User not found');
        }

        return deletionResponse;
    }

    /**
     * Validates a user's credentials by checking if the email and password match an existing user.
     *
     * @param email The email of the user to validate.
     * @param password The password of the user to validate.
     *
     * @returns A Promise that resolves with the validated User object.
     * @throws NotFoundException if the user is not found or the password is invalid.
     */
    public async validateUserCredentials(email: string, password: string): Promise<User> {
        const user = await this.getUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is inactive');
        }

        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword || '');
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }

    public async updatePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.getUserById(userId);
        
        if (user.isOauth) {
            throw new UnauthorizedException('Cannot update password for OAuth users');
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword || '');
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is invalid');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepository.update(userId, { hashedPassword: hashedNewPassword });
    }

}

export { UserService };
