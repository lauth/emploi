import { buttonClassName, Card } from '@emploi/design-system';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { listOffers } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import { pageCount, parsePageParam } from '@/lib/pagination';
import { CompanyAndLocation } from './company-and-location';
import styles from './offers.module.css';

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('offers.list');
  return { title: t('title') };
}

export default async function OffersPage({
  searchParams,
}: PageProps<'/offers'>) {
  const page = parsePageParam((await searchParams).page);
  const { items, total } = await listOffers({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const pages = pageCount(total, PAGE_SIZE);
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

      {total === 0 ? (
        <p className={styles.empty}>{t('empty')}</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          {t('emptyPage')} <Link href="/offers">{t('firstPage')}</Link>
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
          {page > 1 ? (
            <Link href={`/offers?page=${String(page - 1)}`}>
              {t('previous')}
            </Link>
          ) : (
            <span />
          )}
          <span>{t('page', { page, pages })}</span>
          {page < pages ? (
            <Link href={`/offers?page=${String(page + 1)}`}>{t('next')}</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
