import { useEffect, useRef } from 'react';

const PLACEHOLDER = 'Type your message here...';

export default function SmsPreviewField({ value, onChange }) {
  const editableRef = useRef(null);
  const isInternalChange = useRef(false);

  const messageText = value || '';
  const charCount = messageText.length;

  // Sync DOM from props only when the value changes externally
  // (e.g. switching selected block). Never during active typing.
  useEffect(() => {
    if (!editableRef.current) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const current = editableRef.current.innerText;
    if (current !== messageText) {
      editableRef.current.innerText = messageText;
    }
  }, [messageText]);

  function handleInput(event) {
    isInternalChange.current = true;
    // plaintext-only contentEditable already strips HTML & newlines on modern browsers.
    // Fall back to manual strip for older browsers.
    const raw = event.currentTarget.innerText ?? '';
    const next = raw.replace(/[\r\n]+/g, ' ');
    onChange(next);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }

  function handleBlur(event) {
    const text = event.currentTarget.innerText?.trim() ?? '';
    if (!text) {
      event.currentTarget.innerText = '';
      onChange('');
    }
  }


  function handleClick() {
    if (!editableRef.current) return;
    const editable = editableRef.current;
    editable.focus();

    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editableRef.current);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  return (
    <div className="sms-preview-card">
      <div
        className="sms-preview-card__bubble"
        role="group"
        aria-label="SMS preview"
        onClick={handleClick}
      >
        <span
          ref={editableRef}
          className="sms-preview-card__editable"
          contentEditable="true"
          suppressContentEditableWarning
          spellCheck="true"
          data-placeholder={PLACEHOLDER}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          aria-label="SMS message template"
          onClick={e => {
            if (document.designMode === 'off' || document.body.contentEditable === 'inherit') {
              // eslint-disable-next-line no-console
              console.warn('Document is not editable.');
            }
            focusEditableAtEnd();
          }}
          style={{
            userSelect: 'text',
            WebkitUserSelect: 'text',
            pointerEvents: 'auto',
            background: 'rgba(255,255,0,0.08)'
          }}
        >Test edit me</span>
      </div>

      <div className="sms-preview-card__actions">
        <span className="sms-preview-card__count">{charCount} characters</span>
      </div>

      <div className="sms-preview-card__hint">
        <i className="ti ti-pencil" aria-hidden="true" />
        <span>Click the message above to edit it</span>
      </div>
    </div>
  );
}
