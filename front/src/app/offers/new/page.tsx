import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EMPTY_OFFER_FORM } from '@/lib/offer-form';
import { createOfferAction } from '../actions';
import { OfferForm } from '../offer-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('offers.new');
  return { title: t('title') };
}

export default async function NewOfferPage() {
  const t = await getTranslations('offers.new');
  return (
    <>
      <h1>{t('title')}</h1>
      <OfferForm
        action={createOfferAction}
        initialValues={EMPTY_OFFER_FORM}
        submitLabel={t('submit')}
        cancelHref="/offers"
      />
    </>
  );
}
