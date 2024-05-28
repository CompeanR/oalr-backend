import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Put,
    Delete,
    UseInterceptors,
    ClassSerializerInterceptor,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserWithoutPasswordDto } from './dto';
import { AuthService } from 'src/auth/auth.service';
import { JwtPayload } from 'src/auth/interfaces';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('user')
class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
    ) {}

    /**
     * Retrieves all users.
     *
     * @returns A promise that resolves to an array of UserWithoutPasswordDto objects.
     */
    @Get()
    public async getAllUsers(): Promise<UserWithoutPasswordDto[]> {
        const users = await this.userService.getAllUsers();
        return users.map((user) => new UserWithoutPasswordDto(user));
    }

    /**
     * Retrieves a user by their ID.
     *
     * @param id - The ID of the user.
     * @returns A Promise that resolves to a UserWithoutPasswordDto object representing the user.
     */
    @Get(':id')
    public async getUser(@Param('id') id: string): Promise<UserWithoutPasswordDto> {
        const userId = Number(id);
        const user = await this.userService.getUserById(userId);
        return new UserWithoutPasswordDto(user);
    }

    /**
     * Creates a new user.
     *
     * @param user The user data.
     * @returns A promise that resolves to the JWT payload of the created user.
     */
    @Post()
    public async createUser(@Body() user: CreateUserDto): Promise<JwtPayload> {
        const createdUser = await this.userService.createUser(user);
        const token = this.authService.createTokenForUser(createdUser);
        return token;
    }

    /**
     * Validates the user credentials.
     *
     * @param user - The user object containing the email and password.
     * @returns A promise that resolves to a UserWithoutPasswordDto object.
     */
    @Post('validate')
    public async validateUserCredentials(
        @Body() user: { email: string; password: string },
    ): Promise<UserWithoutPasswordDto> {
        const validatedUser = await this.userService.validateUserCredentials(user.email, user.password);
        return new UserWithoutPasswordDto(validatedUser);
    }

    /**
     * Updates a user with the specified ID.
     *
     * @param id - The ID of the user to update.
     * @param user - The updated user data.
     *
     * @returns A Promise that resolves to the updated user without the password.
     */
    @Put(':id')
    public async updateUser(
        @Param('id') id: string,
        @Body() user: UpdateUserDto,
    ): Promise<UserWithoutPasswordDto> {
        const userId = Number(id);
        const updatedUser = await this.userService.updateUser(userId, user);
        return new UserWithoutPasswordDto(updatedUser);
    }

    /**
     * Deletes a user by their ID.
     *
     * @param id - The ID of the user to delete.
     * @returns A promise that resolves to an object with a message indicating the success of the deletion.
     */
    @Delete(':id')
    public async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
        const userId = Number(id);
        await this.userService.deleteUser(userId);
        return { message: `User with ${id} successfully deleted` };
    }
}

export { UserController };
