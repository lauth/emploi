import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EMPTY_OFFER_FORM,
  readOfferForm,
  type OfferFormState,
  type OfferFormValues,
} from '@/lib/offer-form';
import { renderWithIntl } from '@/test/intl';
import type { FetchJobAdResult } from './actions';
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
  fetchJobAd: (url: string) => Promise<FetchJobAdResult> = vi.fn(),
) {
  renderWithIntl(
    <OfferForm
      action={action}
      fetchJobAd={fetchJobAd}
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

  it('asks for the link first, with its fetch button, then the title', async () => {
    renderForm(vi.fn());

    await userEvent.tab();
    expect(screen.getByLabelText('Lien vers l’offre')).toHaveFocus();
    await userEvent.tab();
    expect(
      screen.getByRole('button', { name: 'Récupérer l’annonce' }),
    ).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByLabelText('Intitulé du poste')).toHaveFocus();
  });

  describe('fetching the job ad (adrs/0032-fetch-job-ad.md)', () => {
    const ad = {
      url: 'https://jobs.example.com/42',
      title: 'Développeur backend',
      company: 'Acme',
      location: 'Lyon',
      description: 'Missions\n\n• API',
    };

    async function fetchFrom(url: string) {
      await userEvent.type(screen.getByLabelText('Lien vers l’offre'), url);
      await userEvent.click(
        screen.getByRole('button', { name: 'Récupérer l’annonce' }),
      );
    }

    it('fills the empty fields from the ad', async () => {
      const fetchJobAd = vi.fn(() =>
        Promise.resolve({ ok: true, ad } as const),
      );
      renderForm(vi.fn(), EMPTY_OFFER_FORM, fetchJobAd);

      await fetchFrom('https://jobs.example.com/42');

      expect(fetchJobAd).toHaveBeenCalledWith('https://jobs.example.com/42');
      expect(await screen.findByRole('status')).toHaveTextContent(
        'Annonce récupérée : vérifiez les champs avant d’enregistrer.',
      );
      expect(screen.getByLabelText('Intitulé du poste')).toHaveValue(
        'Développeur backend',
      );
      expect(screen.getByLabelText('Entreprise')).toHaveValue('Acme');
      expect(screen.getByLabelText('Lieu')).toHaveValue('Lyon');
      expect(screen.getByLabelText('Description')).toHaveValue(
        'Missions\n\n• API',
      );
    });

    it('keeps what the user typed, and asks before replacing the description', async () => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderForm(
        vi.fn(),
        {
          ...EMPTY_OFFER_FORM,
          title: 'Mon intitulé',
          description: 'Mes notes',
        },
        () => Promise.resolve({ ok: true, ad }),
      );

      await fetchFrom('https://jobs.example.com/42');

      await screen.findByRole('status');
      expect(confirm).toHaveBeenCalledWith(
        'Remplacer la description actuelle par le texte de l’annonce ?',
      );
      expect(screen.getByLabelText('Intitulé du poste')).toHaveValue(
        'Mon intitulé',
      );
      expect(screen.getByLabelText('Description')).toHaveValue('Mes notes');
      expect(screen.getByLabelText('Entreprise')).toHaveValue('Acme');
      confirm.mockRestore();
    });

    it('shows why the ad could not be read', async () => {
      renderForm(vi.fn(), EMPTY_OFFER_FORM, () =>
        Promise.resolve({
          ok: false,
          message: 'La page n’a pas pu être récupérée.',
        }),
      );

      await fetchFrom('https://jobs.example.com/42');

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'La page n’a pas pu être récupérée.',
      );
      expect(screen.getByLabelText('Description')).toHaveValue('');
    });

    it('asks for the link before fetching', async () => {
      const fetchJobAd = vi.fn();
      renderForm(vi.fn(), EMPTY_OFFER_FORM, fetchJobAd);

      await userEvent.click(
        screen.getByRole('button', { name: 'Récupérer l’annonce' }),
      );

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Saisissez d’abord le lien de l’annonce.',
      );
      expect(fetchJobAd).not.toHaveBeenCalled();
    });
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
