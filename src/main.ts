import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseTransformInterceptor } from './shared/interceptors/response-transform.interceptor';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Global validation pipe with security options
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip unknown properties
            forbidNonWhitelisted: true, // Reject requests with unknown properties
            transform: true, // Transform payloads to DTO instances
            transformOptions: {
                enableImplicitConversion: true,
            },
            disableErrorMessages: configService.get('nodeEnv') === 'production', // Hide validation details in production
        }),
    );

    app.useGlobalInterceptors(new ResponseTransformInterceptor());

    // Enhanced CORS configuration
    app.enableCors({
        origin: configService.get('frontend.url'),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-request-id', 'X-Request-ID'],
        exposedHeaders: ['X-Total-Count'],
        maxAge: 86400, // Cache preflight for 24 hours
    });

    // Disable X-Powered-By header
    app.getHttpAdapter().getInstance().disable('x-powered-by');

    // Swagger/OpenAPI configuration
    if (configService.get('nodeEnv') !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('OALR API')
            .setDescription('OALR Platform API Documentation')
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth',
            )
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });
    }

    const port = configService.get('port') || 3000;
    await app.listen(port);
}
bootstrap();
