import type { IncomingMessage } from 'node:http';
import { imageTooLarge } from '../problems/problem.exception.js';

/**
 * The raw request body, read up to `maxBytes`: `image-too-large` as soon as it
 * is longer (or says it will be), without buffering the rest. Bodies Express
 * already parsed (JSON) come back empty.
 */
export async function readBody(
  request: IncomingMessage,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers['content-length']);
  if (declared > maxBytes) {
    throw imageTooLarge(maxBytes);
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = chunk as Buffer;
    size += bytes.length;
    if (size > maxBytes) {
      throw imageTooLarge(maxBytes);
    }
    chunks.push(bytes);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return body;
}
