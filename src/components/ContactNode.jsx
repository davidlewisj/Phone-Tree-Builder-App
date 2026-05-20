import { Handle, Position } from '@xyflow/react';
import { getBlockMeta } from '../constants/blockTypes';

export default function ContactNode({ data, selected }) {
  const { contact, onEdit, onDelete, onAddChild } = data;
  const meta = contact.blockType ? getBlockMeta(contact.blockType) : null;

  return (
    <div className={`contact-node ${meta ? `contact-node--${meta.cssKey}` : ''} ${selected ? 'contact-node--selected' : ''}`}>
      {meta && <div className="contact-node__accent" />}
      <Handle type="target" position={Position.Top} />

      <div className="contact-node__header">
        {meta && (
          <span className={`contact-node__role type--${meta.cssKey}`}>
            <span className="contact-node__role-icon">{meta.icon}</span>
            {contact.blockType}
          </span>
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
