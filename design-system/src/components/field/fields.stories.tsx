import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { SelectField } from './select-field';
import { TextAreaField } from './text-area-field';
import { TextField } from './text-field';

const meta = {
  title: 'Components/Fields',
  component: TextField,
  args: { label: 'Intitulé du poste', name: 'title' },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {};

export const WithValue: Story = {
  args: { defaultValue: 'Développeur backend' },
};

export const WithHint: Story = {
  args: {
    label: 'Lien vers l’offre',
    type: 'url',
    placeholder: 'https://',
    hint: 'L’adresse de l’annonce, si elle existe.',
  },
};

export const Required: Story = { args: { required: true } };

/** Compact toolbars: the label is read by screen readers but not shown. */
export const LabelHidden: Story = {
  args: {
    label: 'Rechercher une offre',
    labelHidden: true,
    type: 'search',
    placeholder: 'Intitulé, entreprise ou lieu…',
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('searchbox', {
        name: 'Rechercher une offre',
      }),
    ).toBeInTheDocument();
  },
};

export const WithError: Story = {
  args: { defaultValue: '   ', error: 'Champ obligatoire' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('Intitulé du poste');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Champ obligatoire');
  },
};

export const DateInput: Story = {
  args: {
    label: 'Date de candidature',
    type: 'date',
    defaultValue: '2026-09-28',
  },
};

export const Select: Story = {
  render: () => (
    <SelectField
      label="Statut"
      name="status"
      defaultValue="pending"
      options={[
        { value: 'planned', label: 'Prévue' },
        { value: 'pending', label: 'En attente de réponse' },
        { value: 'passed', label: 'Validée' },
      ]}
    />
  ),
};

export const SelectWithError: Story = {
  render: () => (
    <SelectField
      label="Statut"
      name="status"
      error="Choisissez une valeur de la liste"
      options={[{ value: 'planned', label: 'Prévue' }]}
    />
  ),
};

export const TextArea: Story = {
  render: () => (
    <TextAreaField
      label="Notes"
      name="description"
      rows={6}
      placeholder="Interlocuteurs, questions posées, retours…"
    />
  ),
};

export const TextAreaWithError: Story = {
  render: () => (
    <TextAreaField
      label="Description"
      name="description"
      rows={4}
      error="20 000 caractères maximum"
    />
  ),
};
