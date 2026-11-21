/**
 * The error of a response that is not OK. `label` names the route in the message. Its `status` lets
 * the retry rule of `QueryProvider` skip a 401 or a 404.
 */
export const requestError = (label: string, status: number) =>
  Object.assign(new Error(`${label} request failed: ${status}`), { status });
