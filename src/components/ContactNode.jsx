import { Handle, Position } from '@xyflow/react';

export default function ContactNode({ data, selected }) {
  const { contact, onEdit, onDelete, onAddChild } = data;

  return (
    <div className={`contact-node ${selected ? 'contact-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />

      <div className="contact-node__header">
        {contact.blockType && (
          <span className="contact-node__role">{contact.blockType}</span>
        )}
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

      <div className="contact-node__name">{contact.name}</div>
      {contact.phone && <div className="contact-node__phone">{contact.phone}</div>}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
