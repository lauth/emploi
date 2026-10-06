/** A page of a list endpoint using offset pagination. */
export interface Page<T> {
  items: T[];
  /** Number of items across all pages. */
  total: number;
  limit: number;
  offset: number;
}

/** Direction of a sort. */
export type SortOrder = 'asc' | 'desc';

/** Query parameters of a list endpoint using offset pagination. */
export interface PageQuery {
  /** 1 to 100, default 20. */
  limit?: number;
  /** Default 0. */
  offset?: number;
}
