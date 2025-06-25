import { IsString, IsNumber, IsOptional, IsUrl, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class EnvironmentVariables {
    @IsOptional()
    @IsIn(['development', 'production', 'test'])
    NODE_ENV: string = 'development';

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    PORT: number = 3000;

    // Database
    @IsString()
    DB_HOST: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    DB_PORT: number = 5432;

    @IsString()
    DB_USERNAME: string;

    @IsString()
    DB_PASSWORD: string;

    @IsString()
    DB_NAME: string;

    // JWT
    @IsString()
    JWT_SECRET_KEY: string;

    @IsOptional()
    @IsString()
    JWT_EXPIRATION_TIME: string = '24h';

    // OAuth
    @IsString()
    GOOGLE_CLIENT_ID: string;

    @IsString()
    GOOGLE_CLIENT_SECRET: string;

    // CORS
    @IsOptional()
    @IsUrl({ require_tld: false })
    FRONTEND_URL: string = 'http://localhost:5173';
}

export default (): Record<string, any> => ({
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.PORT || '3000', 10),

    database: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },

    jwt: {
        secret: process.env.JWT_SECRET_KEY,
        expirationTime: process.env.JWT_EXPIRATION_TIME || '24h',
    },

    oauth: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },

    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:5173',
    },
});
