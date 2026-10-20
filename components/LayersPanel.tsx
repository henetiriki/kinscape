'use client';

export const LayersPanel = ({
  onShowPolitiesChange,
  showPolities,
}: {
  onShowPolitiesChange: (show: boolean) => void;
  showPolities: boolean;
}) => (
  <aside aria-label='Layers' className='panel'>
    <h2 className='section-heading'>Layers</h2>
    <div className='layer-row'>
      <input
        aria-describedby='polity-borders-help'
        checked={showPolities}
        id='polity-borders'
        onChange={event => onShowPolitiesChange(event.target.checked)}
        type='checkbox'
      />
      <div>
        <label className='layer-name' htmlFor='polity-borders'>
          Polity borders
        </label>
        <span className='layer-help' id='polity-borders-help'>
          Fills, borders and names of the Polities on the Map date.
        </span>
      </div>
    </div>
  </aside>
);
