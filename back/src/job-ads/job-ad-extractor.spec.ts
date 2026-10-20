import { extractJobAd } from './job-ad-extractor.js';

const URL = 'https://jobs.example.com/42';

function page(head: string, body = ''): string {
  return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
}

function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

describe('extractJobAd', () => {
  it('reads the schema.org JobPosting of the page', () => {
    const html = page(
      jsonLd({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: 'Développeur backend H/F',
        hiringOrganization: { '@type': 'Organization', name: 'Acme &amp; Cie' },
        jobLocation: {
          '@type': 'Place',
          address: { addressLocality: 'Lyon', addressCountry: 'FR' },
        },
        description:
          '<p>Rejoignez notre équipe.</p><h2>Missions</h2><ul><li>Concevoir l’API</li><li>Écrire des tests</li></ul><p>Télétravail<br>2 jours</p>',
      }),
      '<p>Ignored when there is a JobPosting.</p>',
    );

    expect(extractJobAd(html, URL)).toEqual({
      url: URL,
      title: 'Développeur backend H/F',
      company: 'Acme & Cie',
      location: 'Lyon',
      description:
        'Rejoignez notre équipe.\n\nMissions\n\n• Concevoir l’API\n• Écrire des tests\n\nTélétravail\n2 jours',
    });
  });

  it('finds a JobPosting inside a @graph, among other blocks', () => {
    const html = page(
      '<script type="application/ld+json">{ not json</script>' +
        jsonLd({ '@type': 'WebSite', name: 'Board' }) +
        jsonLd({
          '@graph': [
            { '@type': 'BreadcrumbList' },
            {
              '@type': ['JobPosting'],
              title: 'Lead dev',
              hiringOrganization: 'Globex',
              jobLocation: [{ address: 'Paris' }, { address: 'Nantes' }],
              description: 'Plain text.',
            },
          ],
        }),
    );

    expect(extractJobAd(html, URL)).toMatchObject({
      title: 'Lead dev',
      company: 'Globex',
      location: 'Paris',
      description: 'Plain text.',
    });
  });

  it('reads a description whose HTML is escaped once more', () => {
    const html = page(
      jsonLd({
        '@type': 'JobPosting',
        title: 'Dev',
        description:
          '&lt;p&gt;Première ligne&lt;/p&gt;&lt;p&gt;Seconde&lt;/p&gt;',
      }),
    );

    expect(extractJobAd(html, URL)?.description).toBe(
      'Première ligne\n\nSeconde',
    );
  });

  it('falls back to the page title and main text, without what surrounds the ad', () => {
    const text = 'Nous recherchons une développeuse. '.repeat(8).trim();
    const html = page(
      '<title>Fallback title · Board</title><meta property="og:title" content="Développeuse fullstack">',
      `<header>Logo</header><nav>Menu</nav><main><h1>Développeuse fullstack</h1><script>track()</script><p>${text}</p><form><button>Postuler</button></form></main><footer>Mentions</footer>`,
    );

    expect(extractJobAd(html, URL)).toEqual({
      url: URL,
      title: 'Développeuse fullstack',
      company: null,
      location: null,
      description: `Développeuse fullstack\n\n${text}`,
    });
  });

  it('keeps only the title when the page has too little text', () => {
    const html = page('<title>Offre</title>', '<p>Activez JavaScript.</p>');

    expect(extractJobAd(html, URL)).toMatchObject({
      title: 'Offre',
      description: null,
    });
  });

  it('gives null when the page holds nothing usable', () => {
    expect(extractJobAd(page('', '<div id="app"></div>'), URL)).toBeNull();
  });

  it('cuts the text to the offer limits', () => {
    const html = page(
      jsonLd({
        '@type': 'JobPosting',
        title: 'T'.repeat(300),
        description: 'D'.repeat(25_000),
      }),
    );

    const ad = extractJobAd(html, URL);

    expect(ad?.title).toHaveLength(200);
    expect(ad?.title?.endsWith('…')).toBe(true);
    expect(ad?.description).toHaveLength(20_000);
  });
});
