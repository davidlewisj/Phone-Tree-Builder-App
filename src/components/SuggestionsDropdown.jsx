import React, { useRef, useState, useEffect } from 'react';

export default function SuggestionsDropdown({ suggestions, onSelect, icon, buttonClassName }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef();
  const rootRef = useRef();

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={rootRef} className="suggestions-dropdown-root" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        className={buttonClassName ? buttonClassName : "suggestions-dropdown-btn"}
        aria-label="Show handling suggestions"
        onClick={() => setOpen(o => !o)}
        tabIndex={-1}
      >
        {icon}
      </button>
      {open && (
        <div className="suggestions-dropdown-list" style={{ position: 'absolute', right: 0, bottom: '110%', zIndex: 20 }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="suggestions-dropdown-item"
              type="button"
              onClick={() => {
                onSelect(s);
                setOpen(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
