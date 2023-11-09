import { IsString, Length } from 'class-validator';
import { UserBase } from './base/base-user.dto';

class CreateUserDto extends UserBase {
    @IsString()
    @Length(8, 50)
    password: string;
}

export { CreateUserDto };
