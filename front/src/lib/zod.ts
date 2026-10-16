import { z } from 'zod';

// Zod as the front uses it: always import `z` from here (enforced by ESLint).
//
// Without `jitless`, Zod probes `new Function` to compile its schemas. The
// Content-Security-Policy blocks it (no `'unsafe-eval'`) and the browser reports
// a violation even though Zod catches the error (adrs/0029-security-headers.md).
z.config({ jitless: true });

export { z };
