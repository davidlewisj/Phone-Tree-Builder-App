import { useState, useEffect } from 'react';

const BLOCK_TYPES = [
  'Main Line',
  'Department',
  'Reception',
  'Manager',
  'Person',
  'Extension',
  'Voicemail',
  'After Hours',
  'Custom',
];

const EMPTY = { name: '', phone: '', role: '', blockType: '' };

export default function ContactForm({ initial, parentName, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [customType, setCustomType] = useState('');

  useEffect(() => {
    if (initial) {
      const isCustom = initial.blockType && !BLOCK_TYPES.slice(0, -1).includes(initial.blockType);
      setForm({
        name: initial.name,
        phone: initial.phone,
        role: initial.role,
        blockType: isCustom ? 'Custom' : (initial.blockType || ''),
      });
      setCustomType(isCustom ? initial.blockType : '');
    } else {
      setForm(EMPTY);
      setCustomType('');
    }
  }, [initial]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const resolvedBlockType = form.blockType === 'Custom' ? customType.trim() : form.blockType;
    onSave({ ...form, blockType: resolvedBlockType });
  }

  const isEdit = Boolean(initial);
  const title = isEdit
    ? 'Edit Contact'
    : parentName
    ? `Add contact under ${parentName}`
    : 'Add Root Contact';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal__title">{title}</h2>
        <form onSubmit={handleSubmit} className="contact-form">
          <label className="form-label">
            Name *
            <input
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              autoFocus
              required
            />
          </label>
          <label className="form-label">
            Phone
            <input
              className="form-input"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 555-0100"
            />
          </label>
          <label className="form-label">
            Block Type
            <select
              className="form-input"
              name="blockType"
              value={form.blockType}
              onChange={handleChange}
            >
              <option value="">— Select a type —</option>
              {BLOCK_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          {form.blockType === 'Custom' && (
            <label className="form-label">
              Custom Type Label
              <input
                className="form-input"
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                placeholder="e.g. On-Call Nurse"
              />
            </label>
          )}
          <label className="form-label">
            Role / Title
            <input
              className="form-input"
              name="role"
              value={form.role}
              onChange={handleChange}
              placeholder="e.g. Manager"
            />
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {isEdit ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
