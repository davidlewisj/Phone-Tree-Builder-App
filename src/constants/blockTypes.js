// Single source of truth for block type metadata
export const BLOCK_TYPE_META = {
  'Main Line':   { icon: '📞', cssKey: 'main-line' },
  'Department':  { icon: '🏢', cssKey: 'department' },
  'Reception':   { icon: '🛎️', cssKey: 'reception' },
  'Manager':     { icon: '👤', cssKey: 'manager' },
  'Person':      { icon: '🙍', cssKey: 'person' },
  'Extension':   { icon: '🔢', cssKey: 'extension' },
  'Voicemail':   { icon: '📬', cssKey: 'voicemail' },
  'After Hours': { icon: '🌙', cssKey: 'after-hours' },
  'Custom':      { icon: '✏️', cssKey: 'custom' },
};

export const BLOCK_TYPES = Object.keys(BLOCK_TYPE_META);

export function getBlockMeta(blockType) {
  return BLOCK_TYPE_META[blockType] || { icon: '📌', cssKey: 'custom' };
}
