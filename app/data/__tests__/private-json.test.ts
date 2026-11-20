import { describe, expect, it } from 'vitest';

import { privateJson } from '@ks/app/data/private-json';

// NFR-03. A response with Tree data has `private, no-store`, and a caller cannot change it.
describe('privateJson', () => {
  it('sends a JSON body that no cache keeps', async () => {
    const response = privateJson({ a: 1 });

    expect(await response.json()).toEqual({ a: 1 });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });

  it('keeps the status and drops a caller header for Cache-Control', () => {
    const response = privateJson(
      {},
      { headers: { 'Cache-Control': 'public' }, status: 404 }
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
