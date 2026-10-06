import { buttonClassName, Card } from '@emploi/design-system';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { listOffers } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  hasFilters,
  offerListHref,
  parseOfferListQuery,
  toApiQuery,
} from '@/lib/offer-list-query';
import { pageCount } from '@/lib/pagination';
import { CompanyAndLocation } from './company-and-location';
import { OfferFilters } from './offer-filters';
import styles from './offers.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('offers.list');
  return { title: t('title') };
}

export default async function OffersPage({
  searchParams,
}: PageProps<'/offers'>) {
  const query = parseOfferListQuery(await searchParams);
  const { items, total } = await listOffers(toApiQuery(query));
  const pages = pageCount(total, query.size);
  const filtered = hasFilters(query);
  const t = await getTranslations('offers.list');
  const format = await getFormatter();

  return (
    <>
      <div className={styles.heading}>
        <h1>{t('title')}</h1>
        <Link
          href="/offers/new"
          className={buttonClassName({ variant: 'primary' })}
        >
          {t('add')}
        </Link>
      </div>

      <OfferFilters query={query} />

      <p className={styles.meta} role="status">
        {filtered ? t('countFiltered', { total }) : t('count', { total })}
      </p>

      {total === 0 ? (
        <p className={styles.empty}>{filtered ? t('noMatch') : t('empty')}</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          {t('emptyPage')}{' '}
          <Link href={offerListHref(query, { page: 1 })}>{t('firstPage')}</Link>
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((offer) => (
            <Card as="li" key={offer.id}>
              <Link href={`/offers/${offer.id}`} className={styles.cardTitle}>
                {offer.title}
              </Link>
              <CompanyAndLocation offer={offer} />
              <p className={styles.meta}>
                {offer.appliedAt
                  ? t('appliedOn', {
                      date: formatDate(format, offer.appliedAt),
                    })
                  : t('addedOn', {
                      date: formatDateTime(format, offer.createdAt),
                    })}
              </p>
            </Card>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label={t('pagination')} className={styles.pagination}>
          {query.page > 1 ? (
            <Link
              href={offerListHref(query, {
                page: Math.min(query.page, pages + 1) - 1,
              })}
            >
              {t('previous')}
            </Link>
          ) : (
            <span />
          )}
          <span>{t('page', { page: query.page, pages })}</span>
          {query.page < pages ? (
            <Link href={offerListHref(query, { page: query.page + 1 })}>
              {t('next')}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
