export class JwtUserDto {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
}

export class JwtPayloadDto {
    accessToken: string;
    user: JwtUserDto;
}

