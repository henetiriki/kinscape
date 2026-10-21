import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        // Headless Chromium has no GPU; MapLibre needs software WebGL.
        launchOptions: {
          args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
        },
      },
    },
  ],
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run build && npm run start',
    env: { NEXT_PUBLIC_E2E: '1' },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    url: 'http://localhost:3000',
  },
});
