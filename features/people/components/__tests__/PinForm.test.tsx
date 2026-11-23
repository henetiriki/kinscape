import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { QueryProvider } from '@ks/app/QueryProvider';
import {
  EVENT_OPTIONS,
  PRECISION_OPTIONS,
} from '@ks/features/people/components/pin-messages.ts';
import { PinForm } from '@ks/features/people/components/PinForm';
import { parsePlaceId } from '@ks/lib/domain/ids/ids.mts';
import { EVENT_TYPES } from '@ks/lib/domain/pins/schemas.mts';
import { PLACE_PRECISIONS } from '@ks/lib/domain/places/schemas.mts';

// PIN-01, PIN-02, PIN-04, NFR-03. Data is synthetic.
const PERSON = {
  born: '1861',
  bornReading: 'In 1861',
  deceased: false,
  died: '1932',
  diedReading: 'In 1932',
  givenNames: 'Maria Magdalena',
  id: '01900000-0000-7000-8000-0000000000a1',
  maidenName: '',
  surname: 'du Toit',
  variants: [],
};

const fetchStub = vi.fn();

const setup = (
  props: Partial<Parameters<typeof PinForm>[0]> = {},
  people: unknown = [PERSON]
) => {
  fetchStub.mockImplementation(async () => Response.json(people));

  const handlers = {
    onCancel: vi.fn(),
    onSave: vi.fn(async () => ({ ok: true })),
    onSaved: vi.fn(),
    ...props,
  };

  render(
    <QueryProvider>
      <PinForm {...handlers} />
    </QueryProvider>
  );

  return handlers;
};

const POINT = { latitude: -28.74, longitude: 25.31 };
const NEXT_POINT = { latitude: -33.93, longitude: 18.42 };

const coordinates = () =>
  (screen.getByLabelText('Coordinates') as HTMLInputElement).value;

const ready = () => screen.findByRole('combobox', { name: 'Person' });

const fill = async (over: Record<string, string> = {}) => {
  const person = await ready();

  fireEvent.change(person, { target: { value: 'Maria' } });
  fireEvent.keyDown(person, { key: 'ArrowDown' });
  fireEvent.keyDown(person, { key: 'Enter' });
  fireEvent.change(screen.getByLabelText('Event type'), {
    target: { value: over.eventType ?? 'residence' },
  });
  fireEvent.change(screen.getByLabelText('Date'), {
    target: { value: over.date ?? 'FROM 1840 TO 1855' },
  });
  fireEvent.change(screen.getByLabelText('Coordinates'), {
    target: { value: over.coordinates ?? '-33.93, 18.42' },
  });
  fireEvent.change(screen.getByLabelText('Address as recorded'), {
    target: { value: over.address ?? 'Farm Example, district Example' },
  });
};

const save = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

beforeEach(() => {
  fetchStub.mockReset();
  vi.stubGlobal('fetch', fetchStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderWithPoint = (point?: typeof POINT) => {
  fetchStub.mockImplementation(async () => Response.json([PERSON]));

  const props = { onCancel: vi.fn(), onSave: vi.fn(), onSaved: vi.fn() };
  const form = (at?: typeof POINT) => (
    <QueryProvider>
      <PinForm {...props} point={at} />
    </QueryProvider>
  );
  const { rerender } = render(form(point));

  return (at?: typeof POINT) => rerender(form(at));
};

// PIN-01
it('shows the point in the coordinates field with 6 decimals, latitude first', async () => {
  renderWithPoint(POINT);
  await ready();
  expect(coordinates()).toBe('-28.740000, 25.310000');
});

// PIN-01
it('leaves the coordinates field empty when there is no point', async () => {
  renderWithPoint();
  await ready();
  expect(coordinates()).toBe('');
});

// PIN-01
it('changes only the coordinates when a new point arrives', async () => {
  const change = renderWithPoint(POINT);

  await fill({ address: 'Farm Example' });
  change(NEXT_POINT);
  expect(coordinates()).toBe('-33.930000, 18.420000');
  expect((screen.getByLabelText('Event type') as HTMLSelectElement).value).toBe(
    'residence'
  );
  expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe(
    'FROM 1840 TO 1855'
  );
  expect(
    (screen.getByLabelText('Address as recorded') as HTMLInputElement).value
  ).toBe('Farm Example');
});

// PIN-01
it('keeps typed coordinates when the point goes away, and lets the user type over a point', async () => {
  const change = renderWithPoint(POINT);

  await ready();
  fireEvent.change(screen.getByLabelText('Coordinates'), {
    target: { value: '-30, 20' },
  });
  expect(coordinates()).toBe('-30, 20');
  change(undefined);
  expect(coordinates()).toBe('-30, 20');
});

const PLACE = {
  id: parsePlaceId('01900000-0000-7000-a000-0000000000c1')!,
  latitude: -29.12,
  longitude: 26.21,
  precision: 'farm',
} as const;

// PIN-01, PIN-06
it('fixes the point and the precision of an existing Place', async () => {
  setup({ place: PLACE });
  await ready();

  const field = screen.getByLabelText('Coordinates') as HTMLInputElement;
  const precision = screen.getByLabelText('Precision') as HTMLSelectElement;

  expect(field.value).toBe('-29.120000, 26.210000');
  expect(field.disabled).toBe(true);
  screen.getByText('This Place is fixed. You cannot change its point.');
  expect(precision.value).toBe('farm');
  expect(precision.disabled).toBe(true);
  screen.getByText('This is the precision of the Place.');
});

// PIN-01, PIN-06
it('saves a Pin with the existing Place and sends no coordinates', async () => {
  const onSave = vi.fn<(input: unknown) => Promise<{ ok: boolean }>>(
    async () => ({ ok: true })
  );
  const { onSaved } = setup({ onSave, place: PLACE });

  await fill({ coordinates: '' });
  save();
  await waitFor(() => expect(onSaved).toHaveBeenCalled());

  const sent = onSave.mock.calls[0]![0] as { place: Record<string, unknown> };

  expect(sent.place).toEqual({ id: PLACE.id, kind: 'existing' });
});

it('lists the Event types of the schema, after the empty choice', () => {
  expect(EVENT_OPTIONS.slice(1).map(({ value }) => value)).toEqual([
    ...EVENT_TYPES,
  ]);
  expect(EVENT_OPTIONS[0]).toEqual({
    label: 'Choose an event type',
    value: '',
  });
});

it('lists the Place precisions of the schema, with no empty choice', () => {
  expect(PRECISION_OPTIONS.map(({ value }) => value).sort()).toEqual(
    [...PLACE_PRECISIONS].sort()
  );
  expect(PRECISION_OPTIONS).toHaveLength(9);
});

it('shows the precision, the sources and the notes after the address', async () => {
  setup();
  await ready();

  const labels = [
    'Person',
    'Event type',
    'Date',
    'Coordinates',
    'Address as recorded',
    'Precision',
    'Sources',
    'Notes',
  ].map(name => screen.getByLabelText(name, { exact: true }));
  const order = Array.from(
    // eslint-disable-next-line testing-library/no-node-access -- the test checks the document order of the fields
    document.querySelectorAll('input, select, textarea')
  ).filter(node => labels.includes(node as HTMLElement));

  expect(order).toEqual(labels);
  expect((screen.getByLabelText('Precision') as HTMLSelectElement).value).toBe(
    'approximate'
  );
  expect(
    (screen.getByLabelText('Precision') as HTMLSelectElement).options
  ).toHaveLength(9);
  expect((screen.getByLabelText('Sources') as HTMLTextAreaElement).rows).toBe(
    2
  );
  expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).rows).toBe(2);
});

it('saves the precision, the sources and the notes', async () => {
  const { onSave } = setup();

  await fill();
  fireEvent.change(screen.getByLabelText('Precision'), {
    target: { value: 'farm' },
  });
  fireEvent.change(screen.getByLabelText('Sources'), {
    target: { value: 'Deeds office, 1890' },
  });
  fireEvent.change(screen.getByLabelText('Notes'), {
    target: { value: 'Moved here after the war.' },
  });
  save();

  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(vi.mocked(onSave).mock.calls[0][0]).toMatchObject({
    notes: 'Moved here after the war.',
    place: { kind: 'new', precision: 'farm' },
    sources: 'Deeds office, 1890',
  });
});

it('saves "approximate" when the precision is left alone', async () => {
  const { onSave } = setup();

  await fill();
  save();

  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(vi.mocked(onSave).mock.calls[0][0]).toMatchObject({
    notes: '',
    place: { precision: 'approximate' },
    sources: '',
  });
});

it('shows an error and saves nothing for sources or notes over 10,000 characters', async () => {
  const { onSave } = setup();

  await fill();
  fireEvent.change(screen.getByLabelText('Sources'), {
    target: { value: 'x'.repeat(10_001) },
  });
  fireEvent.change(screen.getByLabelText('Notes'), {
    target: { value: 'y'.repeat(10_001) },
  });
  save();

  expect(
    await screen.findAllByText('Use 10,000 characters or fewer.')
  ).toHaveLength(2);
  expect(screen.getByLabelText('Sources').getAttribute('aria-invalid')).toBe(
    'true'
  );
  expect(screen.getByLabelText('Notes').getAttribute('aria-invalid')).toBe(
    'true'
  );
  expect(onSave).not.toHaveBeenCalled();
});

it('shows an error and saves nothing for a precision outside the nine', async () => {
  const { onSave } = setup();

  await fill();

  const precision = screen.getByLabelText('Precision') as HTMLSelectElement;

  precision.add(new Option('Planet', 'planet'));
  fireEvent.change(precision, { target: { value: 'planet' } });
  save();

  await screen.findByText('Choose a precision.');
  expect(precision.getAttribute('aria-invalid')).toBe('true');
  expect(onSave).not.toHaveBeenCalled();
});

it('saves nothing when "Cancel" follows filled fields', async () => {
  const { onCancel, onSave } = setup();

  await fill();
  fireEvent.change(screen.getByLabelText('Sources'), {
    target: { value: 'Deeds office' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
});

it('shows the loading look until the Persons arrive, with the Save button off', async () => {
  fetchStub.mockImplementation(() => new Promise(() => {}));
  render(
    <QueryProvider>
      <PinForm onCancel={vi.fn()} onSave={vi.fn()} onSaved={vi.fn()} />
    </QueryProvider>
  );

  expect(screen.getByRole('heading', { name: 'Add a pin' })).toBeInstanceOf(
    HTMLElement
  );
  expect(screen.getAllByTestId('loading-bar')).toHaveLength(10);
  for (const name of [
    'Address as recorded',
    'Coordinates',
    'Date',
    'Event type',
    'Notes',
    'Person',
    'Precision',
    'Sources',
  ]) {
    screen.getByText(name, { selector: 'label, span' });
  }
  expect(
    screen.getByRole('form', { name: 'Add a pin' }).getAttribute('aria-busy')
  ).toBe('true');
  expect(
    (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled
  ).toBe(true);
  expect(screen.queryByRole('combobox')).toBeNull();
});

it('shows an alert and "Try again" when the Persons do not load, and loads them again', async () => {
  fetchStub.mockResolvedValueOnce(new Response(null, { status: 401 }));
  fetchStub.mockResolvedValue(Response.json([PERSON]));
  render(
    <QueryProvider>
      <PinForm onCancel={vi.fn()} onSave={vi.fn()} onSaved={vi.fn()} />
    </QueryProvider>
  );

  expect((await screen.findByRole('alert')).textContent).toContain(
    "Couldn't load your people"
  );
  expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInstanceOf(
    HTMLElement
  );

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await ready()).toBeInstanceOf(HTMLElement);
  expect(fetchStub).toHaveBeenCalledTimes(2);
});

it('shows the notice with a link to add a person when the Tree has none', async () => {
  setup({}, []);

  const link = await screen.findByRole('link', { name: 'Add a person' });

  expect(link.getAttribute('href')).toBe('/people/new');
  expect(screen.getByText('Add a person before you add a pin.')).toBeInstanceOf(
    HTMLElement
  );
  expect(screen.queryByRole('combobox', { name: 'Person' })).toBeNull();
});

it('shows the person error under the notice when a Tree with no Person is saved', async () => {
  const { onSave } = setup({}, []);

  await screen.findByText('No people yet');
  save();

  expect((await screen.findAllByRole('alert'))[0].textContent).toBe(
    'Choose a person.'
  );
  expect(onSave).not.toHaveBeenCalled();
});

it('shows each field error and saves nothing when the fields are empty', async () => {
  const { onSave } = setup();

  await ready();
  save();

  expect(await screen.findByText('Choose a person.')).toBeInstanceOf(
    HTMLElement
  );
  expect(screen.getByText('Choose an event type.')).toBeInstanceOf(HTMLElement);
  expect(screen.getByText('Enter a date.')).toBeInstanceOf(HTMLElement);
  expect(screen.getByText('Enter the coordinates.')).toBeInstanceOf(
    HTMLElement
  );
  expect(onSave).not.toHaveBeenCalled();
});

it.each([
  [
    '28°44′33″S 25°18′42″E',
    'Use decimal degrees, not degrees, minutes and seconds. For example -33.93, 18.42.',
  ],
  ['Cape Town', 'Use decimal degrees, such as -33.93, 18.42.'],
  ['-95, 18', 'Use decimal degrees, such as -33.93, 18.42.'],
])('shows the coordinate error for "%s"', async (coordinates, message) => {
  const { onSave } = setup();

  await fill({ coordinates });
  save();

  expect(await screen.findByText(message)).toBeInstanceOf(HTMLElement);
  expect(onSave).not.toHaveBeenCalled();
});

it('shows the error of a date that does not read, and of an address over 500 characters', async () => {
  const { onSave } = setup();

  await fill({ address: 'x'.repeat(501), date: '31 FEB 1850' });
  save();

  expect(
    await screen.findByText('Use 500 characters or fewer.')
  ).toBeInstanceOf(HTMLElement);
  expect(screen.getAllByText('February 1850 has 28 days.')).not.toHaveLength(0);
  expect(onSave).not.toHaveBeenCalled();
});

it('shows the live reading of "ABT 1850"', async () => {
  setup();

  fireEvent.change(await screen.findByLabelText('Date'), {
    target: { value: 'ABT 1850' },
  });

  expect(document.body.textContent).toContain('Reads as');
});

it('sends the checked input to onSave, then calls onSaved', async () => {
  const { onSave, onSaved } = setup();

  await fill();
  fireEvent.change(screen.getByLabelText('Precision'), {
    target: { value: 'farm' },
  });
  fireEvent.change(screen.getByLabelText('Sources'), {
    target: { value: 'Deeds office, 1890' },
  });
  fireEvent.change(screen.getByLabelText('Notes'), {
    target: { value: 'Moved here after the war.' },
  });
  save();

  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

  const [[input]] = vi.mocked(onSave).mock.calls as unknown as [
    [
      {
        address: string;
        date: string;
        eventType: string;
        id: string;
        personId: string;
        place: Record<string, unknown>;
      },
    ],
  ];

  expect(input).toMatchObject({
    address: 'Farm Example, district Example',
    date: 'FROM 1840 TO 1855',
    eventType: 'residence',
    notes: 'Moved here after the war.',
    personId: PERSON.id,
    place: {
      kind: 'new',
      latitude: -33.93,
      longitude: 18.42,
      precision: 'farm',
    },
    sources: 'Deeds office, 1890',
  });
  expect(input.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(input.place.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(input.place.id).not.toBe(input.id);
});

it('turns Save off while the save runs', async () => {
  let finish: (value: { ok: boolean }) => void = () => {};
  const { onSave } = setup({
    onSave: vi.fn(
      () =>
        new Promise<{ ok: boolean }>(resolve => {
          finish = resolve;
        })
    ),
  });

  await fill();
  save();

  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement)
        .disabled
    ).toBe(true)
  );
  fireEvent.submit(screen.getByRole('form', { name: 'Add a pin' }));
  expect(onSave).toHaveBeenCalledTimes(1);
  finish({ ok: true });
});

it('shows an alert and keeps the values when the save fails, and a retry sends the same ids', async () => {
  const { onSave, onSaved } = setup({
    onSave: vi.fn(async () => ({ ok: false })),
  });

  await fill();
  save();

  expect(await screen.findByText("Couldn't save the pin")).toBeInstanceOf(
    HTMLElement
  );
  expect((screen.getByLabelText('Coordinates') as HTMLInputElement).value).toBe(
    '-33.93, 18.42'
  );
  expect((screen.getByLabelText('Person') as HTMLInputElement).value).toBe(
    'Maria Magdalena du Toit'
  );
  expect(onSaved).not.toHaveBeenCalled();

  save();
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));

  const [first, second] = vi.mocked(onSave).mock.calls as unknown as [
    [{ id: string; place: { id: string } }],
    [{ id: string; place: { id: string } }],
  ];

  expect(second[0].id).toBe(first[0].id);
  expect(second[0].place.id).toBe(first[0].place.id);
});

it('shows the same alert when the save throws', async () => {
  setup({
    onSave: vi.fn(async () => {
      throw new Error('offline');
    }),
  });

  await fill();
  save();

  expect(await screen.findByText("Couldn't save the pin")).toBeInstanceOf(
    HTMLElement
  );
});

it('shows the alert and saves nothing when the Person id is not an id', async () => {
  const { onSave } = setup({}, [{ ...PERSON, id: 'not-an-id' }]);

  await fill();
  save();

  expect(await screen.findByText("Couldn't save the pin")).toBeInstanceOf(
    HTMLElement
  );
  expect(onSave).not.toHaveBeenCalled();
});

it('closes on Cancel and on Esc, and not on an Esc outside the panel', async () => {
  const { onCancel } = setup();

  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalledTimes(1);

  fireEvent.keyDown(document.body, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(2);

  fireEvent.keyDown(screen.getByLabelText('Coordinates'), { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(3);

  const dialog = document.body.appendChild(document.createElement('div'));

  dialog.setAttribute('role', 'dialog');
  fireEvent.keyDown(dialog, { key: 'Escape' });
  fireEvent.keyDown(document.body, { key: 'Enter' });
  expect(onCancel).toHaveBeenCalledTimes(3);
  dialog.remove();

  // The dock date field and the map own an Esc that starts outside the panel.
  const outside = document.body.appendChild(document.createElement('input'));

  fireEvent.keyDown(outside, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(3);
  outside.remove();
});

it('leaves an Esc that closes the Person list to the list', async () => {
  const { onCancel } = setup();
  const person = await ready();

  fireEvent.change(person, { target: { value: 'Maria' } });
  fireEvent.keyDown(person, { key: 'Escape' });

  expect(onCancel).not.toHaveBeenCalled();
});

// PIN-02. The edit form.
const FIELDS = {
  address: '1 Church Street',
  date: '1850',
  eventType: 'baptism',
  latitude: -29.12,
  longitude: 26.21,
  notes: 'A note',
  personId: PERSON.id,
  precision: 'town',
  sources: 'A register',
  version: 2,
};

type EditQuery = NonNullable<Parameters<typeof PinForm>[0]['edit']>['query'];

const PIN_ID = '01900000-0000-7000-b000-0000000000d1';

const query = (over: Partial<EditQuery> = {}): EditQuery =>
  ({
    data: FIELDS as EditQuery['data'],
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
    ...over,
  }) as EditQuery;

const setupEdit = (over: Partial<EditQuery> = {}, people: unknown = [PERSON]) =>
  setup({ edit: { id: PIN_ID, query: query(over) } }, people);

it('shows the title "Edit a pin" and the values of the Pin', async () => {
  setupEdit();
  await ready();

  expect(screen.getByRole('heading', { name: 'Edit a pin' })).toBeInstanceOf(
    HTMLElement
  );
  expect((screen.getByLabelText('Person') as HTMLInputElement).value).toBe(
    'Maria Magdalena du Toit'
  );
  expect((screen.getByLabelText('Event type') as HTMLSelectElement).value).toBe(
    'baptism'
  );
  expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe(
    '1850'
  );
  expect(coordinates()).toBe('-29.120000, 26.210000');
  expect(
    (screen.getByLabelText('Address as recorded') as HTMLInputElement).value
  ).toBe('1 Church Street');
  expect((screen.getByLabelText('Sources') as HTMLTextAreaElement).value).toBe(
    'A register'
  );
  expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe(
    'A note'
  );
});

it('fixes the precision with its note while the point is unchanged, and frees both when it changes', async () => {
  setupEdit();
  await ready();

  const precision = screen.getByLabelText('Precision') as HTMLSelectElement;

  expect(precision.value).toBe('town');
  expect(precision.disabled).toBe(true);
  expect(
    screen.getByText('This is the precision of the Place.')
  ).toBeInstanceOf(HTMLElement);
  expect(
    (screen.getByLabelText('Coordinates') as HTMLInputElement).disabled
  ).toBe(false);

  fireEvent.change(screen.getByLabelText('Coordinates'), {
    target: { value: '-30, 20' },
  });
  expect(precision.disabled).toBe(false);
  expect(screen.queryByText('This is the precision of the Place.')).toBeNull();
});

it('counts a typed point that equals the point of the Place as unchanged, and a point with only the longitude changed as moved', async () => {
  setupEdit();
  await ready();

  const precision = screen.getByLabelText('Precision') as HTMLSelectElement;

  fireEvent.change(screen.getByLabelText('Coordinates'), {
    target: { value: '-29.12, 26.21' },
  });
  expect(precision.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Coordinates'), {
    target: { value: '-29.12, 26.5' },
  });
  expect(precision.disabled).toBe(false);
});

it('shows the loading look while the fields are pending, with Save off', async () => {
  setupEdit({ data: undefined, isPending: true });

  expect(screen.getByRole('heading', { name: 'Edit a pin' })).toBeInstanceOf(
    HTMLElement
  );
  expect(screen.getAllByTestId('loading-bar')).toHaveLength(10);
  expect(
    (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled
  ).toBe(true);
  expect(screen.queryByRole('combobox')).toBeNull();
});

it('shows the loading look until the Persons arrive, when the fields are there', () => {
  fetchStub.mockImplementation(() => new Promise(() => {}));
  render(
    <QueryProvider>
      <PinForm
        edit={{ id: PIN_ID, query: query() }}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryProvider>
  );

  expect(screen.getAllByTestId('loading-bar')).toHaveLength(10);
});

it('shows the Pin alert and asks again for the fields when they do not load', async () => {
  const refetch = vi.fn();

  setupEdit({ data: undefined, isError: true, refetch });

  expect((await screen.findByRole('alert')).textContent).toContain(
    "Couldn't load this Pin"
  );
  expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(refetch).toHaveBeenCalledTimes(1);
  // The Persons loaded, so only the fields ask again.
  expect(fetchStub).toHaveBeenCalledTimes(1);
});

it('keeps the loading look while a failed query asks again', async () => {
  setupEdit({ data: undefined, isError: true, isFetching: true });

  expect(screen.getAllByTestId('loading-bar')).toHaveLength(10);
});

it('shows the Pin title when the fields and the Persons both fail, and asks again for both', async () => {
  const refetch = vi.fn();

  fetchStub.mockResolvedValueOnce(new Response(null, { status: 401 }));
  fetchStub.mockResolvedValue(Response.json([PERSON]));
  render(
    <QueryProvider>
      <PinForm
        edit={{
          id: PIN_ID,
          query: query({ data: undefined, isError: true, refetch }),
        }}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryProvider>
  );

  expect((await screen.findByRole('alert')).textContent).toContain(
    "Couldn't load this Pin"
  );
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(refetch).toHaveBeenCalledTimes(1);
  // The fake query stays failed, so the alert stays; the Persons asked again.
  await waitFor(() => expect(fetchStub).toHaveBeenCalledTimes(2));
});

it('shows the Persons title when only the Persons fail, and asks again only for them', async () => {
  const refetch = vi.fn();

  fetchStub.mockResolvedValueOnce(new Response(null, { status: 401 }));
  fetchStub.mockResolvedValue(Response.json([PERSON]));
  render(
    <QueryProvider>
      <PinForm
        edit={{ id: PIN_ID, query: query({ refetch }) }}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryProvider>
  );

  expect((await screen.findByRole('alert')).textContent).toContain(
    "Couldn't load your people"
  );
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await ready()).toBeInstanceOf(HTMLElement);
  expect(refetch).not.toHaveBeenCalled();
});

it('saves an unchanged point as "stays" with the id and the version, and no precision', async () => {
  const { onSave, onSaved } = setupEdit();

  await ready();
  fireEvent.change(screen.getByLabelText('Date'), {
    target: { value: 'FROM 1840 TO 1845' },
  });
  save();

  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  expect(onSave).toHaveBeenCalledWith({
    address: '1 Church Street',
    date: 'FROM 1840 TO 1845',
    eventType: 'baptism',
    id: PIN_ID,
    notes: 'A note',
    personId: PERSON.id,
    place: { kind: 'stays' },
    sources: 'A register',
    version: 2,
  });
});

it('saves a changed point as a new point with the precision', async () => {
  const { onSave, onSaved } = setupEdit();

  await ready();
  fireEvent.change(screen.getByLabelText('Coordinates'), {
    target: { value: '-33.93, 18.42' },
  });
  fireEvent.change(screen.getByLabelText('Precision'), {
    target: { value: 'farm' },
  });
  save();

  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

  const [[input]] = vi.mocked(onSave).mock.calls as unknown as [
    [{ id: string; place: Record<string, unknown>; version: number }],
  ];

  expect(input.id).toBe(PIN_ID);
  expect(input.version).toBe(2);
  expect(input.place).toMatchObject({
    kind: 'new',
    latitude: -33.93,
    longitude: 18.42,
    precision: 'farm',
  });
  expect(input.place.id).toMatch(/^[0-9a-f-]{36}$/);
});

it('keeps a point with more than six decimals at its Place until the text changes', async () => {
  const { onSave } = setupEdit({
    data: { ...FIELDS, latitude: -29.1234567 } as EditQuery['data'],
  });

  await ready();
  expect(coordinates()).toBe('-29.123457, 26.210000');
  expect(
    (screen.getByLabelText('Precision') as HTMLSelectElement).disabled
  ).toBe(true);
  save();

  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(
    (vi.mocked(onSave).mock.calls[0] as unknown as [{ place: unknown }])[0]
      .place
  ).toEqual({ kind: 'stays' });
});

it('saves the Person that the user picks', async () => {
  const other = {
    ...PERSON,
    givenNames: 'Anna',
    id: '01900000-0000-7000-8000-0000000000a2',
    surname: 'Example',
  };
  const { onSave } = setupEdit({}, [PERSON, other]);
  const person = await ready();

  fireEvent.change(person, { target: { value: 'Anna' } });
  fireEvent.keyDown(person, { key: 'ArrowDown' });
  fireEvent.keyDown(person, { key: 'Enter' });
  save();

  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(
    (vi.mocked(onSave).mock.calls[0] as unknown as [{ personId: string }])[0]
      .personId
  ).toBe(other.id);
});

it('shows the error of an invalid date and saves nothing', async () => {
  const { onSave } = setupEdit();

  await ready();
  fireEvent.change(screen.getByLabelText('Date'), {
    target: { value: '31 FEB 1850' },
  });
  save();

  expect(
    await screen.findAllByText('February 1850 has 28 days.')
  ).not.toHaveLength(0);
  expect(onSave).not.toHaveBeenCalled();
});

it('shows an alert and keeps the values when the edit save fails', async () => {
  const { onSave, onSaved } = setupEdit({}, [PERSON]);

  vi.mocked(onSave).mockResolvedValue({ ok: false });
  await ready();
  fireEvent.change(screen.getByLabelText('Date'), {
    target: { value: '1851' },
  });
  save();

  expect(await screen.findByText("Couldn't save the pin")).toBeInstanceOf(
    HTMLElement
  );
  expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe(
    '1851'
  );
  expect(onSaved).not.toHaveBeenCalled();
});
