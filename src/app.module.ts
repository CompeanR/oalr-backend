import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { APP_FILTER } from '@nestjs/core';
import { typeOrmConfig } from './core/database/ormconfig';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import configuration from './config/configuration';
import { validateEnvironment } from './config/validation';
import { AppLoggerService } from 'src/shared/services/logger.service';
import { SecurityMiddleware } from 'src/shared/middleware/security.middleware';

@Module({
    imports: [
        UserModule,
        DashboardModule,
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validate: validateEnvironment,
        }),
        TypeOrmModule.forRoot(typeOrmConfig),
        AuthModule,
        HealthModule,
    ],
    controllers: [],
    providers: [
        AppLoggerService,
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
    exports: [AppLoggerService],
})
export class AppModule implements NestModule {
    /**
     * Configures middleware for the application.
     *
     * @param consumer The middleware consumer to apply middleware to routes.
     */
    public configure(consumer: MiddlewareConsumer): void {
        consumer.apply(SecurityMiddleware).forRoutes('*');
    }
}
