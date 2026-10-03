import {
  EMPTY_INTERVIEW_STEP_FORM,
  INTERVIEW_STEP_STATUS_LABELS,
  parseInterviewStepForm,
  readInterviewStepForm,
  type InterviewStepFormValues,
} from './interview-step-form';

const valid: InterviewStepFormValues = {
  ...EMPTY_INTERVIEW_STEP_FORM,
  title: 'Phone screen',
};

describe('parseInterviewStepForm', () => {
  it('trims values and turns empty optional fields into null', () => {
    expect(
      parseInterviewStepForm({ ...valid, title: ' Phone screen ', date: '' }),
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

  it.each(Object.keys(INTERVIEW_STEP_STATUS_LABELS))(
    'accepts the status %s',
    (status) => {
      expect(parseInterviewStepForm({ ...valid, status }).success).toBe(true);
    },
  );

  it.each<[string, Partial<InterviewStepFormValues>, string]>([
    ['a missing title', { title: '  ' }, 'title'],
    ['a title too long', { title: 'x'.repeat(201) }, 'title'],
    ['an unknown status', { status: 'won' }, 'status'],
    ['an empty status', { status: '' }, 'status'],
    ['an impossible date', { date: '2026-02-30' }, 'date'],
  ])('rejects %s', (_case, override, field) => {
    const result = parseInterviewStepForm({ ...valid, ...override });

    expect(result.success).toBe(false);
    expect(result.success ? undefined : result.fieldErrors).toHaveProperty(
      field,
    );
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
