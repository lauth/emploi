'use client';

import { useActionState } from 'react';
import {
  initialOfferFormState,
  OFFER_LIMITS,
  type OfferFormState,
  type OfferFormValues,
} from '@/lib/offer-form';
import { errorProps, FieldError, FormActions, FormErrors } from './form-parts';
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
  const { values, fieldErrors } = state;

  return (
    <form action={formAction} className={styles.form}>
      <FormErrors messages={state.formErrors} />

      <div className={styles.field}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          required
          maxLength={OFFER_LIMITS.title}
          defaultValue={values.title}
          {...errorProps(state, 'title')}
        />
        <FieldError field="title" messages={fieldErrors.title} />
      </div>

      <div className={styles.field}>
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          maxLength={OFFER_LIMITS.company}
          defaultValue={values.company}
          {...errorProps(state, 'company')}
        />
        <FieldError field="company" messages={fieldErrors.company} />
      </div>

      <div className={styles.field}>
        <label htmlFor="url">Link to the offer</label>
        <input
          id="url"
          name="url"
          type="url"
          placeholder="https://"
          maxLength={OFFER_LIMITS.url}
          defaultValue={values.url}
          {...errorProps(state, 'url')}
        />
        <FieldError field="url" messages={fieldErrors.url} />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            maxLength={OFFER_LIMITS.location}
            defaultValue={values.location}
            {...errorProps(state, 'location')}
          />
          <FieldError field="location" messages={fieldErrors.location} />
        </div>

        <div className={styles.field}>
          <label htmlFor="appliedAt">Applied on</label>
          <input
            id="appliedAt"
            name="appliedAt"
            type="date"
            defaultValue={values.appliedAt}
            {...errorProps(state, 'appliedAt')}
          />
          <FieldError field="appliedAt" messages={fieldErrors.appliedAt} />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={12}
          maxLength={OFFER_LIMITS.description}
          defaultValue={values.description}
          {...errorProps(state, 'description')}
        />
        <FieldError field="description" messages={fieldErrors.description} />
      </div>

      <FormActions
        pending={pending}
        submitLabel={submitLabel}
        cancelHref={cancelHref}
      />
    </form>
  );
}
