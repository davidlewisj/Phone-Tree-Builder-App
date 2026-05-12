import { useState, useEffect } from 'react';

const EMPTY = { name: '', phone: '', role: '' };

export default function ContactForm({ initial, parentName, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(initial ? { name: initial.name, phone: initial.phone, role: initial.role } : EMPTY);
  }, [initial]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
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
