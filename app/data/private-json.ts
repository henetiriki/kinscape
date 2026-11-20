/**
 * A JSON response that no cache keeps (NFR-03). `privateJson()` sets the header after the caller's
 * init, so a caller header cannot replace it.
 */
export const privateJson = (body: unknown, init?: ResponseInit): Response => {
  const response = Response.json(body, init);

  response.headers.set('Cache-Control', 'private, no-store');

  return response;
};
