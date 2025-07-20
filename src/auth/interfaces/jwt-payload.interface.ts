export interface JwtPayload {
    accessToken: string;
    user: {
        userId: number;
        email: string;
        firstName: string;
        lastName: string;
    };
}
