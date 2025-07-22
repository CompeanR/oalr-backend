import { IsBoolean, IsDateString, IsEmail, IsOptional, IsString, Length } from 'class-validator';

class UpdateUserDto {
    @IsString()
    @IsOptional()
    @Length(2, 50)
    firstName?: string;

    @IsString()
    @IsOptional()
    @Length(2, 50)
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

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

export { UpdateUserDto };
