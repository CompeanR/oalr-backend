import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, BadRequestException, ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from '../all-exceptions.filter';
import { AppLoggerService } from 'src/shared/services/logger.service';
import { DatabaseErrorCodes } from '../utils/errorCodes';

describe('AllExceptionsFilter', () => {
    let filter: AllExceptionsFilter;
    let mockLogger: jest.Mocked<AppLoggerService>;
    let mockHost: jest.Mocked<ArgumentsHost>;
    let mockResponse: any;
    let mockRequest: any;

    beforeEach(async () => {
        mockLogger = {
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn(),
            debug: jest.fn(),
        } as any;

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        mockRequest = {
            url: '/test-endpoint',
            method: 'POST',
            get: jest.fn().mockReturnValue('test-agent'),
            ip: '127.0.0.1',
        };

        mockHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getResponse: () => mockResponse,
                getRequest: () => mockRequest,
            }),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AllExceptionsFilter,
                {
                    provide: AppLoggerService,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
        jest.clearAllMocks();
    });

    describe('HTTP exceptions', () => {
        it('should handle standard HTTP exceptions correctly', () => {
            const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

            filter.catch(exception as any, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 404,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: 'Not found',
            });
        });

        it('should handle internal server errors', () => {
            const exception = new Error('Database connection failed');

            filter.catch(exception as any, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 500,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: 'Database connection failed',
            });
        });
    });

    describe('validation errors', () => {
        it('should format BadRequestException with validation errors', () => {
            const validationErrors = ['firstName should not be empty', 'email must be an email'];
            const exception = new BadRequestException({
                message: validationErrors,
                statusCode: 400,
            });

            filter.catch(exception as any, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 400,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: {
                    status: 'validation_error',
                    message: 'Please check the following fields:',
                    errors: [
                        { field: 'firstName', message: 'First Name is required' },
                        { field: 'email', message: 'Please enter a valid email' },
                    ],
                },
            });
        });

        it('should handle single BadRequestException messages', () => {
            const exception = new BadRequestException('Invalid input');

            filter.catch(exception as any, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 400,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: {
                    message: 'Invalid input',
                    error: 'Bad Request',
                    statusCode: 400,
                },
            });
        });
    });

    describe('database errors', () => {
        it('should handle duplicate entry database errors', () => {
            const exception = new QueryFailedError(
                'INSERT query',
                [],
                {
                    code: DatabaseErrorCodes.DUPLICATE_ENTRY,
                    detail: 'Key ("userName")=(testuser) already exists.',
                } as any
            );

            filter.catch(exception as any, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 500,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: {
                    status: 'error',
                    message: "The username 'testuser' is already taken.",
                    detail: 'Repeated value',
                },
            });
        });

        it('should handle other database errors', () => {
            const exception = new QueryFailedError(
                'SELECT query',
                [],
                { code: '42P01', detail: 'Table does not exist' } as any
            );

            filter.catch(exception as any, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('logging behavior', () => {
        it('should log server errors as error level', () => {
            const exception = new HttpException('Internal error', HttpStatus.INTERNAL_SERVER_ERROR);

            filter.catch(exception as any, mockHost);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Internal server error: Internal error',
                expect.any(String),
                'ExceptionFilter'
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(
                expect.stringContaining('Error context:'),
                'ExceptionFilter'
            );
        });

        it('should log client errors as warning level', () => {
            const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

            filter.catch(exception as any, mockHost);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Client error: Bad request',
                'ExceptionFilter'
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(
                expect.stringContaining('Error context:'),
                'ExceptionFilter'
            );
        });

        it('should log other exceptions as info level', () => {
            const exception = new HttpException('Redirect', HttpStatus.MOVED_PERMANENTLY);

            filter.catch(exception as any, mockHost);

            expect(mockLogger.log).toHaveBeenCalledWith(
                'Exception handled: Redirect',
                'ExceptionFilter'
            );
        });
    });

    describe('message formatting', () => {
        it('should create user-friendly field validation messages', () => {
            const validationErrors = [
                'firstName should not be empty',
                'lastName must be a string',
                'property password should not exist',
            ];
            const exception = new BadRequestException({ message: validationErrors });

            filter.catch(exception as any, mockHost);

            const responseCall = mockResponse.json.mock.calls[0][0];
            const errors = responseCall.message.errors;

            expect(errors).toEqual([
                { field: 'firstName', message: 'First Name is required' },
                { field: 'lastName', message: 'Last Name must be a string' },
                { field: 'password', message: 'Password is not allowed' },
            ]);
        });

        it('should handle unknown validation error patterns', () => {
            const validationErrors = ['customField has unknown error'];
            const exception = new BadRequestException({ message: validationErrors });

            filter.catch(exception as any, mockHost);

            const responseCall = mockResponse.json.mock.calls[0][0];
            const errors = responseCall.message.errors;

            expect(errors[0]).toEqual({
                field: 'customField',
                message: 'customField has unknown error',
            });
        });
    });

    describe('edge cases', () => {
        it('should handle exceptions without message property', () => {
            const exception = { code: 'UNKNOWN_ERROR' };

            filter.catch(exception as any, mockHost);

            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 500,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: 'Internal server error',
            });
        });

        it('should handle malformed database detail messages', () => {
            const exception = new QueryFailedError(
                'INSERT query',
                [],
                {
                    code: DatabaseErrorCodes.DUPLICATE_ENTRY,
                    detail: 'Malformed detail message',
                } as any
            );

            filter.catch(exception as any, mockHost);

            const responseCall = mockResponse.json.mock.calls[0][0];
            expect(responseCall.message.message).toBe('Malformed detail message');
        });
    });
});