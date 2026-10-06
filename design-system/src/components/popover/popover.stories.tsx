import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Button } from '../button/button';
import { TextField } from '../field/text-field';
import { Popover, popoverCloseProps } from './popover';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  args: {
    id: 'story-popover',
    label: 'Filtrer',
    triggerLabel: 'Filtrer par date de candidature',
    children: <p>Contenu du panneau</p>,
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click the button: the native popover opens below it (closes on Escape or outside). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Filtrer par date de candidature',
    });
    await expect(trigger).toHaveAttribute('popovertarget', 'story-popover');
  },
};

/** Highlighted when the filter it opens is in use. */
export const Active: Story = { args: { active: true, id: 'story-active' } };

/** A small form in the panel, with a close button. */
export const WithForm: Story = {
  args: {
    id: 'story-form',
    children: (
      <form style={{ display: 'grid', gap: '0.75rem' }}>
        <TextField label="À partir du" type="date" name="from" />
        <TextField label="Jusqu’au" type="date" name="to" />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button type="submit" variant="primary" size="sm">
            Appliquer
          </Button>
          <Button size="sm" {...popoverCloseProps('story-form')}>
            Annuler
          </Button>
        </div>
      </form>
    ),
  },
};
