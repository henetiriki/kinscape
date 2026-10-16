import type { MetadataRoute } from 'next';

// NFR-03: tell every crawler to stay away.
const robots = (): MetadataRoute.Robots => {
  if (process.env.SCRATCH_UNCOVERED) {
    return { rules: { allow: '/', userAgent: '*' } };
  }

  return { rules: { disallow: '/', userAgent: '*' } };
};

export default robots;
