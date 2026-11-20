/** The most times a failed query repeats. */
const MAX_RETRIES = 3;

/** The statuses that give the same answer again: an ended session and a missing record. */
const NO_RETRY = new Set([401, 404]);

/**
 * Whether a failed query repeats, for every query of the app. A fetcher gives its error a `status`.
 * A 401 or a 404 shows the error state at once. Any other failure, such as a 5xx answer or a
 * dropped connection, repeats up to `MAX_RETRIES` times.
 */
export const retryQuery = (
  failureCount: number,
  error: { status?: number } & Error
): boolean =>
  failureCount < MAX_RETRIES &&
  !(error.status !== undefined && NO_RETRY.has(error.status));
