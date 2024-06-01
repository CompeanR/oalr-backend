// oauth-user.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OAuthUserDto } from 'src/modules/user/dto/oauth-user-dto';
import { validate } from 'class-validator';

@Injectable()
class OAuthUserInterceptor implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();
        const user = req.user;

        const oauthUserDto = new OAuthUserDto();
        Object.assign(oauthUserDto, user);

        const errors = await validate(oauthUserDto);
        if (errors.length > 0) {
            throw new BadRequestException('Validation failed', errors.toString());
        }

        req.user = oauthUserDto;
        return next.handle().pipe(map((data) => data));
    }
}

export { OAuthUserInterceptor };
