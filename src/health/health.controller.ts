import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
class HealthController {
    constructor(private readonly healthService: HealthService) {}

    /**
     * Basic health check endpoint for load balancers.
     * Returns 200 if the service is running.
     *
     * @returns Basic health status.
     */
    @Get()
    public getHealth(): { status: string; timestamp: string } {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Detailed health check including database connectivity and system info.
     *
     * @returns Detailed health information.
     */
    @Get('detailed')
    public async getDetailedHealth(): Promise<object> {
        return this.healthService.getDetailedHealth();
    }

    /**
     * Readiness probe for Kubernetes deployments.
     * Checks if the service is ready to accept traffic.
     *
     * @returns Readiness status.
     */
    @Get('ready')
    public async getReadiness(): Promise<{ status: string; checks: object }> {
        return this.healthService.getReadiness();
    }

    /**
     * Liveness probe for Kubernetes deployments.
     * Checks if the service is alive and should not be restarted.
     *
     * @returns Liveness status.
     */
    @Get('live')
    public getLiveness(): { status: string; uptime: number } {
        return {
            status: 'ok',
            uptime: process.uptime(),
        };
    }
}

export { HealthController };