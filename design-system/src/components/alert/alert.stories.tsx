import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Alert } from './alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  args: { children: 'L’offre a été enregistrée.' },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { tone: 'info' } };

export const Success: Story = { args: { tone: 'success' } };

export const Warning: Story = {
  args: { tone: 'warning', children: 'L’API est lente à répondre.' },
};

/** Form errors: announced immediately to screen readers. */
export const Danger: Story = {
  args: {
    tone: 'danger',
    children: (
      <ul>
        <li>L’offre n’a pas pu être enregistrée. Veuillez réessayer.</li>
      </ul>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toBeVisible();
  },
};
