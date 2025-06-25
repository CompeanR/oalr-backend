import { Catch, ExceptionFilter, HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DatabaseErrorCodes } from './utils/errorCodes';
import { IException } from './interfaces/exception.interface';
import { Request, Response } from 'express';
import { AppLoggerService } from 'src/shared/services/logger.service';

/**
 * Catches any unhandled exceptions and sends an appropriate response to the client.
 */
@Catch()
class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly logger: AppLoggerService) {}

    public catch(exception: IException, host: ArgumentsHost): void {
        const { response, request } = this.getContext(host);

        const status = this.getStatus(exception);
        const message = this.getMessage(exception);

        // Log the exception with context
        this.logException(exception, request, status);

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });
    }

    /**
     * Returns an object containing the response and request
     * objects from the provided ArgumentsHost object.
     *
     * @param host - The ArgumentsHost object to extract the response and request objects from.
     * @returns An object containing the response and request objects.
     */
    private getContext(host: ArgumentsHost): { response: Response; request: Request } {
        const httpContext = host.switchToHttp();
        const response = httpContext.getResponse();
        const request = httpContext.getRequest();

        return { response, request };
    }

    /**
     * If the exception is an instance of HttpException, its status code is returned.
     * Otherwise, HttpStatus.INTERNAL_SERVER_ERROR is returned.
     *
     * @param exception The exception to get the status code for.
     * @returns The HTTP status code for the given exception.
     */
    private getStatus(exception: IException): number {
        if (exception instanceof HttpException) {
            return exception.getStatus();
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    /**
     * Returns the error message for the given exception.
     *
     * @param exception - The exception to get the message for.
     * @returns The error message as a string or object.
     */
    private getMessage(exception: IException): string | object {
        if (exception instanceof QueryFailedError) {
            switch (exception.code) {
                case DatabaseErrorCodes.DUPLICATE_ENTRY:
                    return {
                        status: 'error',
                        message: this.formatDetailMessage(exception.detail),
                        detail: 'Repeated value',
                    };
            }
        }

        if (exception instanceof HttpException) {
            return exception.getResponse();
        }

        if (exception.hasOwnProperty('message')) {
            return exception.message;
        }

        return 'Internal server error';
    }

    /**
     * Logs exception details with context information.
     *
     * @param exception The exception that occurred.
     * @param request The HTTP request object.
     * @param status The HTTP status code.
     */
    private logException(exception: IException, request: Request, status: number): void {
        const context = {
            method: request.method,
            url: request.url,
            userAgent: request.get('User-Agent'),
            ip: request.ip,
            status,
        };

        if (status >= 500) {
            // Server errors - log as error with stack trace
            this.logger.error(
                `Internal server error: ${exception.message}`,
                exception.stack,
                'ExceptionFilter'
            );
            this.logger.debug(`Error context: ${JSON.stringify(context)}`, 'ExceptionFilter');
        } else if (status >= 400) {
            // Client errors - log as warning
            this.logger.warn(
                `Client error: ${exception.message}`,
                'ExceptionFilter'
            );
            this.logger.debug(`Error context: ${JSON.stringify(context)}`, 'ExceptionFilter');
        } else {
            // Other exceptions
            this.logger.log(
                `Exception handled: ${exception.message}`,
                'ExceptionFilter'
            );
        }
    }

    /**
     * Formats the detail message of an exception by extracting the username from the message
     *
     * @param detail The detail message of the exception.
     * @returns A formatted error message with the username if found.
     */
    private formatDetailMessage(detail: string): string {
        // This regex captures the value inside the parentheses after "userName" and before "="
        const regex = /"userName"\)=\(([^)]+)\)/;

        const match = detail.match(regex);
        if (match && match[1]) {
            return `The username '${match[1]}' is already taken.`;
        }

        return detail;
    }
}

export { AllExceptionsFilter };
