import { useState, useEffect } from 'react';

export default function CopyButton({ text, title = 'Copy', feedbackDuration = 1800 }) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return undefined;
    const timeout = window.setTimeout(() => setIsCopied(false), feedbackDuration);
    return () => window.clearTimeout(timeout);
  }, [isCopied, feedbackDuration]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text || '');
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="form-label__copy"
      onClick={handleCopy}
      title={isCopied ? '✓ Copied!' : title}
    >
      <i className={`ti ${isCopied ? 'ti-check' : 'ti-copy'}`} aria-hidden="true" />
    </button>
  );
}
