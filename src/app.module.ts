import { Module } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllExceptionsFilter } from './core/exceptions/all-exceptions.filter';
import { APP_FILTER } from '@nestjs/core';
import { typeOrmConfig } from './core/database/ormconfig';

@Module({
    imports: [UserModule, ConfigModule.forRoot(), TypeOrmModule.forRoot(typeOrmConfig)],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
})
export class AppModule {}
