import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EMPTY_OFFER_FORM,
  readOfferForm,
  type OfferFormState,
  type OfferFormValues,
} from '@/lib/offer-form';
import { renderWithIntl } from '@/test/intl';
import { OfferForm } from './offer-form';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const values: OfferFormValues = {
  title: 'Backend developer',
  company: 'Acme',
  url: 'https://jobs.example.com/42',
  location: 'Lyon',
  description: 'Node.js',
  appliedAt: '2026-09-28',
  status: 'interviewing',
};

function renderForm(
  action: (
    state: OfferFormState,
    formData: FormData,
  ) => Promise<OfferFormState>,
  initialValues = EMPTY_OFFER_FORM,
) {
  renderWithIntl(
    <OfferForm
      action={action}
      initialValues={initialValues}
      submitLabel="Enregistrer"
      cancelHref="/offers"
    />,
  );
}

describe('OfferForm', () => {
  it('shows the initial values under French labels', () => {
    renderForm(vi.fn(), values);

    expect(screen.getByLabelText('Intitulé du poste')).toHaveValue(
      'Backend developer',
    );
    expect(screen.getByLabelText('Entreprise')).toHaveValue('Acme');
    expect(screen.getByLabelText('Lien vers l’offre')).toHaveValue(
      'https://jobs.example.com/42',
    );
    expect(screen.getByLabelText('Lieu')).toHaveValue('Lyon');
    expect(screen.getByLabelText('Date de candidature')).toHaveValue(
      '2026-09-28',
    );
    expect(screen.getByLabelText('Description')).toHaveValue('Node.js');
    expect(screen.getByRole('link', { name: 'Annuler' })).toHaveAttribute(
      'href',
      '/offers',
    );
  });

  it('submits the typed values to the action', async () => {
    const submitted: FormData[] = [];
    const action = vi.fn((state: OfferFormState, formData: FormData) => {
      submitted.push(formData);
      return Promise.resolve(state);
    });
    renderForm(action);

    await userEvent.type(screen.getByLabelText('Intitulé du poste'), 'Dev');
    await userEvent.type(screen.getByLabelText('Entreprise'), 'Acme');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(submitted).toHaveLength(1);
    expect(submitted[0]?.get('title')).toBe('Dev');
    expect(submitted[0]?.get('company')).toBe('Acme');
  });

  it('shows the errors returned by the action and keeps the values', async () => {
    const action = vi.fn(
      (_state: OfferFormState, formData: FormData): Promise<OfferFormState> =>
        Promise.resolve({
          values: readOfferForm(formData),
          fieldErrors: { company: ['200 caractères maximum'] },
          formErrors: ['L’offre n’a pas pu être enregistrée.'],
        }),
    );
    renderForm(action);

    await userEvent.type(screen.getByLabelText('Intitulé du poste'), 'Dev');
    await userEvent.type(screen.getByLabelText('Entreprise'), 'Acme');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'L’offre n’a pas pu être enregistrée.',
    );
    const company = screen.getByLabelText('Entreprise');
    expect(company).toHaveAttribute('aria-invalid', 'true');
    expect(company).toHaveAccessibleDescription('200 caractères maximum');
    expect(screen.getByLabelText('Intitulé du poste')).toHaveValue('Dev');
  });
});
