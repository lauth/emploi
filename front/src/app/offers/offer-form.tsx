'use client';

import { SelectField, TextAreaField, TextField } from '@emploi/design-system';
import { useTranslations } from 'next-intl';
import { useActionState } from 'react';
import {
  initialOfferFormState,
  OFFER_LIMITS,
  OFFER_STATUSES,
  type OfferFormState,
  type OfferFormValues,
} from '@/lib/offer-form';
import { fieldError, FormActions, FormErrors } from './form-parts';
import styles from './offers.module.css';

interface OfferFormProps {
  action: (
    state: OfferFormState,
    formData: FormData,
  ) => Promise<OfferFormState>;
  initialValues: OfferFormValues;
  submitLabel: string;
  cancelHref: string;
}

/**
 * Create and edit form. Native constraints give immediate feedback; the server
 * action validates again and its errors are shown next to the fields.
 */
export function OfferForm({
  action,
  initialValues,
  submitLabel,
  cancelHref,
}: OfferFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialOfferFormState(initialValues),
  );
  const { values } = state;
  const t = useTranslations('offers.fields');
  const tStatus = useTranslations('offers.status');

  return (
    <form action={formAction} className={styles.form}>
      <FormErrors messages={state.formErrors} />

      <TextField
        id="title"
        name="title"
        label={t('title')}
        required
        maxLength={OFFER_LIMITS.title}
        defaultValue={values.title}
        error={fieldError(state, 'title')}
      />

      <TextField
        id="company"
        name="company"
        label={t('company')}
        maxLength={OFFER_LIMITS.company}
        defaultValue={values.company}
        error={fieldError(state, 'company')}
      />

      <TextField
        id="url"
        name="url"
        type="url"
        label={t('url')}
        placeholder="https://"
        maxLength={OFFER_LIMITS.url}
        defaultValue={values.url}
        error={fieldError(state, 'url')}
      />

      <div className={styles.row}>
        <TextField
          id="location"
          name="location"
          label={t('location')}
          maxLength={OFFER_LIMITS.location}
          defaultValue={values.location}
          error={fieldError(state, 'location')}
        />
        <TextField
          id="appliedAt"
          name="appliedAt"
          type="date"
          label={t('appliedAt')}
          defaultValue={values.appliedAt}
          error={fieldError(state, 'appliedAt')}
        />
      </div>

      <SelectField
        id="status"
        name="status"
        label={t('status')}
        defaultValue={values.status}
        options={OFFER_STATUSES.map((status) => ({
          value: status,
          label: tStatus(status),
        }))}
        error={fieldError(state, 'status')}
      />

      <TextAreaField
        id="description"
        name="description"
        label={t('description')}
        rows={12}
        maxLength={OFFER_LIMITS.description}
        defaultValue={values.description}
        error={fieldError(state, 'description')}
      />

      <FormActions
        pending={pending}
        submitLabel={submitLabel}
        cancelHref={cancelHref}
      />
    </form>
  );
}
