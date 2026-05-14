import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import BlockTypeIcon from './BlockTypeIcon';
import { BLOCK_TYPE_OPTIONS } from '../utils/blockTypes';

export default function BlockTypeDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef();
  const buttonRef = useRef();
  const [dropdownPos, setDropdownPos] = useState(null);
  const selected = BLOCK_TYPE_OPTIONS.find(opt => opt.value === value);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e) {
      // Only close if click is outside dropdown
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  // When opening, measure button and set dropdown position
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    } else {
      setDropdownPos(null);
    }
  }, [open]);

  return (
    <div ref={rootRef} className="block-type-dropdown" style={{ position: 'relative', width: '100%' }}>
      <button
        ref={buttonRef}
        type="button"
        className="block-type-dropdown__selected"
        onClick={e => {
          // Prevent immediate close on toggle
          e.stopPropagation();
          if (!disabled) setOpen(o => !o);
        }}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 10, fontWeight: 600, fontSize: '1rem', gap: 10, boxShadow: open ? '0 2px 8px rgba(0,0,0,0.07)' : 'none', borderColor: '#d2deef', borderWidth: 1, borderStyle: 'solid', backgroundColor: '#fff', minHeight: 38
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#f5f9ff', border: '1px solid #e0e7ef' }}>
          <BlockTypeIcon type={selected?.value} title={selected?.label} />
        </span>
        <span>{selected?.label || 'Select type'}</span>
        <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 18 }}>&#9662;</span>
      </button>
      {open && dropdownPos && createPortal(
        <div
          className="block-type-dropdown__list"
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            background: '#fff',
            border: '1px solid #d2deef',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(30,58,95,0.13)',
            zIndex: 9999,
            padding: 4
          }}
          role="listbox"
          onPointerDown={e => e.stopPropagation()}
        >
          {BLOCK_TYPE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              className="block-type-dropdown__item"
              style={{
                display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px', border: 'none', background: value === option.value ? '#eaf2ff' : 'none', borderRadius: 8, fontWeight: 600, fontSize: '1rem', gap: 10, cursor: 'pointer', marginBottom: 2
              }}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={value === option.value}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#f5f9ff', border: '1px solid #e0e7ef' }}>
                <BlockTypeIcon type={option.value} title={option.label} />
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
