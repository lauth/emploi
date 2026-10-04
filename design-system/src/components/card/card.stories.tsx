import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../badge/badge';
import { Button } from '../button/button';
import { Card } from './card';

const meta = {
  title: 'Components/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    children: (
      <>
        <strong>Développeur backend</strong>
        <p>Acme · Lyon</p>
      </>
    ),
  },
};

/** As list items, e.g. the offers or the interview steps. */
export const InAList: Story = {
  render: () => (
    <ol style={{ display: 'grid', gap: '0.75rem', listStyle: 'none' }}>
      <Card as="li">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>Entretien RH</h3>
          <Badge tone="success">Validée</Badge>
        </div>
        <p>30 sept. 2026</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <Button size="sm">Modifier</Button>
          <Button size="sm" variant="danger">
            Supprimer
          </Button>
        </div>
      </Card>
      <Card as="li">
        <h3>Test technique</h3>
        <p>Date à définir</p>
      </Card>
    </ol>
  ),
};
