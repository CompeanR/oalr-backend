import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { DashboardStatsDto, UserGrowthData } from './dto/dashboard-stats.dto';
import { AppLoggerService } from '../../shared/services/logger.service';

@Injectable()
class DashboardService {
    private cache = new Map<string, { data: any; expires: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000;

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly logger: AppLoggerService,
    ) {}

    public async getDashboardStats(): Promise<DashboardStatsDto> {
        const cacheKey = 'dashboard:stats';
        const cached = this.cache.get(cacheKey);

        if (cached && cached.expires > Date.now()) {
            this.logger.debug('Returning cached dashboard stats', 'DashboardService');
            return cached.data;
        }

        this.logger.log('Calculating fresh dashboard stats', 'DashboardService');
        const startTime = Date.now();

        try {
            const stats = await this.calculateRealTimeStats();

            this.cache.set(cacheKey, {
                data: stats,
                expires: Date.now() + this.CACHE_TTL,
            });

            const calculationTime = Date.now() - startTime;
            this.logger.log(`Dashboard stats calculated in ${calculationTime}ms`, 'DashboardService');

            return stats;
        } catch (error) {
            this.logger.error(
                'Failed to calculate dashboard stats',
                error instanceof Error ? error.stack : String(error),
                'DashboardService',
            );
            throw error;
        }
    }

    private async calculateRealTimeStats(): Promise<DashboardStatsDto> {
        const [totalUsers, activeUsers, oauthUsers, weeklyGrowth] = await Promise.all([
            this.userRepository.count(),
            this.userRepository.count({ where: { isActive: true } }),
            this.userRepository.count({ where: { isOauth: true } }),
            this.getWeeklyUserGrowth(),
        ]);

        return {
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            oauthUsers,
            passwordUsers: totalUsers - oauthUsers,
            weeklyGrowth,
            lastUpdated: new Date(),
        };
    }

    private async getWeeklyUserGrowth(): Promise<UserGrowthData[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const growthData = await this.userRepository
            .createQueryBuilder('user')
            .select(['DATE(user.joinedDate) as date', 'COUNT(*) as count'])
            .where('user.joinedDate >= :startDate', { startDate: sevenDaysAgo })
            .groupBy('DATE(user.joinedDate)')
            .orderBy('date', 'ASC')
            .getRawMany();

        return growthData.map((item) => ({
            date: new Date(item.date),
            count: parseInt(item.count, 10),
        }));
    }

    public clearCache(): void {
        this.cache.clear();
        this.logger.log('Dashboard cache cleared', 'DashboardService');
    }

    public getCacheInfo(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

export { DashboardService };
