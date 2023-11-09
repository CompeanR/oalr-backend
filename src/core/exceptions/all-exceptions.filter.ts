import { Catch, ExceptionFilter, HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DatabaseErrorCodes } from './utils/errorCodes';

/**
 * Catches any unhandled exceptions and sends an appropriate response to the client.
 */
@Catch()
class AllExceptionsFilter implements ExceptionFilter {
    public catch(exception: unknown, host: ArgumentsHost) {
        const { response, request } = this.getContext(host);

        const status = this.getStatus(exception);
        const message = this.getMessage(exception);

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });
    }

    /**
     * Returns an object containing the response and request objects from the provided ArgumentsHost object.
     *
     * @param host - The ArgumentsHost object to extract the response and request objects from.
     * @returns An object containing the response and request objects.
     */
    private getContext(host: ArgumentsHost): { response: any; request: any } {
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
    private getStatus(exception: unknown): number {
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
    private getMessage(exception: unknown): string | object {
        if (exception instanceof QueryFailedError) {
            switch ((exception as any).code) {
                case DatabaseErrorCodes.DUPLICATE_ENTRY:
                    return {
                        status: 'error',
                        message: this.formatDetailMessage((exception as any).detail),
                        detail: 'Repeated value',
                    };
            }
        }

        if (exception instanceof HttpException) {
            return exception.getResponse();
        }

        return 'Internal server error';
    }

    /**
     * Formats the detail message of an exception by extracting the username from the message
     *
     * @param detail The detail message of the exception.
     * @returns A formatted error message with the username if found, otherwise the original detail message.
     */
    private formatDetailMessage(detail: string): string {
        const regex = /\(username\)=\((.*?)\)/; // This regex captures the value between the parentheses after "username="
        const match = detail.match(regex);

        if (match && match[1]) {
            return `The username '${match[1]}' is already taken.`;
        }

        return detail;
    }
}

export { AllExceptionsFilter };
