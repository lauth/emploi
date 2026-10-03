import type { Metadata } from 'next';
import Link from 'next/link';
import { listOffers } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import { pageCount, parsePageParam } from '@/lib/pagination';
import styles from './offers.module.css';

const PAGE_SIZE = 20;

export const metadata: Metadata = { title: 'Offers · emploi' };

export default async function OffersPage({
  searchParams,
}: PageProps<'/offers'>) {
  const page = parsePageParam((await searchParams).page);
  const { items, total } = await listOffers({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const pages = pageCount(total, PAGE_SIZE);

  return (
    <>
      <div className={styles.heading}>
        <h1>Offers</h1>
        <Link href="/offers/new" className={styles.primary}>
          Add an offer
        </Link>
      </div>

      {total === 0 ? (
        <p className={styles.empty}>
          No offer yet. Add the first job offer you responded to.
        </p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          No offer on this page.{' '}
          <Link href="/offers">Back to the first page</Link>
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((offer) => (
            <li key={offer.id} className={styles.card}>
              <Link href={`/offers/${offer.id}`} className={styles.cardTitle}>
                {offer.title}
              </Link>
              <p className={styles.meta}>
                {offer.company}
                {offer.location && ` · ${offer.location}`}
              </p>
              <p className={styles.meta}>
                {offer.appliedAt
                  ? `Applied on ${formatDate(offer.appliedAt)}`
                  : `Added on ${formatDateTime(offer.createdAt)}`}
              </p>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className={styles.pagination}>
          {page > 1 ? (
            <Link href={`/offers?page=${String(page - 1)}`}>Previous</Link>
          ) : (
            <span />
          )}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`/offers?page=${String(page + 1)}`}>Next</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
