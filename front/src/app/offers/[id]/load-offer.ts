import 'server-only';
import { cache } from 'react';
import { getOffer } from '@/lib/api';

/** Deduplicated per request: used by both `generateMetadata` and the page. */
export const loadOffer = cache(getOffer);
