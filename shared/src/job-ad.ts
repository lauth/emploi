// Fetching a job ad from its link (adrs/0032-fetch-job-ad.md).

/** Body of `POST /job-ads/fetch`. */
export interface FetchJobAdRequest {
  /** Link of the ad, `http` or `https`. */
  url: string;
}

/**
 * What the page of a job ad says, ready to fill an offer: plain text, cut to
 * the offer field limits, `null` when not found. Nothing is saved.
 */
export interface JobAd {
  /** The page read, after redirects. */
  url: string;
  title: string | null;
  company: string | null;
  location: string | null;
  description: string | null;
}
