import type { DOMWindow } from 'jsdom';
import type { ReactElement } from 'react';
import type * as React from 'react';
import type * as ReactDOM from 'react-dom';

import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { standInDom } from '@ks/__tests__/dom-stand-ins';
import {
  CASES,
  COMPONENTS,
  rebuild,
  registerConsoleChecks,
  slotted,
} from '@ks/lib/design/__tests__/react-18-cases';
import { CONTROLS } from '@ks/lib/design/bundle.mts';
import { CARDS } from '@ks/lib/design/states.mts';
import { run } from '@ks/scripts/design-system.mts';

registerConsoleChecks();

describe('bundle', () => {
  const read = (path: string) => readFileSync(path, 'utf8');
  const problems: string[] = [];
  let out: string;
  let page: DOMWindow;

  beforeAll(async () => {
    out = mkdtempSync(join(tmpdir(), 'react-18-bundle-'));
    await run('.', out);

    const virtualConsole = new VirtualConsole();

    for (const kind of ['error', 'jsdomError', 'warn'] as const) {
      virtualConsole.on(kind, (message: unknown) =>
        problems.push(`${kind}: ${String(message)}`)
      );
    }

    // A blank page with React 18 and the stylesheet, as the Design System type gives a preview.
    const dom = new JSDOM('<!doctype html><div id="root"></div>', {
      runScripts: 'outside-only',
      virtualConsole,
    });

    page = dom.window;
    standInDom(page);
    page.document.head.innerHTML = `<style>${read(join(out, 'project/components/bundle.css'))}</style>`;
    page.eval(read('node_modules/react-18/umd/react.development.js'));
    page.eval(read('node_modules/react-dom-18/umd/react-dom.development.js'));
    page.eval(read(join(out, 'project/components/bundle.js')));
  }, 120_000);

  afterAll(() => {
    page.close();
    rmSync(out, { force: true, recursive: true });
  });

  it('puts every control on window.KinScape', () => {
    expect(
      Object.keys((page as unknown as { KinScape: object }).KinScape).toSorted()
    ).toEqual(CONTROLS.map(({ name }) => name).toSorted());
    expect(CONTROLS.map(({ name }) => name).toSorted()).toEqual(
      Object.keys(COMPONENTS).toSorted()
    );
    expect(problems).toEqual([]);
  });

  it.each(Object.entries(COMPONENTS))(
    '%s mounts with the props of its first case',
    (name, component) => {
      const first = CASES.find(([, element]) => element.type === component);
      const {
        KinScape,
        React: pageReact,
        ReactDOM: pageDom,
      } = page as unknown as {
        KinScape: Record<string, unknown>;
        React: typeof React;
        ReactDOM: typeof ReactDOM & {
          createRoot: (node: Element) => {
            render: (el: unknown) => void;
            unmount: () => void;
          };
        };
      };
      const root = page.document.createElement('div');
      const reactRoot = pageDom.createRoot(root);

      page.document.body.append(root);
      pageDom.flushSync(() =>
        reactRoot.render(
          pageReact.createElement(
            KinScape[name] as never,
            Object.fromEntries(
              Object.entries(
                (first as [string, ReactElement])[1].props as object
              ).map(([prop, each]) => [
                prop,
                rebuild(each, pageReact, KinScape),
              ])
            ) as never
          )
        )
      );
      expect(root.innerHTML).not.toBe('');
      pageDom.flushSync(() => reactRoot.unmount());
      expect(problems).toEqual([]);
    }
  );

  describe('previews', () => {
    const noFunctions = (props: object) =>
      Object.fromEntries(
        Object.entries(props)
          .filter(([, value]) => typeof value !== 'function')
          .map(([key, value]) => [key, slotted(value)])
      );

    it.each(CARDS.map(card => [card.name, card] as const))(
      '%s lists the cases of this file, with the same props',
      (name, card) => {
        const cases = CASES.filter(
          ([, element]) =>
            element.type === COMPONENTS[name as keyof typeof COMPONENTS]
        );

        expect(card.states.map(({ label }) => label)).toEqual(
          cases.map(([label]) => label)
        );
        expect(
          card.states.map(({ children, props, slots }) => ({
            ...props,
            ...slots,
            children,
          }))
        ).toEqual(
          cases.map(([, element]) => noFunctions(element.props as object))
        );
      }
    );

    it.each(CARDS.map(card => [card.name, card] as const))(
      '%s preview mounts every state with no error',
      (name, card) => {
        const html = read(
          join(out, 'project/components', name, 'preview.html')
        );
        const script = /<script>([\s\S]*)<\/script>/i.exec(html)![1];

        page.document.body.innerHTML = '<div id="root"></div>';
        page.eval(script);
        expect(
          [...page.document.querySelectorAll('figcaption')].map(
            caption => caption.textContent
          )
        ).toEqual(card.states.map(({ label }) => label));
        // A control can render a fragment, so a state holds one element or more.

        const figures = [...page.document.querySelectorAll('figure')];

        expect(figures).toHaveLength(card.states.length);
        expect(
          figures.filter(
            figure => figure.querySelector(':scope > :not(figcaption)') === null
          )
        ).toEqual([]);
        expect(
          [...page.document.querySelectorAll('[aria-labelledby]')].filter(
            each =>
              !page.document.getElementById(
                each.getAttribute('aria-labelledby')!
              )
          )
        ).toEqual([]);
        expect(
          [...page.document.querySelectorAll('[role="radiogroup"]')]

            .map(group => group.querySelectorAll('input:checked').length)
            .filter(checked => checked !== 1)
        ).toEqual([]);
        // A card with a radio sets `radios`, so each state is its own radio group.
        expect(
          page.document.querySelector('input[type="radio"]') !== null
        ).toBe(card.radios === true);

        for (const form of page.document.querySelectorAll('form')) {
          const submit = new page.Event('submit', {
            bubbles: true,
            cancelable: true,
          });

          form.dispatchEvent(submit);
          expect(submit.defaultPrevented).toBe(true);
        }

        // A click reaches the control's handler. A missing one throws in the page.

        for (const box of page.document.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]'
        )) {
          box.click();
        }

        // A click on a sheet grabber reaches `onExpandedChange`. In a `DateDock` state it is a key of the object prop `sheet`.

        for (const grabber of page.document.querySelectorAll<HTMLButtonElement>(
          'button[aria-label="Expand the sheet"]'
        )) {
          grabber.click();
        }

        expect(problems).toEqual([]);
      }
    );
  });
});
