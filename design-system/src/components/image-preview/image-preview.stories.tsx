import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { ImagePreview } from './image-preview';

/** A wide sample image, inline so stories need no file. */
const SAMPLE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
    '<rect width="1200" height="800" fill="#1a56db"/>' +
    '<rect x="80" y="80" width="1040" height="120" fill="#ffffff"/>' +
    '<rect x="80" y="260" width="700" height="40" fill="#dadce0"/>' +
    '<rect x="80" y="330" width="900" height="40" fill="#dadce0"/>' +
    '</svg>',
)}`;

const meta = {
  title: 'Components/ImagePreview',
  component: ImagePreview,
  args: {
    src: SAMPLE,
    alt: 'Capture de l’annonce',
    openLabel: 'Agrandir l’image',
    closeLabel: 'Fermer',
  },
} satisfies Meta<typeof ImagePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click the thumbnail: the full image opens in a modal dialog. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const thumbnail = within(canvasElement).getByRole('button', {
      name: 'Agrandir l’image',
    });
    await expect(thumbnail).toHaveAttribute('aria-haspopup', 'dialog');
  },
};
