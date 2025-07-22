import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DeleteResult, Repository } from 'typeorm';
import { OAuthUserDto } from './dto/oauth-user-dto';
import { UserCreationException } from 'src/shared/exceptions/common.exception';

@Injectable()
class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    public async getAllUsers(): Promise<User[]> {
        return await this.userRepository.find();
    }

    public async getUserById(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    public async getUserByEmail(email: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { email } });
        return user;
    }

    public async createUser(userInput: CreateUserDto): Promise<User> {
        const hashedPassword = await bcrypt.hash(userInput.password, 10);

        const user = this.userRepository.create({
            ...userInput,
            hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);
        return savedUser;
    }

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

    public async updateUser(userId: number, userUpdate: UpdateUserDto): Promise<User> {
        const existingUser = await this.getUserById(userId);
        const updatedUser = { ...existingUser, ...userUpdate };

        return await this.userRepository.save(updatedUser);
    }

    public async deleteUser(userId: number): Promise<DeleteResult> {
        const deletionResponse = await this.userRepository.delete({ id: userId });
        if (deletionResponse.affected === 0) {
            throw new NotFoundException('User not found');
        }

        return deletionResponse;
    }

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
