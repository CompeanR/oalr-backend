import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../../modules/user/entities/user.entity';

const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    username: 'oalr',
    password: 'oalr123',
    database: 'oalr',
    autoLoadEntities: true,
    migrations: ['dist/core/database/migrations/**/*.{ts,js}'],
    synchronize: false,
    logging: false,
};

export { typeOrmConfig };
