import { readConfig } from './config.ts';

describe('readConfig', () => {
  it('defaults to the local cluster API', () => {
    expect(readConfig({})).toEqual({ apiUrl: 'https://api.emploi.localhost' });
  });

  it('reads MCP_API_URL without its trailing slash', () => {
    expect(readConfig({ MCP_API_URL: 'http://localhost:3000/' })).toEqual({
      apiUrl: 'http://localhost:3000',
    });
  });

  it('rejects a URL that is not http(s)', () => {
    expect(() => readConfig({ MCP_API_URL: 'ftp://example.com' })).toThrow(
      /MCP_API_URL/,
    );
  });
});
