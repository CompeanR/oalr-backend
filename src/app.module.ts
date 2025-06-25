import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { APP_FILTER } from '@nestjs/core';
import { typeOrmConfig } from './core/database/ormconfig';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { validateEnvironment } from './config/validation';

@Module({
    imports: [
        UserModule,
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validate: validateEnvironment,
        }),
        TypeOrmModule.forRoot(typeOrmConfig),
        AuthModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
})
export class AppModule {}
