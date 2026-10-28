import type { EVENT_PATHS } from '@ks/lib/ui/EventGlyph';

export type ContestedYears = { from: number; to: number };

export type Epoch = { label?: string; year: number };

export type EventType = keyof typeof EVENT_PATHS;
