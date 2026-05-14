import { useState } from 'react';

export default function ExportImportModal({ blocks, onImport, onCancel }) {
  const [activeTab, setActiveTab] = useState('export');
  const [format, setFormat] = useState('json');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState(null);

  function handleExport() {
    let content = blocks;
    let filename = `flow-${Date.now()}`;
    let fileType = 'application/json';

    if (format === 'yaml') {
      content = toYAML(blocks);
      fileType = 'application/x-yaml';
      filename += '.yaml';
    } else {
      content = JSON.stringify(blocks, null, 2);
      filename += '.json';
    }

    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toYAML(blocks) {
    const lines = ['blocks:'];
    blocks.forEach(step => {
      lines.push(`  - id: "${step.id}"`);
      lines.push(`    title: "${step.title || ''}"`);
      lines.push(`    type: ${step.type || 'action'}`);
      if (step.route) lines.push(`    route: "${step.route}"`);
      if (step.prompt) lines.push(`    prompt: "${step.prompt}"`);
      if (step.parentId) lines.push(`    parentId: "${step.parentId}"`);
      if (step.position) {
        lines.push(`    position:`);
        lines.push(`      x: ${Math.round(step.position.x)}`);
        lines.push(`      y: ${Math.round(step.position.y)}`);
      }
    });
    return lines.join('\n');
  }

  function handleImport() {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        throw new Error('Import must be a JSON array of blocks');
      }
      onImport(parsed);
      onCancel();
    } catch (err) {
      setImportError(err.message);
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result;
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          throw new Error('File must contain a JSON array of blocks');
        }
        onImport(parsed);
        onCancel();
      } catch (err) {
        setImportError(err.message);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal__title">Export / Import Flow</h2>
        
        <div className="export-import-tabs">
          <button
            className={`export-import-tab ${activeTab === 'export' ? 'export-import-tab--active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button
            className={`export-import-tab ${activeTab === 'import' ? 'export-import-tab--active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="export-import-content">
            <label className="form-label">
              Format
              <select
                className="form-input"
                value={format}
                onChange={e => setFormat(e.target.value)}
              >
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </label>
            <p className="form-label__hint">Download your flow as {format.toUpperCase()} for backup or version control.</p>
            <div className="form-actions">
              <button type="button" className="btn btn--secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={handleExport}>
                Download {format.toUpperCase()}
              </button>
            </div>
          </div>
        ) : (
          <div className="export-import-content">
            <label className="form-label">
              Import from File
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileSelect}
                className="form-input"
              />
            </label>
            <p className="form-label__hint">Or paste JSON below:</p>
            <textarea
              className="form-input form-textarea"
              value={importText}
              onChange={e => {
                setImportText(e.target.value);
                setImportError(null);
              }}
              placeholder='[{"id":"1","title":"Incoming Call",...}]'
              rows={6}
            />
            {importError && <p className="form-error">{importError}</p>}
            <div className="form-actions">
              <button type="button" className="btn btn--secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={handleImport} disabled={!importText.trim()}>
                Import
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
