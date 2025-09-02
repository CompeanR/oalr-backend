import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const createAppDataSource = (configService: ConfigService): DataSource => {
    return new DataSource({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: ['src/**/*.entity.{ts,js}'],
        migrations: ['src/core/database/migrations/**/*.{ts,js}'],
        synchronize: false,
        logging: configService.get<string>('nodeEnv') === 'development',
    });
};
