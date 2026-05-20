const SYSTEM_ROUTE_TYPES = new Set(['play_message', 'phone_hours', 'voicemail']);

function promptLabel(type) {
  if (type === 'play_message' || type === 'voicemail') return 'script';
  return 'handling instructions';
}

export function validateFlow(blocks) {
  const errors = [];
  const warnings = [];

  if (blocks.length === 0) {
    errors.push({ type: 'empty', message: 'Flow has no blocks' });
    return { errors, warnings };
  }

  const hasRootBlock = blocks.some(c => c.parentId === null);
  if (!hasRootBlock) {
    errors.push({ type: 'no_root', message: 'No starting block found' });
  }

  blocks.forEach(step => {
    if (!step.title?.trim()) {
      warnings.push({
        id: step.id,
        type: 'missing_title',
        message: `A block (id: ${step.id}) is missing a label — open it and add a name`,
      });
    }

    if (!step.prompt?.trim()) {
      warnings.push({
        id: step.id,
        type: 'missing_prompt',
        message: `"${step.title}" needs ${promptLabel(step.type)} — describe what happens at this step`,
      });
    }

    // Only warn on missing route for blocks that actually use keypad routing.
    // play_message, phone_hours, and voicemail use fixed/system routes.
    if (step.parentId && !SYSTEM_ROUTE_TYPES.has(step.type) && !step.route?.trim()) {
      warnings.push({
        id: step.id,
        type: 'missing_route',
        message: `"${step.title}" has no keypad route — assign a Press option so callers can reach it`,
      });
    }

    if ((step.type === 'play_message' || step.type === 'voicemail') && !step.audioDataUrl?.trim()) {
      warnings.push({
        id: step.id,
        type: 'missing_audio',
        message: `"${step.title}" needs an audio file — upload a recording or the block will play silence`,
      });
    }

    // Check if parentId exists
    if (step.parentId && !blocks.find(c => c.id === step.parentId)) {
      errors.push({
        id: step.id,
        type: 'orphaned',
        message: `"${step.title}" references a parent block that no longer exists`,
      });
    }
  });

  // Check for unreachable blocks
  const reachable = new Set();
  const queue = blocks.filter(c => c.parentId === null).map(c => c.id);
  while (queue.length) {
    const id = queue.shift();
    reachable.add(id);
    const children = blocks.filter(c => c.parentId === id);
    children.forEach(c => queue.push(c.id));
  }

  blocks.forEach(step => {
    if (!reachable.has(step.id)) {
      errors.push({
        id: step.id,
        type: 'unreachable',
        message: `"${step.title}" is unreachable — check that it has a valid parent connection`,
      });
    }
  });

  return { errors, warnings };
}
