import { Exclude, Expose } from 'class-transformer';
import { User } from '../entities/user.entity';

@Exclude()
class UserWithoutPasswordDto {
    @Expose()
    id: number;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    email: string;

    @Expose()
    isOauth?: boolean;

    @Expose()
    isActive?: boolean;

    @Expose()
    joinedDate?: Date;

    constructor(userEntity: Partial<User>) {
        Object.assign(this, userEntity);
    }
}

export { UserWithoutPasswordDto };
