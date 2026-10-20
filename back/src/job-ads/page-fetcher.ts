import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { request as httpRequest, type IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP, type LookupFunction } from 'node:net';
import { pipeline, type Readable, type Transform } from 'node:stream';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import { Injectable } from '@nestjs/common';

// Fetching the page of a job ad from its link (adrs/0032-fetch-job-ad.md),
// guarded against Server-Side Request Forgery: only public addresses, checked
// when connecting, so a name can't resolve to a public address when checked
// and to a private one when used (DNS rebinding).

/** A page fetched, decoded to text. */
export interface FetchedPage {
  /** After redirects. */
  url: string;
  html: string;
}

/** Why a page couldn't be fetched, in words for the API's `detail`. */
export class PageFetchError extends Error {
  override readonly name = 'PageFetchError';
}

export interface FetchOptions {
  /** Whether an address may be connected to. Tests allow their local server. */
  isAllowed: (address: string, family: number) => boolean;
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
}

/** Loopback, private, link-local, shared, multicast, reserved and documentation ranges. */
const NON_PUBLIC = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  NON_PUBLIC.addSubnet(network, prefix, 'ipv4');
}
// IPv4-mapped IPv6 addresses (`::ffff:127.0.0.1`) are checked against the IPv4
// rules by BlockList itself (tested); a `::ffff:0:0/96` rule here would block
// every IPv4 address.
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  NON_PUBLIC.addSubnet(network, prefix, 'ipv6');
}

/** True for an address on the public internet. */
export function isPublicAddress(address: string, family: number): boolean {
  return !NON_PUBLIC.check(address, family === 6 ? 'ipv6' : 'ipv4');
}

export const DEFAULT_FETCH_OPTIONS: FetchOptions = {
  isAllowed: isPublicAddress,
  timeoutMs: 10_000,
  maxBytes: 5 * 1024 * 1024,
  maxRedirects: 5,
};

/** What a browser sends: some sites refuse requests that don't look like one. */
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
  Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
};

const HTML_TYPES = ['text/html', 'application/xhtml+xml'];

/** Fetches a page, following redirects, within the limits of `options`. */
export async function fetchPage(
  url: string,
  options: FetchOptions = DEFAULT_FETCH_OPTIONS,
): Promise<FetchedPage> {
  const signal = AbortSignal.timeout(options.timeoutMs);
  let current = new URL(url);
  for (let redirects = 0; ; redirects++) {
    const response = await get(current, options, signal);
    const location = response.headers.location;
    const status = response.statusCode ?? 0;
    if (status >= 300 && status < 400 && location !== undefined) {
      response.resume();
      if (redirects >= options.maxRedirects) {
        throw new PageFetchError(
          `more than ${String(options.maxRedirects)} redirects`,
        );
      }
      current = new URL(location, current);
      continue;
    }
    if (status < 200 || status >= 300) {
      response.resume();
      throw new PageFetchError(`the site answered HTTP ${String(status)}`);
    }
    return { url: current.href, html: await readHtml(response, options) };
  }
}

/** One request, to an allowed address only. */
function get(
  url: URL,
  options: FetchOptions,
  signal: AbortSignal,
): Promise<IncomingMessage> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return Promise.reject(
      new PageFetchError(`${url.protocol} links are not supported`),
    );
  }
  // An IP address in the URL is connected to without a lookup: check it here.
  const literal = url.hostname.replace(/^\[(.*)\]$/, '$1');
  const family = isIP(literal);
  if (family !== 0 && !options.isAllowed(literal, family)) {
    return Promise.reject(blockedAddress(url.hostname));
  }

  const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const outgoing = request(url, {
      headers: HEADERS,
      lookup: guardedLookup(options.isAllowed),
      signal,
    });
    outgoing.on('response', resolve);
    outgoing.on('error', (error) => {
      reject(describe(error, options));
    });
    outgoing.end();
  });
}

/** A DNS lookup that refuses names resolving to an address not allowed. */
function guardedLookup(isAllowed: FetchOptions['isAllowed']): LookupFunction {
  return (hostname, lookupOptions, callback) => {
    dnsLookup(hostname, { ...lookupOptions, all: true }, (error, found) => {
      if (error) {
        callback(error, '', 0);
        return;
      }
      const addresses = found;
      const first = addresses[0];
      if (
        first === undefined ||
        addresses.some(({ address, family }) => !isAllowed(address, family))
      ) {
        callback(blockedAddress(hostname), '', 0);
        return;
      }
      if (lookupOptions.all) {
        (callback as (error: null, addresses: LookupAddress[]) => void)(
          null,
          addresses,
        );
      } else {
        callback(null, first.address, first.family);
      }
    });
  };
}

function blockedAddress(hostname: string): PageFetchError {
  return new PageFetchError(
    `${hostname} is a private or local address, which is never fetched`,
  );
}

/** The body as text: decompressed, limited in size, decoded with its charset. */
async function readHtml(
  response: IncomingMessage,
  options: FetchOptions,
): Promise<string> {
  const contentType = response.headers['content-type'] ?? '';
  const mediaType = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!HTML_TYPES.includes(mediaType)) {
    response.resume();
    throw new PageFetchError(
      `it is not an HTML page (${mediaType || 'no content type'})`,
    );
  }
  if (Number(response.headers['content-length']) > options.maxBytes) {
    response.destroy();
    throw tooLarge(options);
  }

  const body = decompressed(response);
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of body) {
      const bytes = chunk as Buffer;
      size += bytes.length;
      if (size > options.maxBytes) {
        throw tooLarge(options);
      }
      chunks.push(bytes);
    }
  } catch (error) {
    response.destroy();
    throw describe(error, options);
  }
  return decode(Buffer.concat(chunks, size), contentType);
}

function decompressed(response: IncomingMessage): Readable {
  const decoders: Record<string, () => Transform> = {
    gzip: createGunzip,
    'x-gzip': createGunzip,
    deflate: createInflate,
    br: createBrotliDecompress,
  };
  const encoding = response.headers['content-encoding']?.trim().toLowerCase();
  const decoder = encoding === undefined ? undefined : decoders[encoding];
  if (decoder === undefined) {
    return response;
  }
  // Errors of either stream end the loop that reads the result.
  return pipeline(response, decoder(), () => undefined);
}

function tooLarge(options: FetchOptions): PageFetchError {
  return new PageFetchError(
    `the page is bigger than ${String(options.maxBytes / 1024 / 1024)} MB`,
  );
}

/** Text from bytes, with the charset of the header or of a `<meta>`, UTF-8 otherwise. */
function decode(bytes: Buffer, contentType: string): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType)?.[1];
  const head = bytes.subarray(0, 2048).toString('latin1');
  const fromMeta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1];
  for (const label of [fromHeader, fromMeta, 'utf-8']) {
    if (label === undefined) {
      continue;
    }
    try {
      return new TextDecoder(label).decode(bytes);
    } catch {
      // Unknown charset label: try the next one.
    }
  }
  return bytes.toString('utf8');
}

/** Network errors in words, for the API's `detail`. */
function describe(error: unknown, options: FetchOptions): Error {
  if (error instanceof PageFetchError) {
    return error;
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new PageFetchError(
      `it took more than ${String(options.timeoutMs / 1000)} s`,
    );
  }
  if (error instanceof Error && error.name === 'AbortError') {
    const cause = (error as Error & { cause?: unknown }).cause;
    return cause instanceof Error && cause.name === 'TimeoutError'
      ? describe(cause, options)
      : new PageFetchError('the request was aborted');
  }
  const code =
    error instanceof Error && 'code' in error ? String(error.code) : undefined;
  const reasons: Record<string, string> = {
    ENOTFOUND: 'its domain name does not exist',
    EAI_AGAIN: 'its domain name could not be resolved',
    ECONNREFUSED: 'the site refused the connection',
    ECONNRESET: 'the site closed the connection',
    CERT_HAS_EXPIRED: 'the site’s certificate has expired',
  };
  return new PageFetchError(
    (code && reasons[code]) ?? `the request failed${code ? ` (${code})` : ''}`,
  );
}

/** The fetcher used by the API; replaced in tests. */
@Injectable()
export class PageFetcher {
  fetch(url: string): Promise<FetchedPage> {
    return fetchPage(url);
  }
}
