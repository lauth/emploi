import {
  Button,
  headerCellClassName,
  Popover,
  popoverCloseProps,
  sortableHeaderClassName,
  Table,
  TextField,
} from '@emploi/design-system';
import type { Offer, OfferSortField } from '@emploi/shared';
import Form from 'next/form';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { formatDate, formatDay } from '@/lib/format';
import {
  keptFields,
  nextSort,
  offerListHref,
  sortState,
  type OfferListQuery,
} from '@/lib/offer-list-query';
import styles from './offers.module.css';

const PERIOD_POPOVER = 'applied-period';

/**
 * The offers as a table. Sortable column headers are links to the list sorted
 * by that column (clicking again reverses it); the application date header
 * also opens the period filter.
 */
export async function OfferTable({
  query,
  offers,
}: {
  query: OfferListQuery;
  offers: Offer[];
}) {
  const t = await getTranslations('offers.list');
  const format = await getFormatter();
  const periodActive = Boolean(query.appliedFrom || query.appliedTo);

  const sortLink = (field: OfferSortField) => (
    <Link
      href={offerListHref(query, { sort: nextSort(query, field), page: 1 })}
      className={sortableHeaderClassName}
    >
      {t(`columns.${field}`)}
    </Link>
  );

  return (
    <Table caption={t('caption', { sort: t(`sortOptions.${query.sort}`) })}>
      <thead>
        <tr>
          <th scope="col" aria-sort={sortState(query, 'title')}>
            {sortLink('title')}
          </th>
          <th scope="col" aria-sort={sortState(query, 'company')}>
            {sortLink('company')}
          </th>
          <th scope="col">{t('columns.location')}</th>
          <th scope="col" aria-sort={sortState(query, 'appliedAt')}>
            <div className={headerCellClassName}>
              {sortLink('appliedAt')}
              <Popover
                id={PERIOD_POPOVER}
                label={t('period.trigger')}
                triggerLabel={
                  periodActive
                    ? t('period.triggerLabelActive')
                    : t('period.triggerLabel')
                }
                active={periodActive}
              >
                <Form action="/offers" className={styles.periodForm}>
                  <p className={styles.periodHeading}>{t('period.heading')}</p>
                  {keptFields(query, ['appliedFrom', 'appliedTo']).map(
                    ([name, value]) => (
                      <input
                        key={name}
                        type="hidden"
                        name={name}
                        value={value}
                      />
                    ),
                  )}
                  <TextField
                    id="appliedFrom"
                    name="appliedFrom"
                    type="date"
                    label={t('period.from')}
                    defaultValue={query.appliedFrom}
                  />
                  <TextField
                    id="appliedTo"
                    name="appliedTo"
                    type="date"
                    label={t('period.to')}
                    defaultValue={query.appliedTo}
                  />
                  <div className={styles.actions}>
                    <Button type="submit" variant="primary" size="sm">
                      {t('period.apply')}
                    </Button>
                    <Button size="sm" {...popoverCloseProps(PERIOD_POPOVER)}>
                      {t('period.cancel')}
                    </Button>
                  </div>
                </Form>
              </Popover>
            </div>
          </th>
          <th scope="col" aria-sort={sortState(query, 'createdAt')}>
            {sortLink('createdAt')}
          </th>
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={offer.id}>
            <td className={styles.titleCell}>
              <Link href={`/offers/${offer.id}`}>{offer.title}</Link>
            </td>
            <td>{offer.company ?? '—'}</td>
            <td>{offer.location ?? '—'}</td>
            <td className={styles.dateCell}>
              {offer.appliedAt ? formatDate(format, offer.appliedAt) : '—'}
            </td>
            <td className={styles.dateCell}>
              {formatDay(format, offer.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
