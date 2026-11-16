import type { Locator } from '@playwright/test';

// The point 21px from a control's centre is still on the control: a 44px hit area.
export const hitsControl = async (control: Locator, dx: number, dy: number) => {
  await control.scrollIntoViewIfNeeded();

  const box = (await control.boundingBox())!;

  return control.evaluate(
    (node, point) => {
      const hit = document.elementFromPoint(point.x, point.y);

      return hit !== null && (node === hit || node.contains(hit));
    },
    { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy }
  );
};
