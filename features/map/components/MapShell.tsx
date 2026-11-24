'use client';

import type { ReactNode } from 'react';

import { useEffect, useRef, useState } from 'react';

import type { Tab } from '@ks/app/components/actions/types';
import type { ClickPoint } from '@ks/app/components/overlays/types';
import type {
  ClickProp,
  Layer,
  LayerId,
  MapHandle,
  OpenPin,
  ZoomLimits,
} from '@ks/features/map/types';
import type { Source } from '@ks/lib/domain/boundaries/types.ts';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { Validity } from '@ks/lib/domain/validity/types.ts';

import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { freeArea, MapLayout } from '@ks/app/components/layout/MapLayout';
import { Sheet } from '@ks/app/components/overlays/Sheet';
import { isFreeEscape } from '@ks/app/components/overlays/useDismiss';
import {
  AccountMenu,
  accountSlots,
} from '@ks/features/map/components/AccountMenu';
import { Credits } from '@ks/features/map/components/Credits';
import { DateDock } from '@ks/features/map/components/DateDock';
import { LayersBody } from '@ks/features/map/components/LayersBody';
import { LayersButton } from '@ks/features/map/components/LayersButton';
import { Legend } from '@ks/features/map/components/Legend';
import { MapView } from '@ks/features/map/components/MapView';
import { Panel } from '@ks/features/map/components/Panel';
import { SourcesDialog } from '@ks/features/map/components/SourcesDialog';
import { ZoomControls } from '@ks/features/map/components/ZoomControls';
import { PINS_LAYER_ID } from '@ks/features/map/layers/pins';
import { polityLayer } from '@ks/features/map/layers/polities';
import { hasBorders } from '@ks/lib/domain/map/coverage.mts';
import { todayDay, yearOf } from '@ks/lib/domain/map/map-date.mts';
import { isCurrentOn } from '@ks/lib/domain/validity/validity.mts';
import { DRAWN_LEGEND_ROWS } from '@ks/lib/ui/legend.mts';

import styles from '@ks/features/map/components/MapShell.module.css';

/** The panel has one tab until the Filters tab arrives. */
const LAYERS_BODY_ID = 'layers-panel-body';
const LAYERS_TABS: Tab[] = [
  { controls: LAYERS_BODY_ID, label: 'Layers', value: 'layers' },
];

type PinProp = {
  open: OpenPin;
  /** `popup` draws the popup: floating at the `place` of the Pin on a desktop, `inline` in the date sheet on a phone. */
  popup: (
    form: 'floating' | 'inline',
    place?: { x: number; y: number }
  ) => ReactNode;
  /** The days the Pin shows; the popup closes when the Map date leaves them. */
  span: Validity;
};

const useShellState = (layers: Layer[]) => {
  // The Map date starts on today, which is also the last date.
  const [lastDay] = useState(todayDay);
  const [mapDay, setMapDay] = useState(lastDay);
  const [visible, setVisible] = useState<Partial<Record<LayerId, boolean>>>(
    () => Object.fromEntries(layers.map(layer => [layer.id, true]))
  );
  const [showSources, setShowSources] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const map = useRef<MapHandle>(null);
  const [limits, setLimits] = useState<ZoomLimits>({
    atMax: false,
    atMin: false,
  });

  // The pixel point of the open Pin, or of the clicked point when no Pin is open; the popup follows it.
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  return {
    lastDay,
    limits,
    map,
    mapDay,
    point,
    setLimits,
    setMapDay,
    setPoint,
    setSheetExpanded,
    setShowLayers,
    setShowSources,
    setVisible,
    sheetExpanded,
    showLayers,
    showSources,
    visible,
  };
};

type ShellState = ReturnType<typeof useShellState>;

// A Pin that the Map date or the Pins row hides closes, and so does Esc.
const useClosePin = (
  pin: PinProp | undefined,
  { mapDay, visible }: Pick<ShellState, 'mapDay' | 'visible'>,
  onClosePin?: () => void
) => {
  const shown = pin !== undefined;
  const hidden =
    pin !== undefined &&
    (!isCurrentOn(pin.span, mapDay) || visible[PINS_LAYER_ID] === false);

  useEffect(() => {
    if (hidden) onClosePin?.();
  }, [hidden, onClosePin]);

  useEffect(() => {
    if (!shown) return;

    const close = (event: KeyboardEvent) => {
      if (isFreeEscape(event)) onClosePin?.();
    };

    document.addEventListener('keydown', close);

    return () => document.removeEventListener('keydown', close);
  }, [onClosePin, shown]);
};

type DockArgs = {
  borders: (day: Day) => boolean;
  credits: ReactNode;
  phone: boolean;
  pin?: PinProp;
  state: ShellState;
};

const Dock = ({ borders, credits, phone, pin, state }: DockArgs) =>
  phone ? (
    <>
      <div className={styles.credits}>{credits}</div>
      <DateDock
        day={state.mapDay}
        details={pin?.popup('inline')}
        hasBorders={borders}
        lastDay={state.lastDay}
        onChange={state.setMapDay}
        sheet={{
          expanded: state.sheetExpanded,
          onExpandedChange: state.setSheetExpanded,
        }}
      />
    </>
  ) : (
    <DateDock
      day={state.mapDay}
      hasBorders={borders}
      lastDay={state.lastDay}
      onChange={state.setMapDay}
    />
  );

const NoBordersNotice = ({
  first,
  mapDay,
  phone,
  setMapDay,
}: {
  first: Day;
  mapDay: Day;
  phone: boolean;
  setMapDay: (day: Day) => void;
}) => {
  const firstYear = String(yearOf(first));

  return (
    <NoticeCard
      actions={[
        { label: `Jump to ${firstYear}`, onClick: () => setMapDay(first) },
      ]}
      icon='layers'
      phone={phone}
      title={`No borders are mapped for ${yearOf(mapDay)} yet`}>
      {`The map has borders from ${firstYear}.`}
    </NoticeCard>
  );
};

const Zoom = ({
  limits,
  map,
}: { map: ShellState['map'] } & Pick<ShellState, 'limits'>) => (
  <ZoomControls
    atMax={limits.atMax}
    atMin={limits.atMin}
    onFit={() => map.current?.fit()}
    onZoomIn={() => map.current?.zoomIn()}
    onZoomOut={() => map.current?.zoomOut()}
  />
);

type LayerProps = {
  day: Day;
  layers: Layer[];
  onChange: (id: LayerId, show: boolean) => void;
  visible: ShellState['visible'];
};

type PartArgs = {
  phone: boolean;
  props: ShellProps;
  state: ShellState;
};

type ShellProps = {
  /** The part in the `action` slot, such as "Add a pin". The caller gives none on a phone. */
  action?: ReactNode;
  /** The click popup. A Pin popup wins over it. The caller gives none on a phone. */
  click?: ClickProp;
  /** The days with a Boundary version; the first one is where the notice card jumps to. */
  coverage: Validity[];
  /** Shown in the account menu. */
  email: string;
  /** The letter on the Avatar. */
  initial: string;
  /** The layers the map draws. */
  layers: Layer[];
  /** A click on empty map, Esc, a Map date that hides the open Pin, or the Pins row switched off. Keep its identity stable. */
  onClosePin?: () => void;
  /** A click on empty map, with its point. `onClosePin` runs first. */
  onEmptyClick?: (point: ClickPoint) => void;
  /** A click on a Pin, with its id. */
  onOpenPin?: (id: string) => void;
  onSignOut: () => Promise<unknown>;
  /** The panel in the place of the Layers panel on a desktop. A phone shows none. */
  panel?: ReactNode;
  /** The Pin whose popup is open. */
  pin?: PinProp;
  sources: Source[];
  /** A `Toast` for the result of an action, at the bottom centre above the dock. */
  toast?: ReactNode;
};

const MapPane = ({ phone, props, state }: PartArgs) => {
  const { click, onClosePin, onEmptyClick, onOpenPin, pin, toast } = props;

  return (
    <>
      <MapView
        clicked={click?.position}
        handle={state.map}
        layers={props.layers}
        mapDay={state.mapDay}
        onEmptyClick={point => {
          onClosePin?.();
          onEmptyClick?.(point);
        }}
        onOpenPin={id => {
          // A tap on a Pin opens the date sheet on a phone, so a close leaves it open under the finger.
          if (phone) state.setSheetExpanded(true);
          onOpenPin?.(id);
        }}
        onOpenPoint={state.setPoint}
        onZoomLimits={state.setLimits}
        open={pin?.open}
        padding={freeArea(phone)}
        visible={state.visible}
      />
      {!phone &&
        state.point &&
        (pin?.popup('floating', state.point) ?? click?.popup(state.point))}
      {toast && <div className={styles.toast}>{toast}</div>}
    </>
  );
};

const Account = ({ phone, props, state }: PartArgs) => (
  <AccountMenu
    email={props.email}
    initial={props.initial}
    onOpenSources={() => state.setShowSources(true)}
    onSignOut={props.onSignOut}
    phone={phone}
  />
);

/** The legend of the marks that the map draws. */
const DrawnLegend = () => <Legend rows={DRAWN_LEGEND_ROWS} />;

/** The desktop panel: one tab, "Layers", over the groups, and the legend at the end. */
const LayersTab = (props: LayerProps) => (
  <Panel
    bodyId={LAYERS_BODY_ID}
    end={<DrawnLegend />}
    label='Layers'
    selected='layers'
    tabs={LAYERS_TABS}>
    <LayersBody {...props} />
  </Panel>
);

const ShellLayout = ({
  layerProps,
  phone,
  props,
  state,
}: { layerProps: LayerProps } & PartArgs) => {
  const { action, coverage, panel, pin, sources } = props;
  const { mapDay } = state;
  const showPolities = state.visible[polityLayer.id] !== false;
  const credits = (
    <Credits
      collapsible={!phone}
      onOpenAttributions={() => state.setShowSources(true)}
      showPolities={showPolities}
      sources={sources}
    />
  );
  const borders = (day: Day) => hasBorders(coverage, day);
  const first = coverage.at(0)?.validFrom;
  const account = <Account phone={phone} props={props} state={state} />;

  return (
    <MapLayout
      {...accountSlots(phone, account)}
      action={action}
      credits={phone ? undefined : credits}
      dock={
        <Dock
          borders={borders}
          credits={credits}
          phone={phone}
          pin={pin}
          state={state}
        />
      }
      layers={
        phone ? (
          <LayersButton onClick={() => state.setShowLayers(true)} />
        ) : undefined
      }
      overlay={
        showPolities && first !== undefined && !borders(mapDay) ? (
          <NoBordersNotice
            first={first}
            mapDay={mapDay}
            phone={phone}
            setMapDay={state.setMapDay}
          />
        ) : undefined
      }
      overlayAt='top'
      panel={phone ? undefined : (panel ?? <LayersTab {...layerProps} />)}
      zoom={phone ? undefined : <Zoom limits={state.limits} map={state.map} />}>
      <MapPane phone={phone} props={props} state={state} />
    </MapLayout>
  );
};

export const MapShell = (props: ShellProps) => {
  const { layers, onClosePin, pin, sources } = props;
  const phone = usePhone();
  const state = useShellState(layers);
  const layerProps: LayerProps = {
    day: state.mapDay,
    layers,
    onChange: (id, show) =>
      state.setVisible(current => ({ ...current, [id]: show })),
    visible: state.visible,
  };

  useClosePin(pin, state, onClosePin);

  return (
    <>
      <ShellLayout
        layerProps={layerProps}
        phone={phone}
        props={props}
        state={state}
      />
      {phone && (
        <Sheet
          onClose={() => state.setShowLayers(false)}
          open={state.showLayers}
          title='Layers'>
          <LayersBody {...layerProps} />
          <DrawnLegend />
        </Sheet>
      )}
      <SourcesDialog
        onClose={() => state.setShowSources(false)}
        open={state.showSources}
        sources={sources}
      />
    </>
  );
};
