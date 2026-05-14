import { Handle, Position } from '@xyflow/react';

const TYPE_LABELS = {
  entry: 'Entry',
  menu: 'Menu',
  queue: 'Queue',
  transfer: 'Transfer',
  voicemail: 'Voicemail',
  action: 'Action',
};

export default function ContactNode({ data, selected }) {
  const { contact, onEdit, onDelete, onAddChild } = data;
  const typeLabel = TYPE_LABELS[contact.type] || 'Action';
  const routeLabel = contact.route || 'Entry Route';

  return (
    <div className={`contact-node ${selected ? 'contact-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />

      <div className="contact-node__header">
        <span className={`contact-node__type contact-node__type--${contact.type || 'action'}`}>{typeLabel}</span>
        <div className="contact-node__actions">
          <button
            className="icon-btn"
            title="Add child"
            onClick={e => { e.stopPropagation(); onAddChild(contact); }}
          >+</button>
          <button
            className="icon-btn"
            title="Edit"
            onClick={e => { e.stopPropagation(); onEdit(contact); }}
          >✎</button>
          <button
            className="icon-btn icon-btn--danger"
            title="Delete"
            onClick={e => { e.stopPropagation(); onDelete(contact); }}
          >✕</button>
        </div>
      </div>

      <div className="contact-node__route">{routeLabel}</div>
      <div className="contact-node__name">{contact.title}</div>
      <div className="contact-node__phone">{contact.prompt || 'No handling instructions set'}</div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
