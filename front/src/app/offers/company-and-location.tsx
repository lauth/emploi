import type { Offer } from '@emploi/shared';
import { formatCompanyAndLocation } from '@/lib/format';
import styles from './offers.module.css';

/** "Acme · Lyon" under an offer title; nothing when both are unknown. */
export function CompanyAndLocation({
  offer,
}: {
  offer: Pick<Offer, 'company' | 'location'>;
}) {
  const text = formatCompanyAndLocation(offer);
  return text === null ? null : <p className={styles.meta}>{text}</p>;
}
