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
  const selectedRouteLabel = selectedDigit ? `Press ${selectedDigit}` : 'Not set';
  const clampedAvailableCount = Math.max(0, Math.min(9, availableCount));
  const [showTooltip, setShowTooltip] = useState(false);

  function handleSelect(digit) {
    if (disabled) return;
    if (Number(digit) > clampedAvailableCount) return;
    onChange(`Press ${digit}`);
  }

  return (
    <div className="route-keypad route-keypad--modern" role="group" aria-label="Route from parent options">
      <div className="route-keypad__header">
        <span className="route-keypad__title">Route From Parent</span>
        <span
          className="route-keypad__info-icon"
          tabIndex={0}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-label="Info">
            <circle cx="10" cy="10" r="9" stroke="#1266f1" strokeWidth="2" fill="#f8fbff" />
            <rect x="9" y="8" width="2" height="6" rx="1" fill="#1266f1" />
            <rect x="9" y="5" width="2" height="2" rx="1" fill="#1266f1" />
          </svg>
          {showTooltip && (
            <span className="route-keypad__tooltip">
              Select which key from the parent menu routes to this block. Only available keys are enabled.
            </span>
          )}
        </span>
      </div>
      <div className="route-keypad__grid">
        {DIGITS.map(digit => {
          const isSelected = selectedDigit === digit;
          const isOptionAvailable = Number(digit) <= clampedAvailableCount;
          return (
            <button
              key={digit}
              type="button"
              className={`route-keypad__key${isSelected ? ' route-keypad__key--selected' : ''}`}
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
      <div className="route-keypad__helper">Selected: {selectedRouteLabel}</div>
    </div>
  );
}
