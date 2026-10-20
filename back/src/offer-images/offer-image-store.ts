import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { access, mkdir, open, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/env.validation.js';

/** Offer ids are UUIDs: a file name never leaves the directory. */
const OFFER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** An image written next to its final name, not visible until committed. */
export interface StagedImage {
  /** Puts the image in place, replacing the previous one in one step. */
  commit(): Promise<void>;
  /** Drops the staged file. */
  discard(): Promise<void>;
}

/**
 * The bytes of offer images, one file per offer named after its id, in
 * IMAGES_DIR: a persistent volume in the cluster (adrs/0031-offer-image.md).
 * The database only describes them.
 */
@Injectable()
export class OfferImageStore implements OnModuleInit {
  private readonly directory: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.directory = config.get('IMAGES_DIR', { infer: true });
  }

  /** Fails at startup, not at the first upload, when the volume isn't writable. */
  async onModuleInit(): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    await access(this.directory, constants.W_OK);
  }

  /** Writes the bytes under a temporary name; `commit` renames them (atomic). */
  async stage(offerId: string, data: Uint8Array): Promise<StagedImage> {
    const target = this.path(offerId);
    const staged = `${target}.${randomUUID()}.tmp`;
    await writeFile(staged, data, { flag: 'wx' });
    return {
      commit: () => rename(staged, target),
      discard: () => rm(staged, { force: true }),
    };
  }

  /** The image's bytes, `null` when the file is missing. */
  async read(offerId: string): Promise<Readable | null> {
    try {
      const file = await open(this.path(offerId));
      return file.createReadStream();
    } catch (error) {
      if (isMissing(error)) {
        return null;
      }
      throw error;
    }
  }

  /** Removes the image's file; a missing one is fine. */
  async remove(offerId: string): Promise<void> {
    await rm(this.path(offerId), { force: true });
  }

  private path(offerId: string): string {
    if (!OFFER_ID.test(offerId)) {
      throw new Error(`Not an offer id: ${offerId}`);
    }
    return join(this.directory, offerId.toLowerCase());
  }
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
