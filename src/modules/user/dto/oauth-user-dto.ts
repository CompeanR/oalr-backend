import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

class OAuthUserDto {
    @IsNotEmpty()
    accessToken: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    picture: string;
}

export { OAuthUserDto };
