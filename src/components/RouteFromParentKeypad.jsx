import { useMemo, useState } from 'react';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function getSelectedDigit(value) {
  const normalized = `${value || ''}`.trim();
  if (!normalized) return '';
  const directMatch = DIGITS.includes(normalized) ? normalized : '';
  if (directMatch) return directMatch;
  const embeddedDigit = normalized.match(/[1-9]/)?.[0] || '';
  return DIGITS.includes(embeddedDigit) ? embeddedDigit : '';
}

export default function RouteFromParentKeypad({ value, onChange, disabled = false, availableCount = 0 }) {
  const selectedDigit = useMemo(() => getSelectedDigit(value), [value]);
  const selectedRouteLabel = selectedDigit ? `Press ${selectedDigit}` : null;
  const clampedAvailableCount = Math.max(0, Math.min(9, availableCount));
  const [showTooltip, setShowTooltip] = useState(false);

  function handleSelect(digit) {
    if (disabled) return;
    if (Number(digit) > clampedAvailableCount) return;
    onChange(`Press ${digit}`);
  }

  return (
    <div className="route-keypad route-keypad--modern" role="group" aria-label="Route from parent options">

      {/* ── Header ── */}
      <div className="route-keypad__header">
        <div className="route-keypad__title-group">
          <span className="route-keypad__icon-wrap" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 12H9v-5h2v5zm0-7H9V5h2v2z" fill="currentColor"/>
            </svg>
          </span>
          <span className="route-keypad__title">Route From Parent</span>
        </div>
        <button
          type="button"
          className="route-keypad__info-btn"
          aria-label="What is Route From Parent?"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="9" y="8" width="2" height="6" rx="1" fill="currentColor" />
            <rect x="9" y="5" width="2" height="2" rx="1" fill="currentColor" />
          </svg>
          {showTooltip && (
            <span className="route-keypad__tooltip" role="tooltip">
              Select which keypress from the parent menu routes to this block.
              Only keys within the available option count are enabled.
            </span>
          )}
        </button>
      </div>

      {/* ── 3×3 Keypad ── */}
      <div className="route-keypad__grid">
        {DIGITS.map(digit => {
          const isSelected = selectedDigit === digit;
          const isOptionAvailable = Number(digit) <= clampedAvailableCount;
          return (
            <button
              key={digit}
              type="button"
              className={[
                'route-keypad__key',
                isSelected ? 'route-keypad__key--selected' : '',
                !isOptionAvailable || disabled ? 'route-keypad__key--locked' : '',
              ].filter(Boolean).join(' ')}
              aria-label={`Route option ${digit}`}
              aria-pressed={isSelected}
              disabled={disabled || !isOptionAvailable}
              onClick={() => handleSelect(digit)}
            >
              <span className="route-keypad__digit">{digit}</span>
            </button>
          );
        })}
      </div>

      {/* ── Selection badge ── */}
      <div className="route-keypad__footer">
        {selectedDigit ? (
          <span className="route-keypad__selection-badge">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 10l5 5 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Press {selectedDigit} selected
          </span>
        ) : (
          <span className="route-keypad__selection-empty">No key selected</span>
        )}
        <span className="route-keypad__avail">{clampedAvailableCount} option{clampedAvailableCount !== 1 ? 's' : ''} available</span>
      </div>

    </div>
  );
}
