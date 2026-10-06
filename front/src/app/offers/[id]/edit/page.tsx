import type { Offer } from '@emploi/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { OfferFormValues } from '@/lib/offer-form';
import { updateOfferAction } from '../../actions';
import { OfferForm } from '../../offer-form';
import { loadOffer } from '../load-offer';

export async function generateMetadata({
  params,
}: PageProps<'/offers/[id]/edit'>): Promise<Metadata> {
  const offer = await loadOffer((await params).id);
  const t = await getTranslations('offers');
  return {
    title: offer
      ? t('edit.metaTitle', { title: offer.title })
      : t('edit.title'),
  };
}

export default async function EditOfferPage({
  params,
}: PageProps<'/offers/[id]/edit'>) {
  const offer = await loadOffer((await params).id);
  if (offer === null) {
    notFound();
  }
  const t = await getTranslations('offers.edit');

  return (
    <div className="readable">
      <h1>{t('title')}</h1>
      <OfferForm
        action={updateOfferAction.bind(null, offer.id)}
        initialValues={toFormValues(offer)}
        submitLabel={t('submit')}
        cancelHref={`/offers/${offer.id}`}
      />
    </div>
  );
}

function toFormValues(offer: Offer): OfferFormValues {
  return {
    title: offer.title,
    company: offer.company ?? '',
    url: offer.url ?? '',
    location: offer.location ?? '',
    description: offer.description ?? '',
    appliedAt: offer.appliedAt ?? '',
  };
}
