import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { RateLimitGuard } from '../../shared/guards/rate-limit.guard';

@Controller('dashboard')
class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('stats')
    @UseGuards(AuthGuard('jwt'), RateLimitGuard)
    public async getDashboardStats(): Promise<DashboardStatsDto> {
        return await this.dashboardService.getDashboardStats();
    }

    @Get('cache/clear')
    @UseGuards(AuthGuard('jwt'))
    public async clearCache(): Promise<{ message: string }> {
        this.dashboardService.clearCache();
        return { message: 'Dashboard cache cleared successfully' };
    }

    @Get('cache/info')
    @UseGuards(AuthGuard('jwt'))
    public async getCacheInfo(): Promise<{ size: number; keys: string[] }> {
        return this.dashboardService.getCacheInfo();
    }
}

export { DashboardController };