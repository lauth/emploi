'use client';

import { SelectField, TextAreaField, TextField } from '@emploi/design-system';
import { useTranslations } from 'next-intl';
import { useActionState } from 'react';
import {
  initialInterviewStepFormState,
  INTERVIEW_STEP_LIMITS,
  INTERVIEW_STEP_STATUSES,
  type InterviewStepFormState,
  type InterviewStepFormValues,
} from '@/lib/interview-step-form';
import { fieldError, FormActions, FormErrors } from '../../form-parts';
import styles from '../../offers.module.css';

interface InterviewStepFormProps {
  action: (
    state: InterviewStepFormState,
    formData: FormData,
  ) => Promise<InterviewStepFormState>;
  initialValues: InterviewStepFormValues;
  submitLabel: string;
  cancelHref: string;
}

/** Create and edit form of an interview step. */
export function InterviewStepForm({
  action,
  initialValues,
  submitLabel,
  cancelHref,
}: InterviewStepFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialInterviewStepFormState(initialValues),
  );
  const { values } = state;
  const t = useTranslations('steps');

  return (
    <form action={formAction} className={styles.form}>
      <FormErrors messages={state.formErrors} />

      <TextField
        id="title"
        name="title"
        label={t('fields.title')}
        required
        placeholder={t('fields.titlePlaceholder')}
        maxLength={INTERVIEW_STEP_LIMITS.title}
        defaultValue={values.title}
        error={fieldError(state, 'title')}
      />

      <div className={styles.row}>
        <TextField
          id="date"
          name="date"
          type="date"
          label={t('fields.date')}
          defaultValue={values.date}
          error={fieldError(state, 'date')}
        />
        <SelectField
          id="status"
          name="status"
          label={t('fields.status')}
          defaultValue={values.status}
          options={INTERVIEW_STEP_STATUSES.map((status) => ({
            value: status,
            label: t(`status.${status}`),
          }))}
          error={fieldError(state, 'status')}
        />
      </div>

      <TextAreaField
        id="description"
        name="description"
        label={t('fields.description')}
        rows={8}
        placeholder={t('fields.descriptionPlaceholder')}
        maxLength={INTERVIEW_STEP_LIMITS.description}
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
