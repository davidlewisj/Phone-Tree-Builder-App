import React, { useRef, useState } from 'react';

export default function SuggestionsDropdown({ suggestions, onSelect, icon, buttonClassName }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef();
  const rootRef = useRef();



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
