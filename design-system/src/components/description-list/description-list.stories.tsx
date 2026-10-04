import type { Meta, StoryObj } from '@storybook/react-vite';
import { DescriptionList } from './description-list';

const meta = {
  title: 'Components/DescriptionList',
  component: DescriptionList,
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OfferDetails: Story = {
  args: {
    items: [
      {
        key: 'link',
        term: 'Lien',
        description: <a href="#offer">https://example.com/jobs/1</a>,
      },
      { key: 'applied', term: 'Candidature le', description: '28 sept. 2026' },
      { key: 'added', term: 'Ajoutée le', description: '4 oct. 2026, 01:24' },
    ],
  },
};

export const LongValue: Story = {
  args: {
    items: [
      {
        key: 'url',
        term: 'Lien',
        description:
          'https://www.example.com/jobs/item/01p112182?fromSearch=true&utm_source=newsletter&utm_campaign=autumn',
      },
    ],
  },
};
