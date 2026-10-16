import { contentSecurityPolicy } from './security-headers';

function directives(policy: string): Map<string, string> {
  return new Map(
    policy.split('; ').map((directive) => {
      const [name = '', ...values] = directive.split(' ');
      return [name, values.join(' ')];
    }),
  );
}

describe('contentSecurityPolicy', () => {
  it('only allows scripts and style elements carrying the nonce in production', () => {
    const policy = directives(
      contentSecurityPolicy('abc123', { development: false }),
    );

    expect(policy.get('script-src')).toBe(
      "'self' 'nonce-abc123' 'strict-dynamic'",
    );
    expect(policy.get('style-src')).toBe("'self' 'nonce-abc123'");
    expect(policy.get('frame-ancestors')).toBe("'none'");
    expect(policy.get('object-src')).toBe("'none'");
    expect(policy.get('form-action')).toBe("'self'");
  });

  it('allows what the dev server needs in development', () => {
    const policy = directives(
      contentSecurityPolicy('abc123', { development: true }),
    );

    expect(policy.get('script-src')).toContain("'unsafe-eval'");
    expect(policy.get('style-src')).toBe("'self' 'unsafe-inline'");
  });

  it('never allows inline scripts', () => {
    for (const development of [false, true]) {
      expect(
        directives(contentSecurityPolicy('n', { development })).get(
          'script-src',
        ),
      ).not.toContain("'unsafe-inline'");
    }
  });
});
