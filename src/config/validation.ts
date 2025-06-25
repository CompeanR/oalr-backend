import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables } from './configuration';

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        const errorMessages = errors.map((error) => Object.values(error.constraints || {}).join(', ')).join('; ');

        throw new Error(`Configuration validation failed: ${errorMessages}`);
    }

    return validatedConfig;
}
