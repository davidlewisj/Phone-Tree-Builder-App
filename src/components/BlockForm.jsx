import { useState, useEffect } from 'react';
import { BLOCK_TYPE_OPTIONS, getBlockTypeDefinition } from '../utils/blockTypes';
import BlockTypeIcon from './BlockTypeIcon';




const EMPTY = { title: '', type: 'phone_tree', route: '', prompt: '' };

export default function BlockForm({ initial, defaults, parentName, onSave, onCancel, dialogTitle }) {
  const [form, setForm] = useState(EMPTY);
  const hasParent = Boolean(parentName) || Boolean(initial && initial.parentId !== null);
  const typeDefinition = getBlockTypeDefinition(form.type);

  useEffect(() => {
    setForm(
      initial
        ? {
            title: initial.title,
          type: initial.type || 'phone_tree',
            route: initial.route,
            prompt: initial.prompt,
            // notes: initial.notes || '',
          }
        : {
            ...EMPTY,
            ...(defaults || {}),
          }
    );
  }, [initial, defaults]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...form,
      type: form.type,
      route: hasParent ? form.route : '',
    });
  }

  const isEdit = Boolean(initial);
  const computedTitle = isEdit
    ? 'Edit Block'
    : parentName
    ? `Add block under ${parentName}`
    : 'Add Starting Block';
  const title = dialogTitle || computedTitle;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal__title">{title}</h2>
        {/* Removed debug and duplicate Handling InstructionsSidebar */}
            <form onSubmit={handleSubmit} className="block-form">
          <label className="form-label">
            Block Label *
            <input
              className="form-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder={typeDefinition.titlePlaceholder}
              autoFocus
              required
            />
          </label>
          <label className="form-label">
            Block Type
            <span className="form-label__hint">{typeDefinition.description}</span>
            <div className="type-picker" role="radiogroup" aria-label="Block Type">
              {BLOCK_TYPE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`type-picker__item${form.type === option.value ? ' type-picker__item--active' : ''}`}
                  role="radio"
                  aria-checked={form.type === option.value}
                  onClick={() => setForm(prev => ({ ...prev, type: option.value }))}
                >
                  <span className="type-picker__icon" aria-hidden="true">
                    <BlockTypeIcon type={option.value} title={option.label} />
                  </span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </label>
          <label className="form-label">
            Route From Parent
            <input
              className="form-input"
              name="route"
              value={hasParent ? form.route : ''}
              onChange={handleChange}
              placeholder={typeDefinition.routePlaceholder}
              disabled={!hasParent}
            />
          </label>
          <label className="form-label">
            {typeDefinition.promptLabel}
            <input
              className="form-input"
              name="prompt"
              value={form.prompt}
              onChange={handleChange}
              placeholder={typeDefinition.promptPlaceholder}
            />
          </label>

          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {isEdit ? 'Save Changes' : 'Add Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
