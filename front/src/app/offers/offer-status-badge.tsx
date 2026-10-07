import { Badge, type BadgeTone } from '@emploi/design-system';
import type { OfferStatus } from '@emploi/shared';
import { getTranslations } from 'next-intl/server';

/** Colour of each status; the label carries the meaning too (adrs/0022-offer-status.md). */
const STATUS_TONES: Record<OfferStatus, BadgeTone> = {
  applied: 'neutral',
  interviewing: 'info',
  offered: 'success',
  accepted: 'success',
  rejected: 'danger',
  ghosted: 'neutral',
  withdrawn: 'neutral',
};

/** The status of an offer, as a coloured label. */
export async function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const t = await getTranslations('offers.status');
  return <Badge tone={STATUS_TONES[status]}>{t(status)}</Badge>;
}
