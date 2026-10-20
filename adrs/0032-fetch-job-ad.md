# 32. Fetch a job ad from its link

- Status: Accepted
- Date: 2026-10-21

## Context

The user pastes the link of a job ad, then copies its text into the description by hand. They want a button next to the link that fetches the page and fills the description. It is a manual action, one page at a time, like opening the link in a browser: not crawling, so `robots.txt` doesn't apply.

The browser can't fetch the page itself (CORS), so a server does. A server fetching any URL it is given is a Server-Side Request Forgery risk (OWASP A10): the URL could point at the cluster (`http://postgres:5432`, `http://back`), the node, the host or the local network.

## Decision

**API.** `POST /job-ads/fetch` with `{ url }` answers `{ url, title, company, location, description }` (each `null` when not found), without saving anything. It's a back feature (module `job-ads`), next to the data it fills; the front only calls it.

**Fetching** (`job-ads/page-fetcher.ts`), with Node's `http`/`https`, no library:

- Only `http` and `https`, default ports or not, and the address is checked **at connection time**: the `lookup` of each request resolves the name and refuses loopback, private, link-local, carrier-grade NAT, multicast, reserved and documentation ranges, IPv4 and IPv6 (`net.BlockList`). Checking there, not before fetching, closes DNS rebinding (a name resolving to a public address, then to a private one).
- Redirects are followed by hand, at most 5, each one checked the same way.
- 10 s timeout, 5 MB at most (compressed responses decompressed and counted), only `text/html` and `application/xhtml+xml`.
- Browser-like request headers (`User-Agent`, `Accept`, `Accept-Language: fr`), as the user's browser would send.
- Failures are a `job-ad-unreachable` problem (502) whose `detail` says why: blocked address, timeout, HTTP status, not HTML, too large.

**Reading** (`job-ads/job-ad-extractor.ts`, a pure function tested on HTML samples), with `linkedom` to parse the HTML:

1. The schema.org `JobPosting` in JSON-LD, which most job boards publish for search engines: title, hiring organisation, locality, description.
2. Otherwise the page's `og:title`/`<title>` and the text of `<main>`, `<article>` or `<body>`, without scripts, styles, navigation, headers, footers and forms.

HTML becomes plain text (paragraphs, `•` list items), cut to the offer field limits. Nothing usable is a `job-ad-unreadable` problem (422).

**Front.** A "Récupérer l'annonce" button next to the link in the offer form calls a server action, which calls the API. The description is filled (after a confirmation when it isn't empty); title, company and location only when they're empty. The user reviews everything before saving.

**MCP.** No tool: AI clients read web pages themselves. The coverage test excludes the operation with that reason.

## Consequences

- Pages rendered by JavaScript only, or behind a login (LinkedIn) or a bot challenge, can't be read: the user gets a message and copies the text as before. A page whose ad body is loaded by JavaScript but whose surroundings are HTML (France Travail, checked on 2026-10-21) gives the right title and a description of the surrounding page, which the user reviews before saving; sites publishing a JobPosting (HelloWork, checked the same day) give clean fields.
- One new dependency, `linkedom` (DOM parsing on the server).
- The back pod needs outbound internet access, which the k3d cluster has.
