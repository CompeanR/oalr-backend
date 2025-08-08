import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { HealthService } from '../health.service';
import { mockConfigService, mockDataSource } from 'src/test/test-utils';

describe('HealthService', () => {
    let service: HealthService;
    let originalMemoryUsage: typeof process.memoryUsage;

    beforeAll(() => {
        originalMemoryUsage = process.memoryUsage;
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HealthService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
            ],
        }).compile();

        service = module.get<HealthService>(HealthService);
        jest.clearAllMocks();
        
        // Reset memory usage to normal values for each test
        (process.memoryUsage as any) = jest.fn().mockReturnValue({
            heapUsed: 50 * 1024 * 1024,  // 50MB
            heapTotal: 100 * 1024 * 1024, // 100MB (50% usage)
            external: 0,
            arrayBuffers: 0,
            rss: 0,
        });
    });

    afterAll(() => {
        process.memoryUsage = originalMemoryUsage;
    });

    describe('getDetailedHealth', () => {
        it('should return healthy status when all systems are operational', async () => {
            mockDataSource.query.mockResolvedValue([{ result: 1 }]);

            const result = await service.getDetailedHealth() as any;

            expect(result.status).toBe('healthy');
            expect(result.checks).toHaveProperty('database');
            expect(result.checks).toHaveProperty('memory');
            expect(result.checks).toHaveProperty('disk');
        });

        it('should return unhealthy status when database fails', async () => {
            mockDataSource.query.mockRejectedValue(new Error('Connection failed'));

            const result = await service.getDetailedHealth() as any;

            expect(result.status).toBe('unhealthy');
        });

        it('should return degraded status when memory usage is high', async () => {
            mockDataSource.query.mockResolvedValue([{ result: 1 }]);
            (process.memoryUsage as any) = jest.fn().mockReturnValue({
                heapUsed: 95 * 1024 * 1024,
                heapTotal: 100 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
                rss: 0,
            });

            const result = await service.getDetailedHealth() as any;

            expect(result.status).toBe('degraded');
        });
    });

    describe('getReadiness', () => {
        it('should be ready when all checks pass', async () => {
            mockDataSource.query.mockResolvedValue([{ result: 1 }]);

            const result = await service.getReadiness() as any;

            expect(result.status).toBe('ready');
        });

        it('should not be ready when database check fails', async () => {
            mockDataSource.query.mockRejectedValue(new Error('Database error'));

            const result = await service.getReadiness() as any;

            expect(result.status).toBe('not_ready');
        });
    });

    describe('error handling', () => {
        it('should handle database connection errors gracefully', async () => {
            mockDataSource.query.mockRejectedValue(new Error('Connection timeout'));

            const result = await service.getDetailedHealth() as any;
            const dbCheck = result.checks.database;

            expect(dbCheck.status).toBe('error');
            expect(dbCheck.error).toBe('Connection timeout');
        });
    });
});