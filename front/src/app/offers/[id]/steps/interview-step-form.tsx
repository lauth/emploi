'use client';

import { useTranslations } from 'next-intl';
import { useActionState } from 'react';
import {
  initialInterviewStepFormState,
  INTERVIEW_STEP_LIMITS,
  INTERVIEW_STEP_STATUSES,
  type InterviewStepFormState,
  type InterviewStepFormValues,
} from '@/lib/interview-step-form';
import {
  errorProps,
  FieldError,
  FormActions,
  FormErrors,
} from '../../form-parts';
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
  const { values, fieldErrors } = state;
  const t = useTranslations('steps');

  return (
    <form action={formAction} className={styles.form}>
      <FormErrors messages={state.formErrors} />

      <div className={styles.field}>
        <label htmlFor="title">{t('fields.title')}</label>
        <input
          id="title"
          name="title"
          required
          placeholder={t('fields.titlePlaceholder')}
          maxLength={INTERVIEW_STEP_LIMITS.title}
          defaultValue={values.title}
          {...errorProps(state, 'title')}
        />
        <FieldError field="title" messages={fieldErrors.title} />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="date">{t('fields.date')}</label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={values.date}
            {...errorProps(state, 'date')}
          />
          <FieldError field="date" messages={fieldErrors.date} />
        </div>

        <div className={styles.field}>
          <label htmlFor="status">{t('fields.status')}</label>
          <select
            id="status"
            name="status"
            defaultValue={values.status}
            {...errorProps(state, 'status')}
          >
            {INTERVIEW_STEP_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
          <FieldError field="status" messages={fieldErrors.status} />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="description">{t('fields.description')}</label>
        <textarea
          id="description"
          name="description"
          rows={8}
          placeholder={t('fields.descriptionPlaceholder')}
          maxLength={INTERVIEW_STEP_LIMITS.description}
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
