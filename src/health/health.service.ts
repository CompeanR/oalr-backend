import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
class HealthService {
    private readonly startTime: Date;

    constructor(
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
    ) {
        this.startTime = new Date();
    }

    public async getDetailedHealth(): Promise<object> {
        const checks = await this.performHealthChecks();
        const systemInfo = this.getSystemInfo();

        return {
            status: this.determineOverallStatus(checks),
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: this.configService.get('nodeEnv'),
            version: '1.0.0',
            checks,
            system: systemInfo,
        };
    }

    public async getReadiness(): Promise<{ status: string; checks: object }> {
        const checks = await this.performHealthChecks();
        const isReady = Object.values(checks).every((check: any) => check.status === 'ok');

        return {
            status: isReady ? 'ready' : 'not_ready',
            checks,
        };
    }

    private async performHealthChecks(): Promise<object> {
        const checks = {
            database: await this.checkDatabase(),
            memory: this.checkMemory(),
            disk: this.checkDisk(),
        };

        return checks;
    }

    private async checkDatabase(): Promise<{ status: string; responseTime?: number; error?: string }> {
        const startTime = Date.now();

        try {
            await this.dataSource.query('SELECT 1');
            const responseTime = Date.now() - startTime;

            return {
                status: 'ok',
                responseTime,
            };
        } catch (error) {
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Database connection failed',
            };
        }
    }

    private checkMemory(): { status: string; usage: object } {
        const memoryUsage = process.memoryUsage();
        const totalMemory = memoryUsage.heapTotal;
        const usedMemory = memoryUsage.heapUsed;
        const memoryPercentage = (usedMemory / totalMemory) * 100;

        return {
            status: memoryPercentage > 90 ? 'warning' : 'ok',
            usage: {
                used: Math.round(usedMemory / 1024 / 1024), // MB
                total: Math.round(totalMemory / 1024 / 1024), // MB
                percentage: Math.round(memoryPercentage),
            },
        };
    }

    private checkDisk(): { status: string; message: string } {
        // Simplified disk check - in production, you might use a library to check actual disk usage
        return {
            status: 'ok',
            message: 'Disk space monitoring not implemented',
        };
    }

    private getSystemInfo(): object {
        return {
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid,
            startTime: this.startTime.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
    }

    private determineOverallStatus(checks: object): string {
        const checkValues = Object.values(checks);

        if (checkValues.some((check: any) => check.status === 'error')) {
            return 'unhealthy';
        }

        if (checkValues.some((check: any) => check.status === 'warning')) {
            return 'degraded';
        }

        return 'healthy';
    }
}

export { HealthService };
