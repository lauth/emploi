import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'emploi',
  description: 'Job search history',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/offers" className="site-name">
            emploi
          </Link>
          <nav aria-label="Main">
            <Link href="/offers">Offers</Link>
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
