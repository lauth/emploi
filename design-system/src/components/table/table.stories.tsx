import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Popover } from '../popover/popover';
import { headerCellClassName, sortableHeaderClassName, Table } from './table';

const meta = {
  title: 'Components/Table',
  component: Table,
  args: { caption: 'Offres' },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  ['Développeur backend', 'Acme', 'Lyon', '6 oct. 2026'],
  ['Backend Engineer', 'Achil', 'Paris', '2 oct. 2026'],
  ['Lead développeur', '—', '—', '28 sept. 2026'],
];

const body = (
  <tbody>
    {rows.map(([title, company, location, date]) => (
      <tr key={title}>
        <td>
          <a href="#offer">{title}</a>
        </td>
        <td>{company}</td>
        <td>{location}</td>
        <td>{date}</td>
      </tr>
    ))}
  </tbody>
);

export const Simple: Story = {
  args: {
    children: (
      <>
        <thead>
          <tr>
            <th scope="col">Intitulé</th>
            <th scope="col">Entreprise</th>
            <th scope="col">Lieu</th>
            <th scope="col">Candidature</th>
          </tr>
        </thead>
        {body}
      </>
    ),
  },
};

/** Sortable headers are links (the sort lives in the URL); `aria-sort` drives the arrows. */
export const Sortable: Story = {
  args: {
    caption: 'Offres, triées par date de candidature, la plus récente d’abord',
    children: (
      <>
        <thead>
          <tr>
            <th scope="col" aria-sort="none">
              <a href="#sort-title" className={sortableHeaderClassName}>
                Intitulé
              </a>
            </th>
            <th scope="col" aria-sort="none">
              <a href="#sort-company" className={sortableHeaderClassName}>
                Entreprise
              </a>
            </th>
            <th scope="col">Lieu</th>
            <th scope="col" aria-sort="descending">
              <a href="#sort-applied" className={sortableHeaderClassName}>
                Candidature
              </a>
            </th>
          </tr>
        </thead>
        {body}
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole('columnheader', {
      name: 'Candidature',
    });
    await expect(header).toHaveAttribute('aria-sort', 'descending');
  },
};

/** A header cell with its sort link and a filter button opening a popover. */
export const WithHeaderFilter: Story = {
  args: {
    children: (
      <>
        <thead>
          <tr>
            <th scope="col">Intitulé</th>
            <th scope="col" aria-sort="descending">
              <div className={headerCellClassName}>
                <a href="#sort-applied" className={sortableHeaderClassName}>
                  Candidature
                </a>
                <Popover
                  id="story-filter"
                  label="Filtrer"
                  triggerLabel="Filtrer par date de candidature"
                >
                  <p>Période de candidature</p>
                </Popover>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Développeur backend</td>
            <td>6 oct. 2026</td>
          </tr>
        </tbody>
      </>
    ),
  },
};

export const VisibleCaption: Story = {
  args: { ...Simple.args, caption: '3 offres', captionVisible: true },
};
