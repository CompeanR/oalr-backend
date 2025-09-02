import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const createTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get<string>('database.username'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.name'),
    autoLoadEntities: true,
    migrations: ['dist/core/database/migrations/**/*.{ts,js}'],
    synchronize: false,
    logging: configService.get<string>('nodeEnv') === 'development',
});
