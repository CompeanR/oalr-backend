import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../user/entities/user.entity';
import { AppLoggerService } from '../../shared/services/logger.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), PassportModule, AuthModule],
    controllers: [DashboardController],
    providers: [DashboardService, AppLoggerService],
    exports: [DashboardService],
})
export class DashboardModule {}
