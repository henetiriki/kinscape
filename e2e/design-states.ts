import type { Page } from '@playwright/test';

/** Puts the page in the state a screen in `design/screens.json` names, before the screenshot. */
export const states: Record<string, (page: Page) => Promise<void>> = {
  'kit-menu-open': async page => {
    await page.getByRole('button', { name: 'Boards' }).click();
    // The sheet has slid in once its animation is done.
    await page
      .getByRole('dialog', { name: 'Boards' })
      .evaluate(node =>
        Promise.all(node.getAnimations().map(animation => animation.finished))
      );
  },
};
