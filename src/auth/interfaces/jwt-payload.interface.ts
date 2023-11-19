export interface JwtPayload {
    accessToken: string;
    user: {
        userId: number;
        email: string;
        userName: string;
        firstName: string;
        lastName: string;
    };
}
