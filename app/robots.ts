import type { MetadataRoute } from 'next';

// NFR-03: tell every crawler to stay away.
const robots = (): MetadataRoute.Robots => ({
  rules: { disallow: '/', userAgent: '*' },
});

export default robots;
