import type { EVENT_PATHS } from '@ks/lib/ui/EventGlyph';
import type { LEGEND_ROWS } from '@ks/lib/ui/legend.mts';

export type ContestedYears = { from: number; to: number };

export type Epoch = { label?: string; year: number };

export type EventType = keyof typeof EVENT_PATHS;

/** A row of the Legend: the recorded border, the dashed border, the hatch, the halo or the Event glyphs. */
export type LegendRow = (typeof LEGEND_ROWS)[number];
