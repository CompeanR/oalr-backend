import { Exclude } from 'class-transformer';
import { UserBase } from './base/base-user.dto';

class UserWithoutPasswordDto extends UserBase {
    @Exclude()
    hashedPassword: string;
}

export { UserWithoutPasswordDto };
