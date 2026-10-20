import { createServer, type RequestListener, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { gzipSync } from 'node:zlib';
import {
  DEFAULT_FETCH_OPTIONS,
  fetchPage,
  isPublicAddress,
  PageFetchError,
  type FetchOptions,
} from './page-fetcher.js';

describe('isPublicAddress', () => {
  it.each([
    ['93.184.215.14', 4],
    ['8.8.8.8', 4],
    ['2606:4700:4700::1111', 6],
  ])('accepts the public address %s', (address, family) => {
    expect(isPublicAddress(address, family)).toBe(true);
  });

  it.each([
    ['127.0.0.1', 4, 'loopback'],
    ['10.43.0.10', 4, 'private (cluster services)'],
    ['172.18.0.2', 4, 'private (Docker networks)'],
    ['192.168.1.140', 4, 'private (local network)'],
    ['169.254.169.254', 4, 'link-local (cloud metadata)'],
    ['100.64.0.1', 4, 'carrier-grade NAT'],
    ['0.0.0.0', 4, 'unspecified'],
    ['224.0.0.1', 4, 'multicast'],
    ['::1', 6, 'IPv6 loopback'],
    ['::', 6, 'IPv6 unspecified'],
    ['fd12:3456::1', 6, 'IPv6 unique local'],
    ['fe80::1', 6, 'IPv6 link-local'],
    ['::ffff:127.0.0.1', 6, 'IPv4-mapped loopback'],
  ])('refuses %s (%s)', (address, family) => {
    expect(isPublicAddress(address, family)).toBe(false);
  });
});

describe('fetchPage', () => {
  let server: Server;
  let base: string;
  let handler: RequestListener;

  beforeAll(async () => {
    server = createServer((request, response) => {
      handler(request, response);
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    base = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  /** The test server is local: allow it, keep the other limits small. */
  const local: FetchOptions = {
    isAllowed: () => true,
    timeoutMs: 1000,
    maxBytes: 1024,
    maxRedirects: 2,
  };

  function serve(listener: RequestListener) {
    handler = listener;
  }

  function html(body: string, type = 'text/html; charset=utf-8') {
    serve((_request, response) => {
      response.writeHead(200, { 'Content-Type': type });
      response.end(body);
    });
  }

  it('fetches a page like a browser does', async () => {
    let headers: Record<string, unknown> = {};
    serve((request, response) => {
      headers = request.headers;
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end('<p>Développeuse</p>');
    });

    await expect(fetchPage(`${base}/ad`, local)).resolves.toEqual({
      url: `${base}/ad`,
      html: '<p>Développeuse</p>',
    });
    expect(headers).toMatchObject({
      'user-agent': expect.stringContaining('Mozilla') as unknown,
      'accept-language': expect.stringContaining('fr') as unknown,
    });
  });

  it.each([
    ['the header', 'text/html; charset=iso-8859-1', ''],
    ['a meta element', 'text/html', '<meta charset="iso-8859-1">'],
  ])('decodes the charset given by %s', async (_source, type, meta) => {
    serve((_request, response) => {
      response.writeHead(200, { 'Content-Type': type });
      response.end(
        Buffer.concat([
          Buffer.from(meta),
          Buffer.from('Développeur', 'latin1'),
        ]),
      );
    });

    const page = await fetchPage(base, local);

    expect(page.html).toBe(`${meta}Développeur`);
  });

  it('decompresses gzip', async () => {
    serve((_request, response) => {
      response.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Encoding': 'gzip',
      });
      response.end(gzipSync('<h1>Offre</h1>'));
    });

    await expect(fetchPage(base, local)).resolves.toMatchObject({
      html: '<h1>Offre</h1>',
    });
  });

  it('follows redirects, up to the limit', async () => {
    serve((request, response) => {
      const step = Number(request.url?.slice(1) ?? '0');
      if (step < 2) {
        response.writeHead(302, { Location: `/${String(step + 1)}` });
        response.end();
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end('arrivée');
    });

    await expect(fetchPage(`${base}/0`, local)).resolves.toEqual({
      url: `${base}/2`,
      html: 'arrivée',
    });
    await expect(
      fetchPage(`${base}/0`, { ...local, maxRedirects: 1 }),
    ).rejects.toThrow('more than 1 redirects');
  });

  it.each<[string, RequestListener, string]>([
    [
      'an HTTP error',
      (_request, response) => {
        response.writeHead(403);
        response.end();
      },
      'the site answered HTTP 403',
    ],
    [
      'a page that is not HTML',
      (_request, response) => {
        response.writeHead(200, { 'Content-Type': 'application/pdf' });
        response.end('%PDF');
      },
      'it is not an HTML page (application/pdf)',
    ],
    [
      'a page announced too large',
      (_request, response) => {
        response.writeHead(200, {
          'Content-Type': 'text/html',
          'Content-Length': '2048',
        });
        response.end('x'.repeat(2048));
      },
      'bigger than',
    ],
    [
      'a page streamed too large',
      (_request, response) => {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write('x'.repeat(800));
        response.end('x'.repeat(800));
      },
      'bigger than',
    ],
    [
      'a site too slow',
      () => {
        // Never answers.
      },
      'it took more than 1 s',
    ],
  ])('refuses %s', async (_case, listener, reason) => {
    serve(listener);

    const failure = fetchPage(base, local);

    await expect(failure).rejects.toBeInstanceOf(PageFetchError);
    await expect(failure).rejects.toThrow(reason);
  });

  it('refuses links that are not http or https', async () => {
    await expect(fetchPage('file:///etc/passwd', local)).rejects.toThrow(
      'file: links are not supported',
    );
  });

  describe('with the default options (Server-Side Request Forgery)', () => {
    beforeEach(() => {
      html('<p>secret</p>');
    });

    it.each(['127.0.0.1', '[::1]', 'localhost'])(
      'never connects to %s',
      async (host) => {
        const port = (server.address() as AddressInfo).port;

        await expect(
          fetchPage(`http://${host}:${String(port)}/`, DEFAULT_FETCH_OPTIONS),
        ).rejects.toThrow('is a private or local address');
      },
    );

    it('checks the address a redirect leads to', async () => {
      // A public page redirecting to the local server is refused at the
      // redirect: simulated by allowing only the first address.
      let calls = 0;
      serve((_request, response) => {
        response.writeHead(302, { Location: 'http://localhost/' });
        response.end();
      });

      await expect(
        fetchPage(base, {
          ...local,
          isAllowed: (address) => address === '127.0.0.1' && calls++ === 0,
        }),
      ).rejects.toThrow('localhost is a private or local address');
    });
  });
});
