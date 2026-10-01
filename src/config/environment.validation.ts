import { plainToInstance, Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min, validateSync } from 'class-validator';

const environments = ['development', 'test', 'production'] as const;

class EnvironmentVariables {
  @IsIn(environments)
  NODE_ENV = 'development';

  @IsString()
  @IsNotEmpty()
  HOST = '0.0.0.0';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 5000;
}

export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return { ...config, ...validated };
}
