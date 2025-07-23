import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { RateLimitGuard } from '../../shared/guards/rate-limit.guard';

@ApiTags('dashboard')
@Controller('dashboard')
class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('stats')
    @UseGuards(AuthGuard('jwt'), RateLimitGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    @ApiResponse({ 
        status: 200, 
        description: 'Dashboard statistics retrieved successfully', 
        type: DashboardStatsDto 
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
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
