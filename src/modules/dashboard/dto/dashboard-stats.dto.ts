import { IsNumber, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UserGrowthData {
    @IsDate()
    @Type(() => Date)
    date: Date;

    @IsNumber()
    count: number;
}

export class DashboardStatsDto {
    @IsNumber()
    totalUsers: number;

    @IsNumber()
    activeUsers: number;

    @IsNumber()
    inactiveUsers: number;

    @IsNumber()
    oauthUsers: number;

    @IsNumber()
    passwordUsers: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UserGrowthData)
    weeklyGrowth: UserGrowthData[];

    @IsDate()
    @Type(() => Date)
    lastUpdated: Date;
}
