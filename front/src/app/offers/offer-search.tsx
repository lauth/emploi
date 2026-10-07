import { Button, buttonClassName, TextField } from '@emploi/design-system';
import Form from 'next/form';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { formatDate } from '@/lib/format';
import {
  hasFilters,
  keptFields,
  offerListHref,
  type OfferListQuery,
} from '@/lib/offer-list-query';
import styles from './offers.module.css';

/**
 * Compact search bar above the offer list: one field and its button, the
 * period and status filters in use (removable), and a reset link when the
 * list is filtered. A GET form (next/form): the state stays in the URL.
 */
export async function OfferSearch({ query }: { query: OfferListQuery }) {
  const t = await getTranslations('offers.list');
  const format = await getFormatter();
  const period = periodText(query, (date) => formatDate(format, date), t);
  const tStatus = await getTranslations('offers.status');
  const statuses =
    query.status.length > 0
      ? format.list(query.status.map((status) => tStatus(status)))
      : null;

  return (
    <search aria-label={t('search.region')} className={styles.toolbar}>
      <Form action="/offers" className={styles.searchForm}>
        {keptFields(query, ['q']).map(([name, value]) => (
          <input
            key={`${name}=${value}`}
            type="hidden"
            name={name}
            value={value}
          />
        ))}
        <TextField
          id="q"
          name="q"
          type="search"
          label={t('search.label')}
          labelHidden
          placeholder={t('search.placeholder')}
          maxLength={200}
          defaultValue={query.q}
          className={styles.searchField}
        />
        <Button type="submit">{t('search.submit')}</Button>
      </Form>

      {period && (
        <Link
          href={offerListHref(query, {
            appliedFrom: '',
            appliedTo: '',
            page: 1,
          })}
          className={buttonClassName({ size: 'sm' })}
          aria-label={t('period.remove', { period })}
        >
          {period}
          <span aria-hidden="true">×</span>
        </Link>
      )}

      {statuses && (
        <Link
          href={offerListHref(query, { status: [], page: 1 })}
          className={buttonClassName({ size: 'sm' })}
          aria-label={t('statusFilter.remove', { statuses })}
        >
          {t('statusFilter.chip', { count: query.status.length, statuses })}
          <span aria-hidden="true">×</span>
        </Link>
      )}

      {hasFilters(query) && (
        <Link
          href={offerListHref(query, {
            q: '',
            appliedFrom: '',
            appliedTo: '',
            status: [],
            page: 1,
          })}
          className={styles.reset}
        >
          {t('search.reset')}
        </Link>
      )}
    </search>
  );
}

type Translate = Awaited<ReturnType<typeof getTranslations<'offers.list'>>>;

/** "Candidature du 1 sept. 2026 au 30 sept. 2026", or `null` without a period. */
function periodText(
  query: OfferListQuery,
  formatDay: (date: string) => string,
  t: Translate,
): string | null {
  const { appliedFrom, appliedTo } = query;
  if (appliedFrom && appliedTo) {
    return t('period.both', {
      from: formatDay(appliedFrom),
      to: formatDay(appliedTo),
    });
  }
  if (appliedFrom) {
    return t('period.fromOnly', { from: formatDay(appliedFrom) });
  }
  if (appliedTo) {
    return t('period.toOnly', { to: formatDay(appliedTo) });
  }
  return null;
}
