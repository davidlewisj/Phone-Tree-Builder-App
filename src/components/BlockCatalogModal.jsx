import { groupBlockTypesByCategory } from '../utils/blockTypes';
import BlockTypeIcon from './BlockTypeIcon';

export default function BlockCatalogModal({ parentTitle, mode = 'child', onSelect, onCancel }) {
  const groups = groupBlockTypesByCategory();
  const relationText = mode === 'above' ? 'Insert a new block above' : 'Add a new block under';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <h2 className="modal__title">Choose Block Type</h2>
        <p className="catalog-subtitle">
          {relationText} <strong>{parentTitle}</strong>.
        </p>

        {groups.map(group => (
          <div key={group.category} className="catalog-group">
            <h3 className="catalog-group__title">{group.category}</h3>
            <div className="catalog-grid">
              {group.items.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className="catalog-item"
                  onClick={() => onSelect(option.value, option.label)}
                >
                  <span className="catalog-item__header">
                    <span className="catalog-item__icon" aria-hidden="true">
                      <BlockTypeIcon type={option.value} title={option.label} />
                    </span>
                    <span className="catalog-item__title">{option.label}</span>
                  </span>
                  <span className="catalog-item__description">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
