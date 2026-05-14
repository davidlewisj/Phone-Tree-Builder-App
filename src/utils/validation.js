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
      warnings.push({ id: step.id, type: 'missing_title', message: `Block ${step.id} has no title` });
    }
    if (!step.prompt?.trim()) {
      warnings.push({ id: step.id, type: 'missing_prompt', message: `Block ${step.title} is missing its primary configuration` });
    }
    if (step.parentId && !step.route?.trim()) {
      warnings.push({ id: step.id, type: 'missing_route', message: `Block ${step.title} has no route condition` });
    }
    if ((step.type === 'play_message' || step.type === 'voicemail') && !step.audioDataUrl?.trim()) {
      warnings.push({
        id: step.id,
        type: 'missing_audio',
        message: `Block ${step.title} is missing an attached audio file`,
      });
    }

    // Check if parentId exists
    if (step.parentId && !blocks.find(c => c.id === step.parentId)) {
      errors.push({ id: step.id, type: 'orphaned', message: `Block ${step.title} references non-existent parent` });
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
      errors.push({ id: step.id, type: 'unreachable', message: `Block ${step.title} is unreachable` });
    }
  });

  return { errors, warnings };
}
