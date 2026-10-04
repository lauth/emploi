import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  const valid = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
    CORS_ORIGINS: 'https://emploi.localhost',
  };

  it('accepts a valid environment and applies defaults', () => {
    const env = validateEnv(valid);

    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.PORT).toBe(3000);
    expect(env.API_DOCS_ENABLED).toBe(true);
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('reads API_DOCS_ENABLED=%s', (value, expected) => {
    expect(
      validateEnv({ ...valid, API_DOCS_ENABLED: value }).API_DOCS_ENABLED,
    ).toBe(expected);
  });

  it('rejects an API_DOCS_ENABLED that is not a boolean', () => {
    expect(() => validateEnv({ ...valid, API_DOCS_ENABLED: 'yes' })).toThrow(
      /API_DOCS_ENABLED/,
    );
  });

  it('converts PORT to a number', () => {
    expect(validateEnv({ ...valid, PORT: '4000' }).PORT).toBe(4000);
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({ CORS_ORIGINS: valid.CORS_ORIGINS })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejects an out-of-range PORT', () => {
    expect(() => validateEnv({ ...valid, PORT: '70000' })).toThrow(/PORT/);
  });
});
