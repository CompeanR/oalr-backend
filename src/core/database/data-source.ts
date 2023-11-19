import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'compean',
    password: 'javier123',
    database: 'oalr',
    entities: ['src/**/*.entity.{ts,js}'],
    migrations: ['src/core/database/migrations/**/*.{ts,js}'],
    synchronize: false,
    logging: false,
});
