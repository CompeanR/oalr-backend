import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsString()
    userName: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}
