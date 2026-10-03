import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  /** Comma-separated list of origins allowed by CORS. */
  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS: string;
}

/** Fails fast at startup when the environment is invalid. */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(validated);
  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n${errors.toString()}`);
  }
  return validated;
}
