import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { UserWithoutPasswordDto } from './dto/response-user.dto';

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
    public async getUser(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    /**
     * Creates a new user with the given input data.
     *
     * @param userInput - The data for the new user.
     * @returns The newly created user.
     */
    public async createUser(userInput: CreateUserDto): Promise<UserWithoutPasswordDto> {
        const hashedPassword = await bcrypt.hash(userInput.password, 10);

        const user = this.userRepository.create({
            ...userInput,
            hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);

        // We don't want to return the password to the client, so we'll omit it from the response.
        return plainToClass(UserWithoutPasswordDto, savedUser);
    }

    /**
     * Updates a user with the given ID.
     *
     * @param userId - The ID of the user to update.
     * @param userUpdate - The data to update the user with.
     * @returns The updated user.
     */
    public async updateUser(userId: number, userUpdate: UpdateUserDto): Promise<User> {
        const existingUser = await this.getUser(userId);
        const updatedUser = { ...existingUser, ...userUpdate };

        return await this.userRepository.save(updatedUser);
    }

    /**
     * Deletes a user with the specified ID.
     *
     * @param userId The ID of the user to delete.
     */
    public async deleteUser(userId: number): Promise<void> {
        await this.userRepository.delete(userId);
    }
}

export { UserService };
