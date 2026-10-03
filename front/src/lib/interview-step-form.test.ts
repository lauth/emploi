import type { TranslateValidation } from './forms';
import {
  EMPTY_INTERVIEW_STEP_FORM,
  INTERVIEW_STEP_STATUSES,
  parseInterviewStepForm,
  readInterviewStepForm,
  type InterviewStepFormValues,
} from './interview-step-form';

/** Returns the message key (and limit), to assert which rule failed. */
const keys: TranslateValidation = (message, { max }) =>
  message === 'tooLong' ? `tooLong:${String(max)}` : message;

const valid: InterviewStepFormValues = {
  ...EMPTY_INTERVIEW_STEP_FORM,
  title: 'Phone screen',
};

describe('parseInterviewStepForm', () => {
  it('trims values and turns empty optional fields into null', () => {
    expect(
      parseInterviewStepForm(
        { ...valid, title: ' Phone screen ', date: '' },
        keys,
      ),
    ).toEqual({
      success: true,
      data: {
        title: 'Phone screen',
        date: null,
        status: 'planned',
        description: null,
      },
    });
  });

  it.each(INTERVIEW_STEP_STATUSES)('accepts the status %s', (status) => {
    expect(parseInterviewStepForm({ ...valid, status }, keys).success).toBe(
      true,
    );
  });

  it.each<[string, Partial<InterviewStepFormValues>, string, string]>([
    ['a missing title', { title: '  ' }, 'title', 'required'],
    ['a title too long', { title: 'x'.repeat(201) }, 'title', 'tooLong:200'],
    ['an unknown status', { status: 'won' }, 'status', 'invalidChoice'],
    ['an empty status', { status: '' }, 'status', 'invalidChoice'],
    ['an impossible date', { date: '2026-02-30' }, 'date', 'invalidDate'],
  ])('rejects %s', (_case, override, field, message) => {
    expect(parseInterviewStepForm({ ...valid, ...override }, keys)).toEqual({
      success: false,
      fieldErrors: { [field]: [message] },
    });
  });
});

describe('readInterviewStepForm', () => {
  it('reads the step fields and defaults missing ones to empty strings', () => {
    const formData = new FormData();
    formData.set('title', 'Call');
    formData.set('status', 'passed');

    expect(readInterviewStepForm(formData)).toEqual({
      title: 'Call',
      date: '',
      status: 'passed',
      description: '',
    });
  });
});
