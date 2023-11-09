import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserWithoutPasswordDto } from './dto/response-user.dto';
import { User } from './entities/user.entity';

@Controller()
class UserController {
    constructor(private readonly usersService: UserService) {}

    @Get('users')
    public async getAllUsers(): Promise<User[]> {
        return await this.usersService.getAllUsers();
    }

    @Get('users/:id')
    public async getUser(@Param('id') id: string): Promise<User> {
        const userId = Number(id);
        return await this.usersService.getUser(userId);
    }

    @Post('users')
    public async createUser(@Body() user: CreateUserDto): Promise<UserWithoutPasswordDto> {
        const createdUser = await this.usersService.createUser(user);
        return createdUser;
    }

    @Put('users/:id')
    public async updateUser(@Param('id') id: string, @Body() user: UpdateUserDto): Promise<User> {
        const userId = Number(id);
        const updatedUser = await this.usersService.updateUser(userId, user);
        return updatedUser;
    }

    @Delete('users/:id')
    public async deleteUser(@Param('id') id: string): Promise<null> {
        const userId = Number(id);
        await this.usersService.deleteUser(userId);
        return null;
    }
}

export { UserController };
