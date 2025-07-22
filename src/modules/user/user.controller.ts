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
    UseGuards,
    Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

    @Get()
    public async getAllUsers(): Promise<UserWithoutPasswordDto[]> {
        const users = await this.userService.getAllUsers();
        return users.map((user) => new UserWithoutPasswordDto(user));
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt'))
    public async getCurrentUser(@Req() req: any): Promise<UserWithoutPasswordDto> {
        const user = await this.userService.getUserById(req.user.userId);
        return new UserWithoutPasswordDto(user);
    }

    @Get(':id')
    public async getUser(@Param('id') id: string): Promise<UserWithoutPasswordDto> {
        const userId = Number(id);
        const user = await this.userService.getUserById(userId);
        return new UserWithoutPasswordDto(user);
    }

    @Post()
    public async createUser(@Body() user: CreateUserDto): Promise<JwtPayload> {
        const createdUser = await this.userService.createUser(user);
        const token = this.authService.createTokenForUser(createdUser);
        return token;
    }

    @Post('validate')
    public async validateUserCredentials(
        @Body() user: { email: string; password: string },
    ): Promise<UserWithoutPasswordDto> {
        const validatedUser = await this.userService.validateUserCredentials(user.email, user.password);
        return new UserWithoutPasswordDto(validatedUser);
    }

    @Put('profile')
    @UseGuards(AuthGuard('jwt'))
    public async updateProfile(@Req() req: any, @Body() user: UpdateUserDto): Promise<UserWithoutPasswordDto> {
        const updatedUser = await this.userService.updateUser(req.user.userId, user);
        return new UserWithoutPasswordDto(updatedUser);
    }

    @Put('password')
    @UseGuards(AuthGuard('jwt'))
    public async updatePassword(
        @Req() req: any, 
        @Body() passwordData: { currentPassword: string; newPassword: string }
    ): Promise<{ message: string }> {
        await this.userService.updatePassword(req.user.userId, passwordData.currentPassword, passwordData.newPassword);
        return { message: 'Password updated successfully' };
    }

    @Put(':id')
    public async updateUser(@Param('id') id: string, @Body() user: UpdateUserDto): Promise<UserWithoutPasswordDto> {
        const userId = Number(id);
        const updatedUser = await this.userService.updateUser(userId, user);
        return new UserWithoutPasswordDto(updatedUser);
    }

    @Delete(':id')
    public async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
        const userId = Number(id);
        await this.userService.deleteUser(userId);
        return { message: `User with ${id} successfully deleted` };
    }
}

export { UserController };
