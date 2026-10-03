import type { Metadata } from 'next';
import { EMPTY_OFFER_FORM } from '@/lib/offer-form';
import { createOfferAction } from '../actions';
import { OfferForm } from '../offer-form';

export const metadata: Metadata = { title: 'Add an offer · emploi' };

export default function NewOfferPage() {
  return (
    <>
      <h1>Add an offer</h1>
      <OfferForm
        action={createOfferAction}
        initialValues={EMPTY_OFFER_FORM}
        submitLabel="Add the offer"
        cancelHref="/offers"
      />
    </>
  );
}
