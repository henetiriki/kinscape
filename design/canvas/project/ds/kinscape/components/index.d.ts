import type { ComponentProps, ReactNode } from 'react';

export type ChipOption = {
    /** The Event type this chip filters on; its glyph leads the label. */
    glyph?: EventType;
    label: string;
    value: string;
};
export type Segment = {
    label: string;
    state?: ControlState;
    value: string;
};
export type Tab = {
    /** The id of the tabpanel this tab shows; the panel belongs to the screen. */
    controls?: string;
    /** How many choices are active in the panel; shown as a badge when above 0. */
    count?: number;
    label: string;
    state?: ControlState;
    value: string;
};

declare const PATHS: {
    alert: import("react").JSX.Element;
    back: import("react").JSX.Element;
    chevronDown: import("react").JSX.Element;
    close: import("react").JSX.Element;
    cloudOff: import("react").JSX.Element;
    copy: import("react").JSX.Element;
    document: import("react").JSX.Element;
    done: import("react").JSX.Element;
    error: import("react").JSX.Element;
    export: import("react").JSX.Element;
    eye: import("react").JSX.Element;
    eyeOff: import("react").JSX.Element;
    fit: import("react").JSX.Element;
    forward: import("react").JSX.Element;
    info: import("react").JSX.Element;
    layers: import("react").JSX.Element;
    menu: import("react").JSX.Element;
    place: import("react").JSX.Element;
    play: import("react").JSX.Element;
    search: import("react").JSX.Element;
    signOut: import("react").JSX.Element;
    success: import("react").JSX.Element;
    warning: import("react").JSX.Element;
    zoomIn: import("react").JSX.Element;
    zoomOut: import("react").JSX.Element;
};
declare const MARKS: {
    error: string;
    info: string;
    success: string;
    warning: string;
};
/** A decorative icon (18px unless sized) in the current colour; the words beside it carry the meaning. */
declare const Icon: ({ name, size, }: {
    name: IconName;
    size?: IconSize;
}) => import("react").JSX.Element;
/** The 20px form for alerts: a disc in the current colour with a white mark. */
declare const FilledIcon: ({ name }: {
    name: FilledIconName;
}) => import("react").JSX.Element;

/** A state the design kit shows without the pointer or keyboard; the real states come from the browser. */
export type ControlState = 'active' | 'focus' | 'hover';
export type FilledIconName = keyof typeof MARKS;
export type Heading = 'display' | 'h1' | 'h2' | 'h3';
export type IconName = keyof typeof PATHS;
export type IconSize = 14 | 16 | 18 | 20 | 24 | 28;
export type Other = 'body' | 'bodyL' | 'button' | 'buttonS' | 'caption' | 'chip' | 'chipOff' | 'control' | 'credits' | 'h1Phone' | 'label' | 'link' | 'linkS' | 'mono' | 'monoL' | 'overline' | 'small' | 'title';
export type SurfaceLevel = 'floating' | 'modal' | 'raised' | 'sheet';
export type TextVariant = Heading | Other;
export type Tone = 'error' | 'info' | 'warning';

/** A one-click way out of a problem: the day to go to, shown at `precision`. */
export type Fix = {
    day: number;
    label: string;
    precision: Precision;
};
export type Precision = 'day' | 'month' | 'year';
export type Problem = {
    fix?: Fix;
    message: string;
};
/** A run of days with a Boundary version. `validTo` is exclusive; null = still current. */
export type Span = {
    validFrom: number;
    validTo: null | number;
};

/** Each Event type's path, copied from design/source/kse-*.svg (DESIGN.md › Event glyphs). A test keeps them in step. */
declare const EVENT_PATHS: {
    readonly baptism: "M2.5 16.18V12.8Q2.5 10.49 3.77 9.15Q5.04 7.81 7.26 7.81Q8.84 7.81 9.91 8.47Q10.97 9.12 11.78 10.07Q12.59 11.02 13.31 11.99Q14.03 12.96 14.89 13.61Q15.75 14.26 16.96 14.26Q18.13 14.26 18.79 13.45Q19.44 12.64 19.44 11.2V7.82H21.5V11.2Q21.5 13.56 20.3 14.87Q19.09 16.19 16.96 16.19Q15.33 16.19 14.23 15.53Q13.12 14.88 12.31 13.91Q11.5 12.94 10.78 11.99Q10.05 11.04 9.24 10.39Q8.43 9.74 7.26 9.74Q6 9.74 5.28 10.55Q4.56 11.36 4.56 12.8V16.18Z";
    readonly birth: "M17.38 21.8 13.66 16.61Q13.37 16.2 13.08 15.75Q12.8 15.3 12.51 14.77Q12.23 14.24 11.96 13.68L13.03 12.95Q13.48 13.36 13.89 13.78Q14.3 14.2 14.66 14.62Q15.02 15.04 15.3 15.45L19.02 20.63ZM6.66 21.8 5.01 20.63 8.73 15.45Q9.02 15.04 9.38 14.61Q9.73 14.19 10.14 13.77Q10.56 13.36 11 12.95L12.08 13.68Q11.8 14.24 11.52 14.77Q11.24 15.3 10.95 15.75Q10.67 16.2 10.38 16.61ZM11.26 13.1Q10.65 12.99 10.07 12.88Q9.48 12.77 8.95 12.62Q8.42 12.46 7.97 12.3L2 10.13L2.69 8.23L8.66 10.4Q9.14 10.56 9.63 10.79Q10.12 11.01 10.65 11.29Q11.18 11.57 11.69 11.9ZM12 13.8Q11.55 13.8 11.24 13.49Q10.92 13.17 10.92 12.73Q10.92 12.24 11.24 11.95Q11.55 11.65 12 11.65Q12.48 11.65 12.78 11.95Q13.08 12.24 13.08 12.73Q13.08 13.17 12.78 13.49Q12.48 13.8 12 13.8ZM11.36 11.92Q11.18 10.99 11.09 10.18Q11 9.36 11 8.6V2.2H13V8.6Q13 9.33 12.92 10.16Q12.85 10.99 12.64 11.92ZM12.74 13.1 12.31 11.9Q12.83 11.57 13.35 11.29Q13.88 11.01 14.38 10.79Q14.89 10.56 15.34 10.4L21.31 8.23L22 10.13L16.03 12.3Q15.58 12.46 15.05 12.62Q14.52 12.77 13.95 12.88Q13.38 12.99 12.74 13.1Z";
    readonly burial: "M9 2 L15 2 L18 7.40 L15.36 22 L8.64 22 L6 7.40 Z";
    readonly death: "M11.01 22V8.64H7.31V6.87H11.01V2H12.99V6.87H16.69V8.64H12.99V22Z";
    readonly divorce: "M4.05 21.86 17.69 2.14H19.95L6.31 21.86ZM15.98 22Q14.21 22 13.17 21.01Q12.13 20.03 12.13 18.35V16.59Q12.11 14.92 13.16 13.93Q14.21 12.95 15.98 12.95Q17.76 12.95 18.8 13.93Q19.84 14.92 19.84 16.59V18.35Q19.84 20.03 18.8 21.01Q17.76 22 15.98 22ZM15.99 20Q16.73 20 17.17 19.56Q17.61 19.12 17.61 18.35V16.59Q17.61 15.82 17.17 15.37Q16.73 14.92 15.96 14.92Q15.24 14.92 14.8 15.37Q14.36 15.82 14.35 16.59V18.35Q14.33 19.12 14.78 19.56Q15.22 20 15.99 20ZM7.99 11.05Q6.21 11.05 5.17 10.07Q4.13 9.08 4.16 7.41V5.65Q4.13 3.97 5.18 2.99Q6.22 2 7.99 2Q9.77 2 10.81 2.99Q11.85 3.97 11.87 5.65V7.41Q11.87 9.08 10.83 10.07Q9.79 11.05 7.99 11.05ZM8.01 9.08Q8.76 9.08 9.2 8.63Q9.64 8.18 9.65 7.41V5.65Q9.65 4.87 9.21 4.42Q8.77 3.97 8.02 3.97Q7.28 3.97 6.84 4.42Q6.4 4.87 6.39 5.65V7.41Q6.39 8.18 6.82 8.63Q7.26 9.08 8.01 9.08Z";
    readonly land: "M5 5H19V19H5ZM7 7V17H17V7Z";
    readonly marriage: "M6.84 18.64Q4.63 18.64 3.31 17.24Q2 15.84 2 13.44V10.56Q2 8.16 3.38 6.76Q4.76 5.36 7.07 5.36Q9.03 5.36 10.27 6.44Q11.5 7.53 12.16 9.38H12.27Q12.51 8.49 13.12 7.57Q13.73 6.65 14.75 6Q15.77 5.36 17.16 5.36Q19.37 5.36 20.69 6.76Q22 8.16 22 10.56V13.44Q22 15.84 20.63 17.24Q19.26 18.64 16.93 18.64Q14.97 18.64 13.78 17.56Q12.6 16.47 11.95 14.62H11.83Q11.59 15.47 10.94 16.41Q10.29 17.35 9.28 18Q8.26 18.64 6.84 18.64ZM7.19 16.75Q8.12 16.75 8.82 16.37Q9.52 15.99 10.01 15.37Q10.5 14.76 10.81 14.06Q11.13 13.36 11.25 12.7L10.08 9.67Q9.07 7.25 7.19 7.25Q5.85 7.25 5.01 8.15Q4.18 9.06 4.18 10.56V13.44Q4.18 14.94 5.01 15.85Q5.85 16.75 7.19 16.75ZM16.81 16.75Q18.17 16.75 19 15.85Q19.82 14.94 19.82 13.44V10.56Q19.82 9.06 19 8.15Q18.17 7.25 16.81 7.25Q15.9 7.25 15.19 7.63Q14.48 8.01 13.99 8.63Q13.5 9.24 13.19 9.94Q12.87 10.64 12.75 11.3L13.92 14.33Q14.41 15.52 15.14 16.13Q15.88 16.75 16.81 16.75Z";
    readonly occupation: "M4 20.37 12 4.63 20 20.37Z";
    readonly other: "M12 19Q8.97 19 6.98 17.02Q5 15.03 5 12Q5 8.91 6.98 6.95Q8.97 5 12 5Q15.09 5 17.05 6.95Q19 8.91 19 12Q19 15.03 17.05 17.02Q15.09 19 12 19Z";
    readonly residence: "M6 18V6H18V18Z";
};
/** The order Event types are listed in, everywhere. */
declare const EVENT_ORDER: EventType[];
/** An Event type's glyph, 1em square in `--pin`. Decorative: the Event's name sits beside it. */
declare const EventGlyph: ({ event }: {
    event: EventType;
}) => import("react").JSX.Element;

export type ContestedYears = {
    from: number;
    to: number;
};
export type Epoch = {
    label?: string;
    year: number;
};
export type EventType = keyof typeof EVENT_PATHS;

type Base = {
    /** Fills the width of its container. */
    full?: boolean;
    /** A leading icon, or the only content of an icon-only Button. */
    icon?: IconName;
    /** Fully round, as Play. */
    round?: boolean;
    /** Heights 50, 44, 40 and 36. */
    size?: 'l' | 'm' | 's' | 'xs';
    state?: ControlState;
    variant?: 'primary' | 'secondary';
} & Omit<ComponentProps<'button'>, 'aria-label' | 'children' | 'className'>;
type Content = {
    children: ReactNode;
    label?: string;
} | {
    children?: never;
    icon: IconName;
    label: string;
};
/** An action: primary for the one main action in a view, secondary for the rest. */
export declare const Button: ({ children, full, icon, label, round, size, state, variant, ...rest }: Base & Content) => import("react").JSX.Element;
export type ButtonProps = Parameters<typeof Button>[0];

/** An action shown only as an icon, such as zoom, close or step, named by its `label`. */
export declare const IconButton: ({ label, state, ...rest }: {
    label: string;
    state?: ControlState;
} & Omit<ComponentProps<"button">, "aria-label" | "className">) => import("react").JSX.Element;
export type IconButtonProps = Parameters<typeof IconButton>[0];

/** A pill that turns one filter on or off, such as an Event type. */
export declare const Chip: ({ children, glyph, on, state, ...rest }: {
    /** The Event type this chip filters on; its glyph leads the label. */
    glyph?: EventType;
    on: boolean;
    state?: ControlState;
} & Omit<ComponentProps<"button">, "aria-pressed" | "className">) => import("react").JSX.Element;
/** A chosen value with a × that removes it. The × is 26px with a 44px hit area. */
declare const RemovableChip: ({ disabled, onRemove, state, value, }: {
    disabled?: boolean;
    onRemove?: () => void;
    /** Shown on the ×, the control inside. */
    state?: ControlState;
    value: string;
}) => import("react").JSX.Element;
export type ChipProps = Parameters<typeof Chip>[0];

/** A labelled set of toggle chips that wraps. */
export declare const ChipGroup: ({ label, onToggle, options, selected, }: {
    label: string;
    onToggle: (value: string) => void;
    options: ChipOption[];
    selected: string[];
}) => import("react").JSX.Element;
export type ChipGroupProps = Parameters<typeof ChipGroup>[0];

/** One choice from a few, as radios: the arrow keys move the choice. */
export declare const Segmented: ({ disabled, label, name, onChange, options, value, }: {
    disabled?: boolean;
    label: string;
    name: string;
    onChange?: (value: string) => void;
    options: Segment[];
    value: string;
}) => import("react").JSX.Element;
export type SegmentedProps = Parameters<typeof Segmented>[0];

/** A row of tabs that switches panels, such as Layers and Filters. */
export declare const Tabs: ({ disabled, fill, label, onSelect, selected, tabs, }: {
    disabled?: boolean;
    /** The tabs share the row, 44 tall (a phone sheet head). */
    fill?: boolean;
    label: string;
    onSelect?: (value: string) => void;
    selected: string;
    tabs: Tab[];
}) => import("react").JSX.Element;
export type TabsProps = Parameters<typeof Tabs>[0];

/** A single-line field with its label and, below it, helper text or an error that replaces it. */
export declare const TextField: ({ date, defaultShown, error, helper, hideLabel, label, mark, shortcut, size, state, type, ...rest }: {
    /** The map date look: 188px wide, mono, centred. `fill` takes the width of its container instead. */
    date?: "fill" | boolean;
    /** A password starts shown, as text. */
    defaultShown?: boolean;
    /** The problem, shown under the field in place of `helper`. Marks the field as in error. */
    error?: ReactNode;
    helper?: ReactNode;
    /** Names the input without showing the label. */
    hideLabel?: boolean;
    label: string;
    /** Marks the field when its message is shown elsewhere, or as a warning. */
    mark?: "error" | "warning";
    /** A key that focuses the field when no text input has focus. A search field shows it as a hint. */
    shortcut?: string;
    /** `l` is the 48px sign-in field. */
    size?: "l";
    state?: ControlState;
    type?: "email" | "password" | "search" | "text";
} & Omit<ComponentProps<"input">, "className" | "id" | "size" | "type">) => import("react").JSX.Element;
export type TextFieldProps = Parameters<typeof TextField>[0];

/** A checkbox with no label of its own: name it with `aria-label`, or use `CheckboxField`. */
export declare const Checkbox: ({ state, ...rest }: {
    state?: ControlState;
} & Omit<ComponentProps<"input">, "className" | "type">) => import("react").JSX.Element;
export type CheckboxProps = Parameters<typeof Checkbox>[0];

/** A checkbox with its label and, under it, an optional description the checkbox points to. */
export declare const CheckboxField: ({ description, label, plain, size, state, ...rest }: {
    /** Plain text under the label. It is not a live region. */
    description?: ReactNode;
    label: ReactNode;
    /** The sign-in form: a 15 / 22 label in ink-2 and no description. */
    plain?: boolean;
    /** `m` is a 44 row (Basemap and Pins); the default is 48 (Boundaries). */
    size?: "m";
    state?: ControlState;
} & Omit<ComponentProps<"input">, "aria-describedby" | "className" | "id" | "size" | "type">) => import("react").JSX.Element;
export type CheckboxFieldProps = Parameters<typeof CheckboxField>[0];

type Notice = {
    text: string;
    tone: Extract<Tone, 'info' | 'warning'>;
};
/**
 * The typed Map date. It checks on Enter or when focus leaves, never while typing.
 * A bad date stays in the field with its problem until the next check; Esc puts the last good date back.
 */
export declare const DateField: ({ after, before, day, defaultText, fill, keepPrecision, max, min, notice, onChange, placement, precision, state, }: {
    /** Beside the field on the right: the step forward button. */
    after?: ReactNode;
    /** Beside the field on the left: the step back button. */
    before?: ReactNode;
    /** The last good date: what the map shows. */
    day: number;
    /** Text to start with instead of the date; it is checked on the first render, unless `state` is `focus`. */
    defaultText?: string;
    /** The field takes the width the row leaves, as in the phone date sheet. */
    fill?: boolean;
    /** A typed date or a fix commits at the field's precision, never a finer one. */
    keepPrecision?: boolean;
    /** The last Map date: today. */
    max: number;
    /** The first Map date. */
    min: number;
    /** Something the app did, shown while it is passed; the caller clears it. */
    notice?: Notice;
    onChange: (day: number, precision: Precision) => void;
    /** `above` opens the message over the field, for the dock at the bottom of the screen. */
    placement?: "above" | "below";
    precision: Precision;
    state?: ControlState;
}) => import("react").JSX.Element;
export type DateFieldProps = Parameters<typeof DateField>[0];

/** A problem or note about one part of the screen. An error is announced at once; the rest politely. */
export declare const Alert: ({ aside, children, title, tone, }: {
    /** A note at the right of the title line. */
    aside?: ReactNode;
    children: ReactNode;
    title?: string;
    tone: FilledIconName;
}) => import("react").JSX.Element;
export type AlertProps = Parameters<typeof Alert>[0];

/**
 * The result of an action. A success toast asks to be removed after 4 seconds; an error stays until Esc,
 * its action, or the owner calls `onDismiss`. The owner removes the toast.
 */
export declare const Toast: ({ action, children, onAction, onDismiss, placed, tone, }: {
    action?: string;
    children: string;
    onAction?: () => void;
    onDismiss?: () => void;
    /** Fix it at its phone position, above the date sheet. */
    placed?: boolean;
    tone: "error" | "success";
}) => import("react").JSX.Element;
export type ToastProps = Parameters<typeof Toast>[0];

export {};
