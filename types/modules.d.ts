// These packages ship no types. Only the parts KinScape calls are declared.

declare module '*/eslint.config.mjs' {
  import type { Linter } from 'eslint';

  const config: Linter.Config[];

  export default config;
}

declare module 'fontnik' {
  const fontnik: {
    range: (
      options: { end: number; font: Uint8Array; start: number },
      callback: (error: Error | null, glyphs: Uint8Array) => void
    ) => void;
  };

  export default fontnik;
}

declare module 'jsdom' {
  export type DOMWindow = Window &
    typeof globalThis & {
      close: () => void;
      eval: (script: string) => unknown;
    };

  export class JSDOM {
    window: DOMWindow;
    constructor(
      html: string,
      options: { runScripts: 'outside-only'; virtualConsole: VirtualConsole }
    );
  }

  export class VirtualConsole {
    on: (kind: string, listener: (message: unknown) => void) => this;
  }
}

declare module 'mapshaper' {
  const mapshaper: {
    applyCommands: (
      commands: string,
      input: Record<string, string | Uint8Array>
    ) => Promise<Record<string, string | Uint8Array>>;
  };

  export default mapshaper;
}

declare module 'polylabel' {
  const polylabel: (polygon: number[][][], precision?: number) => number[];

  export default polylabel;
}
