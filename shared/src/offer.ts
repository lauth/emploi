// Offers API (adrs/0011-offer-data-model-and-api.md).

/** A job offer the user responded to, as returned by the API. */
export interface Offer {
  id: string;
  title: string;
  company: string;
  url: string | null;
  location: string | null;
  description: string | null;
  /** Day the user responded, `YYYY-MM-DD`. */
  appliedAt: string | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

/** Body of `POST /offers`. */
export interface CreateOfferRequest {
  title: string;
  company: string;
  url?: string | null;
  location?: string | null;
  description?: string | null;
  /** `YYYY-MM-DD`. */
  appliedAt?: string | null;
}

/**
 * Body of `PATCH /offers/:id`. Absent fields are left unchanged; `null`
 * clears an optional field.
 */
export interface UpdateOfferRequest {
  title?: string;
  company?: string;
  url?: string | null;
  location?: string | null;
  description?: string | null;
  /** `YYYY-MM-DD`. */
  appliedAt?: string | null;
}

/** Maximum lengths enforced by the API. */
export interface OfferFieldLimits {
  title: 200;
  company: 200;
  url: 2048;
  location: 200;
  description: 20000;
}
