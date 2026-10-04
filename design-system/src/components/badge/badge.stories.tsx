import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Prévue' },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { tone: 'neutral', children: 'Annulée' },
};

export const Info: Story = { args: { tone: 'info', children: 'Prévue' } };

export const Success: Story = {
  args: { tone: 'success', children: 'Validée' },
};

export const Warning: Story = {
  args: { tone: 'warning', children: 'En attente de réponse' },
};

export const Danger: Story = { args: { tone: 'danger', children: 'Refusée' } };

/** All tones side by side. */
export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge tone="info">Prévue</Badge>
      <Badge tone="warning">En attente de réponse</Badge>
      <Badge tone="success">Validée</Badge>
      <Badge tone="danger">Refusée</Badge>
      <Badge tone="neutral">Annulée</Badge>
    </div>
  ),
};
