/**
 * Exception thrown when there is an error creating a token.
 */
export class TokenCreationException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TokenCreationException';
    }
}

/**
 * Represents an exception that occurs during user creation.
 */
export class UserCreationException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UserCreationException';
    }
}
