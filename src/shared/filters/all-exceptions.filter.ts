import { Catch, ExceptionFilter, HttpException, ArgumentsHost, HttpStatus, BadRequestException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DatabaseErrorCodes } from './utils/errorCodes';
import { IException } from './interfaces/exception.interface';
import { Request, Response } from 'express';
import { AppLoggerService } from 'src/shared/services/logger.service';

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

    private getContext(host: ArgumentsHost): { response: Response; request: Request } {
        const httpContext = host.switchToHttp();
        const response = httpContext.getResponse();
        const request = httpContext.getRequest();

        return { response, request };
    }

    private getStatus(exception: IException): number {
        if (exception instanceof HttpException) {
            return exception.getStatus();
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

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

        if (exception instanceof BadRequestException) {
            const response = exception.getResponse() as any;

            if (Array.isArray(response.message)) {
                return {
                    status: 'validation_error',
                    message: 'Please check the following fields:',
                    errors: response.message.map((error: string) => ({
                        field: this.getFieldFromMessage(error),
                        message: this.makeUserFriendlyMessage(error),
                    })),
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
            this.logger.error(`Internal server error: ${exception.message}`, exception.stack, 'ExceptionFilter');
            this.logger.debug(`Error context: ${JSON.stringify(context)}`, 'ExceptionFilter');
        } else if (status >= 400) {
            // Client errors - log as warning
            this.logger.warn(`Client error: ${exception.message}`, 'ExceptionFilter');
            this.logger.debug(`Error context: ${JSON.stringify(context)}`, 'ExceptionFilter');
        } else {
            // Other exceptions
            this.logger.log(`Exception handled: ${exception.message}`, 'ExceptionFilter');
        }
    }

    private formatDetailMessage(detail: string): string {
        // This regex captures the value inside the parentheses after "userName" and before "="
        const regex = /"userName"\)=\(([^)]+)\)/;

        const match = detail.match(regex);
        if (match && match[1]) {
            return `The username '${match[1]}' is already taken.`;
        }

        return detail;
    }

    private getFieldFromMessage(errorMessage: string): string {
        // Handle whitelist validation errors: "property fieldName should not exist"
        if (errorMessage.includes('should not exist')) {
            const match = errorMessage.match(/property (\w+) should not exist/);
            return match ? match[1] : 'unknown';
        }

        // Handle other validation errors: "fieldName should not be empty"
        return errorMessage.split(' ')[0];
    }

    private makeUserFriendlyMessage(errorMessage: string): string {
        const fieldName = this.getFieldFromMessage(errorMessage);
        const friendlyField = this.getFieldName(fieldName);

        if (errorMessage.includes('should not be empty')) {
            return `${friendlyField} is required`;
        }

        if (errorMessage.includes('must be a string')) {
            return `${friendlyField} must be a string`;
        }

        if (errorMessage.includes('must be an email')) {
            return `Please enter a valid email`;
        }

        if (errorMessage.includes('should not exist')) {
            return `${friendlyField} is not allowed`;
        }

        // Default fallback
        return errorMessage;
    }

    private getFieldName(fieldName: string): string {
        const fieldMappings: { [key: string]: string } = {
            firstName: 'First Name',
            lastName: 'Last Name',
            userName: 'User Name',
            email: 'Email',
            password: 'Password',
        };

        return fieldMappings[fieldName] || fieldName;
    }
}

export { AllExceptionsFilter };
