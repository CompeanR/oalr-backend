import { IsString, Length } from 'class-validator';

class LoginDto {
    @IsString()
    @Length(8, 50)
    email: string;

    @IsString()
    @Length(8, 50)
    password: string;
}

export { LoginDto };
