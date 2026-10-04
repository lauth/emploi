import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button, buttonClassName } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Enregistrer', onClick: fn() },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'danger'],
    },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };

export const Secondary: Story = { args: { variant: 'secondary' } };

export const Danger: Story = {
  args: { variant: 'danger', children: 'Supprimer' },
};

export const Small: Story = { args: { size: 'sm', children: 'Monter' } };

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'Enregistrement…' },
};

export const Clicked: Story = {
  args: { variant: 'primary' },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** `buttonClassName` gives a link the look of a button. */
export const LinkAsButton: Story = {
  render: () => (
    <a href="#offers" className={buttonClassName({ variant: 'primary' })}>
      Ajouter une offre
    </a>
  ),
};
