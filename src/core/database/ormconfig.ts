import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'compean',
    password: 'javier123',
    database: 'oalr',
    entities: ['dist/**/*.entity.{ts,js}'],
    migrations: ['dist/core/database/migrations/**/*.{ts,js}'],
    synchronize: false,
    logging: false,
};

export { typeOrmConfig };
