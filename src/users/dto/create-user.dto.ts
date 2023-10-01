import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsString()
  @Length(2, 50)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8)
  password: string;

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
