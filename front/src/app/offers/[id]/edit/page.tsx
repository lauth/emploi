import type { Offer } from '@emploi/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { OfferFormValues } from '@/lib/offer-form';
import { updateOfferAction } from '../../actions';
import { OfferForm } from '../../offer-form';
import { loadOffer } from '../load-offer';

export async function generateMetadata({
  params,
}: PageProps<'/offers/[id]/edit'>): Promise<Metadata> {
  const offer = await loadOffer((await params).id);
  return { title: `Edit ${offer?.title ?? 'offer'} · emploi` };
}

export default async function EditOfferPage({
  params,
}: PageProps<'/offers/[id]/edit'>) {
  const offer = await loadOffer((await params).id);
  if (offer === null) {
    notFound();
  }

  return (
    <>
      <h1>Edit the offer</h1>
      <OfferForm
        action={updateOfferAction.bind(null, offer.id)}
        initialValues={toFormValues(offer)}
        submitLabel="Save"
        cancelHref={`/offers/${offer.id}`}
      />
    </>
  );
}

function toFormValues(offer: Offer): OfferFormValues {
  return {
    title: offer.title,
    company: offer.company,
    url: offer.url ?? '',
    location: offer.location ?? '',
    description: offer.description ?? '',
    appliedAt: offer.appliedAt ?? '',
  };
}
