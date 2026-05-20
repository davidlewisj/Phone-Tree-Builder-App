import { useEffect, useRef } from 'react';

const PLACEHOLDER = 'Type your message here...';

export default function SmsPreviewField({ value, onChange }) {
  const editableRef = useRef(null);
  const isInternalChange = useRef(false);

  const messageText = value || '';
  const charCount = messageText.length;

  // Only sync innerText from props when the change came from outside
  // (e.g. loading saved data, switching blocks) — never while the user is typing.
  useEffect(() => {
    if (!editableRef.current) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editableRef.current.innerText !== messageText) {
      editableRef.current.innerText = messageText;
    }
  }, [messageText]);

  function handleInput(event) {
    isInternalChange.current = true;
    const nextText = event.currentTarget.innerText.replace(/\r?\n/g, ' ');
    if (nextText !== event.currentTarget.innerText) {
      event.currentTarget.innerText = nextText;
    }
    onChange(nextText);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }

  function handleBlur(event) {
    if (!event.currentTarget.innerText.trim()) {
      event.currentTarget.innerText = '';
      onChange('');
    }
  }

  function focusEditableAtEnd() {
    if (!editableRef.current) return;
    const editable = editableRef.current;
    editable.focus();

    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  return (
    <div className="sms-preview-card">
      <div
        className="sms-preview-card__bubble"
        role="group"
        aria-label="SMS preview"
        onClick={focusEditableAtEnd}
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
        />
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
