import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
class AppLoggerService implements LoggerService {
    private readonly logger = new Logger(AppLoggerService.name);
    private readonly isProduction: boolean;

    constructor(private configService: ConfigService) {
        this.isProduction = this.configService.get('nodeEnv') === 'production';
    }

    /**
     * Logs a general message.
     *
     * @param message The message to log.
     * @param context Optional context for the log.
     */
    public log(message: any, context?: string): void {
        this.logger.log(message, context);
    }

    /**
     * Logs an error message with optional stack trace.
     *
     * @param message The error message to log.
     * @param trace Optional stack trace.
     * @param context Optional context for the log.
     */
    public error(message: any, trace?: string, context?: string): void {
        this.logger.error(message, trace, context);
    }

    /**
     * Logs a warning message.
     *
     * @param message The warning message to log.
     * @param context Optional context for the log.
     */
    public warn(message: any, context?: string): void {
        this.logger.warn(message, context);
    }

    /**
     * Logs a debug message (only in development).
     *
     * @param message The debug message to log.
     * @param context Optional context for the log.
     */
    public debug(message: any, context?: string): void {
        if (!this.isProduction) {
            this.logger.debug(message, context);
        }
    }

    /**
     * Logs a verbose message (only in development).
     *
     * @param message The verbose message to log.
     * @param context Optional context for the log.
     */
    public verbose(message: any, context?: string): void {
        if (!this.isProduction) {
            this.logger.verbose(message, context);
        }
    }

    /**
     * Logs HTTP request information with response time.
     *
     * @param method HTTP method (GET, POST, etc.).
     * @param url Request URL.
     * @param statusCode HTTP status code.
     * @param responseTime Response time in milliseconds.
     * @param userAgent Optional user agent string.
     */
    public logRequest(method: string, url: string, statusCode: number, responseTime: number, userAgent?: string): void {
        const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
        const context = 'HTTP';
        
        if (statusCode >= 400) {
            this.error(message, undefined, context);
        } else {
            this.log(message, context);
        }
    }

    /**
     * Logs database query information (only in development).
     *
     * @param query The SQL query string.
     * @param parameters Optional query parameters.
     * @param executionTime Optional execution time in milliseconds.
     */
    public logDatabaseQuery(query: string, parameters?: any[], executionTime?: number): void {
        if (!this.isProduction) {
            const message = `Query: ${query}`;
            const metadata = {
                parameters,
                executionTime: executionTime ? `${executionTime}ms` : undefined,
            };
            this.debug(`${message} | ${JSON.stringify(metadata)}`, 'Database');
        }
    }

    /**
     * Logs user actions for audit purposes.
     *
     * @param userId The ID of the user performing the action.
     * @param action The action being performed.
     * @param metadata Optional additional metadata about the action.
     */
    public logUserAction(userId: string, action: string, metadata?: Record<string, any>): void {
        const message = `User ${userId} performed action: ${action}`;
        const context = 'UserAction';
        
        if (metadata) {
            this.log(`${message} | ${JSON.stringify(metadata)}`, context);
        } else {
            this.log(message, context);
        }
    }
}

export { AppLoggerService };