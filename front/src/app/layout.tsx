import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'emploi',
  description: 'Job search history',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
