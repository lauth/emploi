import {
  Button,
  buttonClassName,
  SelectField,
  TextField,
} from '@emploi/design-system';
import Form from 'next/form';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  OFFER_SORT_OPTIONS,
  PAGE_SIZES,
  type OfferListQuery,
} from '@/lib/offer-list-query';
import styles from './offers.module.css';

/**
 * Filters and sort of the offer list: a GET form (next/form) that writes them
 * in the URL, so it works without JavaScript and a filtered list can be
 * shared. Submitting starts again from the first page.
 */
export async function OfferFilters({ query }: { query: OfferListQuery }) {
  const t = await getTranslations('offers.list.filters');

  return (
    <search aria-label={t('label')}>
      <Form action="/offers" className={styles.filters}>
        <TextField
          id="q"
          name="q"
          type="search"
          label={t('q')}
          hint={t('qHint')}
          maxLength={200}
          defaultValue={query.q}
          className={styles.filterSearch}
        />
        <TextField
          id="appliedFrom"
          name="appliedFrom"
          type="date"
          label={t('appliedFrom')}
          defaultValue={query.appliedFrom}
        />
        <TextField
          id="appliedTo"
          name="appliedTo"
          type="date"
          label={t('appliedTo')}
          defaultValue={query.appliedTo}
        />
        <SelectField
          id="sort"
          name="sort"
          label={t('sort')}
          defaultValue={query.sort}
          options={OFFER_SORT_OPTIONS.map((option) => ({
            value: option,
            label: t(`sortOptions.${option}`),
          }))}
        />
        <SelectField
          id="size"
          name="size"
          label={t('size')}
          defaultValue={String(query.size)}
          options={PAGE_SIZES.map((size) => ({
            value: String(size),
            label: String(size),
          }))}
        />
        <div className={styles.filterActions}>
          <Button type="submit" variant="primary">
            {t('apply')}
          </Button>
          <Link href="/offers" className={buttonClassName()}>
            {t('reset')}
          </Link>
        </div>
      </Form>
    </search>
  );
}
