import { Handle, Position } from '@xyflow/react';
import { getBlockTypeDefinition } from '../utils/blockTypes';
import BlockTypeIcon from './BlockTypeIcon';

function parseRouteOption(route) {
  const normalized = `${route || ''}`.trim();
  if (!normalized) return null;
  const match = normalized.match(/[1-9]/);
  if (!match) return null;
  const option = Number(match[0]);
  return Number.isInteger(option) && option >= 1 && option <= 9 ? option : null;
}

export default function BlockNode({ data, selected }) {
  const { block, onEdit, onAddChild, onAddAbove, onNodeDragOver, onNodeDragLeave, onNodeDropType, previewPlacement, isPreview } = data;
  const definition = getBlockTypeDefinition(block.type);
  const isTrigger = block.parentId === null;
  const isPlayMessage = block.type === 'play_message';
  const isPhoneHours = block.type === 'phone_hours';
  const isVoicemail = block.type === 'voicemail';
  const canAddChild = !isVoicemail;
  const isUntitled = !block.title?.trim() || block.title.trim().toLowerCase() === 'untitled block';
  const assignedOption = parseRouteOption(block.route);
  const routeLabel = assignedOption ? `Opt ${assignedOption}` : data.siblingRouteNumber ? `Opt ${data.siblingRouteNumber}` : 'Start';
  const isSystemNode = !isTrigger && (isPlayMessage || isPhoneHours);
  const visualTypeClass = block.type === 'phone_hours' ? 'phone_tree' : (block.type || 'phone_tree');
  const blockTypeTag = isPhoneHours ? 'Phone Hours' : (definition.label || (block.type || '').replace(/_/g, ' '));
  const canEditNode = !isTrigger && (!isPlayMessage || isPhoneHours);
  const previewClass =
    previewPlacement === 'above'
      ? 'block-node--drop-above'
      : previewPlacement === 'below'
      ? 'block-node--drop-below'
      : '';

  function getPlacement(event) {
    if (!canAddChild) return 'above';

    if (previewPlacement) return previewPlacement;

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const ratio = relativeY / rect.height;

    // Use a center dead-zone so tiny pointer movements don't flip placement.
    if (ratio < 0.42) return 'above';
    if (ratio > 0.58) return 'below';
    return ratio <= 0.5 ? 'above' : 'below';
  }

  function getDraggedType(event) {
    return event.dataTransfer?.getData('application/ivr-step-type') || data.draggingPaletteType || '';
  }

  function handleDragOver(event) {
    const draggedType = getDraggedType(event);
    if (!draggedType || isPreview) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    const placement = getPlacement(event);
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;
    const focus = Math.max(0, Math.min(100, Math.round((relativeX / rect.width) * 100)));
    const distanceToLine = placement === 'above' ? relativeY : rect.height - relativeY;
    const maxDistance = Math.max(1, rect.height * 0.62);
    const magnet = Math.max(0, Math.min(1, 1 - distanceToLine / maxDistance));
    event.currentTarget.style.setProperty('--drop-focus', `${focus}%`);
    event.currentTarget.style.setProperty('--drop-magnet', magnet.toFixed(3));
    onNodeDragOver?.(block.id, placement, draggedType);
  }

  function handleDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;

    // Drag events often report null relatedTarget; verify pointer is truly outside.
    const rect = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (outside) {
      event.currentTarget.style.setProperty('--drop-focus', '50%');
      event.currentTarget.style.setProperty('--drop-magnet', '0.35');
      onNodeDragLeave?.(block.id);
    }
  }

  function handleDrop(event) {
    const draggedType = getDraggedType(event);
    if (!draggedType || isPreview) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.setProperty('--drop-focus', '50%');
    event.currentTarget.style.setProperty('--drop-magnet', '0.35');
    const placement = getPlacement(event);
    onNodeDropType?.(block, placement, draggedType);
  }

  return (
    <div
      className={`block-node ${selected ? 'block-node--selected' : ''} ${isTrigger ? 'block-node--trigger' : ''} ${!isTrigger ? 'block-node--compact' : ''} ${!isTrigger && !isSystemNode ? 'block-node--has-route' : ''} ${isSystemNode ? 'block-node--system' : ''} ${previewClass} ${isPreview ? 'block-node--preview' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!isTrigger && <Handle type="target" position={Position.Top} />}

      {!isTrigger && !isPreview && (
        <button
          type="button"
          className="node-add-btn node-add-btn--top nodrag nopan"
          title="Insert block above"
          onClick={e => {
            e.stopPropagation();
            onAddAbove(block);
          }}
        >
          +
        </button>
      )}

      {!isTrigger && !isSystemNode && <div className="block-node__route">{routeLabel}</div>}
      {!isTrigger && <div className={`block-node__type-tag block-node__type-tag--${visualTypeClass}`}>{blockTypeTag}</div>}

      {!isTrigger ? (
        <div className="block-node__system-row">
          <div className="block-node__system-content">
            <span className={`block-node__type block-node__type--${visualTypeClass}`} title={definition.label}>
              <span className="block-node__type-icon" aria-hidden="true">
                <BlockTypeIcon type={block.type} title={block.title} />
              </span>
            </span>
            <div className={`block-node__name block-node__name--inline${isUntitled ? ' block-node__name--untitled' : ''}`}>{block.title}</div>
          </div>
          {canEditNode ? (
            <button
              className="icon-btn icon-btn--plain block-node__system-edit"
              title="Edit"
              onClick={e => { e.stopPropagation(); onEdit(block); }}
            >✎</button>
          ) : null}
        </div>
      ) : (
        <div className={`block-node__name${isUntitled ? ' block-node__name--untitled' : ''}`}>{isTrigger ? 'Incoming Caller' : block.title}</div>
      )}

      {!isPreview && canAddChild && (
        <button
          type="button"
          className="node-add-btn node-add-btn--bottom nodrag nopan"
          title="Add child block"
          onClick={e => {
            e.stopPropagation();
            onAddChild(block);
          }}
        >
          +
        </button>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
