import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../../modules/user/entities/user.entity';

const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'oalr',
    password: 'oalr123',
    database: 'oalr',
    entities: [User], // Direct entity imports - works in all environments
    migrations: ['dist/core/database/migrations/**/*.{ts,js}'],
    synchronize: false,
    logging: false,
};

export { typeOrmConfig };
