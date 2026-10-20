// These packages ship no types. Only the parts KinScape calls are declared.

declare module 'fontnik' {
  const fontnik: {
    range: (
      options: { end: number; font: Uint8Array; start: number },
      callback: (error: Error | null, glyphs: Uint8Array) => void
    ) => void;
  };

  export default fontnik;
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
