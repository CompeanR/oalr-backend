export interface JwtPayload {
    accessToken: string;
    user: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    };
}
