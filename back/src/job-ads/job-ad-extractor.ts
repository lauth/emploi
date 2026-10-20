import type { JobAd } from '@emploi/shared';
import { parseHTML } from 'linkedom';
import { OFFER_LIMITS } from '../offers/offer-limits.js';

// Reading a job ad from its page (adrs/0032-fetch-job-ad.md): the schema.org
// JobPosting most job boards publish for search engines, otherwise the page's
// title and main text. Everything becomes plain text, cut to the offer limits.

/** Elements whose content is never text of the ad. */
const SKIPPED = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'SVG',
  'IFRAME',
  'BUTTON',
  'SELECT',
]);

/** Parts of a page around the ad itself, dropped when reading the main text. */
const AROUND_THE_AD =
  'nav, header, footer, aside, form, [role="navigation"], [aria-hidden="true"]';

const PARAGRAPHS = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'UL',
  'OL',
  'TABLE',
  'BLOCKQUOTE',
  'PRE',
]);
const LINES = new Set([
  'DIV',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
  'MAIN',
  'LI',
  'TR',
  'DL',
  'DT',
  'DD',
  'FIGURE',
  'HR',
]);

/** Below this, the text of a page is navigation or a cookie banner, not an ad. */
const MIN_PAGE_TEXT = 200;

type Json = Record<string, unknown>;

/** What the page says about the ad, `null` when it holds nothing usable. */
export function extractJobAd(html: string, url: string): JobAd | null {
  const { document } = parseHTML(html);
  const posting = findJobPosting(document);

  const title =
    (posting && plain(posting.title)) ?? pageTitle(document) ?? null;
  const description =
    (posting && richText(posting.description)) ?? mainText(document);
  if (title === null && description === null) {
    return null;
  }
  return {
    url,
    title: cut(title, OFFER_LIMITS.title),
    company: cut(posting && organisation(posting), OFFER_LIMITS.company),
    location: cut(posting && locality(posting), OFFER_LIMITS.location),
    description: cut(description, OFFER_LIMITS.description),
  };
}

/** The first JobPosting of the page's JSON-LD blocks, wherever it is nested. */
function findJobPosting(document: Document): Json | null {
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    let data: unknown;
    try {
      data = JSON.parse(script.textContent);
    } catch {
      continue;
    }
    const posting = searchPosting(data);
    if (posting) {
      return posting;
    }
  }
  return null;
}

function searchPosting(value: unknown): Json | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = searchPosting(item);
      if (found) {
        return found;
      }
    }
    return null;
  }
  if (!isJson(value)) {
    return null;
  }
  const type = value['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.includes('JobPosting')) {
    return value;
  }
  return searchPosting(value['@graph']);
}

function organisation(posting: Json): string | null {
  const organization = posting.hiringOrganization;
  return isJson(organization) ? plain(organization.name) : plain(organization);
}

function locality(posting: Json): string | null {
  const places = posting.jobLocation;
  const place: unknown = Array.isArray(places) ? places[0] : places;
  if (!isJson(place)) {
    return null;
  }
  const address = place.address;
  if (!isJson(address)) {
    return plain(address);
  }
  return plain(address.addressLocality) ?? plain(address.addressRegion);
}

/** `og:title`, else `<title>`. */
function pageTitle(document: Document): string | null {
  const og = document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute('content');
  return plain(og) ?? plain(document.querySelector('title')?.textContent);
}

/** The readable text of `<main>`, `<article>` or `<body>`, without what surrounds the ad. */
function mainText(document: Document): string | null {
  for (const element of document.querySelectorAll(AROUND_THE_AD)) {
    element.remove();
  }
  const root =
    document.querySelector('main') ??
    document.querySelector('article') ??
    document.body;
  const text = toText(root);
  return text.length >= MIN_PAGE_TEXT ? text : null;
}

/** A JSON-LD text that may hold HTML (often escaped once more): plain text. */
function richText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  let text = htmlToText(value);
  // `&lt;p&gt;` becomes `<p>` on the first pass: read it as HTML again.
  if (/<\/?[a-z][^>]*>/i.test(text)) {
    text = htmlToText(text);
  }
  return text || null;
}

/** A short JSON-LD or meta value as plain text, entities decoded. */
function plain(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  return htmlToText(value).replace(/\s+/g, ' ').trim() || null;
}

function htmlToText(html: string): string {
  const { document } = parseHTML(
    `<!doctype html><html><body>${html}</body></html>`,
  );
  return toText(document.body);
}

/** Text of an element: paragraphs separated by a blank line, list items as `•`. */
function toText(root: Element): string {
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === node.TEXT_NODE) {
      parts.push((node.textContent ?? '').replace(/\s+/g, ' '));
      return;
    }
    if (node.nodeType !== node.ELEMENT_NODE) {
      return;
    }
    const tag = (node as Element).tagName.toUpperCase();
    if (SKIPPED.has(tag)) {
      return;
    }
    if (tag === 'BR') {
      parts.push('\n');
      return;
    }
    const separator = PARAGRAPHS.has(tag)
      ? PARAGRAPH_BREAK
      : LINES.has(tag)
        ? LINE_BREAK
        : '';
    parts.push(separator, tag === 'LI' ? '• ' : '');
    for (const child of node.childNodes) {
      walk(child);
    }
    parts.push(separator);
  };
  walk(root);
  return (
    parts
      .join('')
      // Breaks next to each other (the end of a list item and the start of the
      // next) are one: a blank line if any of them ends a paragraph.
      .replace(BREAKS, (run) => (run.includes(PARAGRAPH_BREAK) ? '\n\n' : '\n'))
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/** Markers of the breaks between blocks, merged once the text is built. */
const LINE_BREAK = '\u0001';
const PARAGRAPH_BREAK = '\u0002';
// eslint-disable-next-line no-control-regex -- the markers are control characters, chosen because pages don't contain them.
const BREAKS = /[\u0001\u0002][\s\u0001\u0002]*/g;

/** Cut to `max` characters, ending with `…` when cut. */
function cut(text: string | null | undefined, max: number): string | null {
  if (!text) {
    return null;
  }
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function isJson(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
