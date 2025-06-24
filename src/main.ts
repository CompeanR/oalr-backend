import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseTransformInterceptor } from './shared/interceptors/response-transform.interceptor';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    
    app.enableCors({
        origin: 'http://localhost:5173',
        credentials: true,
    });
    await app.listen(3000);
}
bootstrap();
