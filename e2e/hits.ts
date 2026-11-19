import type { Locator } from '@playwright/test';

// The point 21px from a control's centre is still on the control: a 44px hit area.
// A control at the edge of the viewport has its point outside it, so the page scrolls the point into view.
export const hitsControl = async (control: Locator, dx: number, dy: number) => {
  await control.scrollIntoViewIfNeeded();

  const box = (await control.boundingBox())!;

  return control.evaluate(
    (node, point) => {
      const before = window.scrollY;

      window.scrollBy(
        0,
        point.y < 0 ? point.y : Math.max(point.y - window.innerHeight + 1, 0)
      );

      const hit = document.elementFromPoint(
        point.x,
        point.y - (window.scrollY - before)
      );

      return hit !== null && (node === hit || node.contains(hit));
    },
    { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy }
  );
};
