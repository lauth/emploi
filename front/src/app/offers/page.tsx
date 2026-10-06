import { buttonClassName } from '@emploi/design-system';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { listOffers } from '@/lib/api';
import {
  hasFilters,
  offerListHref,
  PAGE_SIZES,
  parseOfferListQuery,
  toApiQuery,
} from '@/lib/offer-list-query';
import { pageCount } from '@/lib/pagination';
import { OfferSearch } from './offer-search';
import { OfferTable } from './offer-table';
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

  return (
    <>
      <div className={styles.listHeading}>
        <h1>{t('title')}</h1>
        <OfferSearch query={query} />
        <Link
          href="/offers/new"
          className={buttonClassName({ variant: 'primary' })}
        >
          {t('add')}
        </Link>
      </div>

      {total === 0 ? (
        <p className={styles.empty}>{filtered ? t('noMatch') : t('empty')}</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          {t('emptyPage')}{' '}
          <Link href={offerListHref(query, { page: 1 })}>{t('firstPage')}</Link>
        </p>
      ) : (
        <OfferTable query={query} offers={items} />
      )}

      <div className={styles.listFooter}>
        <p className={styles.meta} role="status">
          {filtered ? t('countFiltered', { total }) : t('count', { total })}
        </p>

        {pages > 1 && (
          <nav aria-label={t('pagination')} className={styles.pagination}>
            {query.page > 1 && (
              <Link
                href={offerListHref(query, {
                  page: Math.min(query.page, pages + 1) - 1,
                })}
              >
                {t('previous')}
              </Link>
            )}
            <span>{t('page', { page: query.page, pages })}</span>
            {query.page < pages && (
              <Link href={offerListHref(query, { page: query.page + 1 })}>
                {t('next')}
              </Link>
            )}
          </nav>
        )}

        <nav aria-label={t('size.nav')} className={styles.sizes}>
          <span aria-hidden="true">{t('size.label')}</span>
          {PAGE_SIZES.map((size) => (
            <Link
              key={size}
              href={offerListHref(query, { size, page: 1 })}
              aria-label={t('size.option', { size })}
              aria-current={size === query.size ? 'true' : undefined}
            >
              {size}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
