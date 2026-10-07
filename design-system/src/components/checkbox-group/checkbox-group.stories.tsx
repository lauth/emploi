import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CheckboxGroup } from './checkbox-group';

const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  args: {
    legend: 'Statuts affichés',
    name: 'status',
    options: [
      { value: 'applied', label: 'Candidature envoyée' },
      { value: 'interviewing', label: 'Entretiens en cours' },
      { value: 'offered', label: 'Offre reçue' },
      { value: 'rejected', label: 'Refusée' },
    ],
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('checkbox', { name: 'Offre reçue' });
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await expect(
      canvas.getByRole('group', { name: 'Statuts affichés' }),
    ).toBeInTheDocument();
  },
};

export const SomeChecked: Story = {
  args: { defaultValue: ['applied', 'interviewing'] },
};

export const WithHint: Story = {
  args: { hint: 'Aucune case cochée : tous les statuts.' },
};
