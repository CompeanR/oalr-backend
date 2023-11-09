import { IsBoolean, IsDateString, IsEmail, IsNumber, IsOptional, IsString, Length } from 'class-validator';

class UserBase {
    @IsNumber()
    id: number;

    @IsString()
    @Length(2, 50)
    name: string;

    @IsString()
    @Length(2, 50)
    username: string;

    @IsEmail()
    email: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsDateString()
    @IsOptional()
    joinedDate?: Date;

    @IsString()
    @IsOptional()
    @Length(0, 300)
    bio?: string;
}

export { UserBase };
