'use client';

import { useActionState } from 'react';
import {
  initialInterviewStepFormState,
  INTERVIEW_STEP_LIMITS,
  INTERVIEW_STEP_STATUS_LABELS,
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

  return (
    <form action={formAction} className={styles.form}>
      <FormErrors messages={state.formErrors} />

      <div className={styles.field}>
        <label htmlFor="title">Step</label>
        <input
          id="title"
          name="title"
          required
          placeholder="Phone screen with HR, technical test…"
          maxLength={INTERVIEW_STEP_LIMITS.title}
          defaultValue={values.title}
          {...errorProps(state, 'title')}
        />
        <FieldError field="title" messages={fieldErrors.title} />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="date">Date</label>
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
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            defaultValue={values.status}
            {...errorProps(state, 'status')}
          >
            {Object.entries(INTERVIEW_STEP_STATUS_LABELS).map(
              ([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ),
            )}
          </select>
          <FieldError field="status" messages={fieldErrors.status} />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Notes</label>
        <textarea
          id="description"
          name="description"
          rows={8}
          placeholder="Who you met, what was asked, feedback…"
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
