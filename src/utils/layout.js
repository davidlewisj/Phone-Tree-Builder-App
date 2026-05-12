const NODE_WIDTH = 200;
const NODE_HEIGHT = 90;
const H_GAP = 40;
const V_GAP = 80;

// Compute the minimum subtree width needed for a node and its descendants
function subtreeWidth(id, childrenMap) {
  const children = childrenMap.get(id) ?? [];
  if (children.length === 0) return NODE_WIDTH;
  const total = children.reduce((sum, child) => sum + subtreeWidth(child.id, childrenMap), 0);
  return Math.max(NODE_WIDTH, total + H_GAP * (children.length - 1));
}

// Recursively assign x, y positions
function assignPositions(id, x, y, childrenMap, positions) {
  positions.set(id, { x, y });
  const children = childrenMap.get(id) ?? [];
  if (children.length === 0) return;

  const totalWidth = children.reduce((sum, child) => sum + subtreeWidth(child.id, childrenMap), 0)
    + H_GAP * (children.length - 1);

  let curX = x - totalWidth / 2;
  const childY = y + NODE_HEIGHT + V_GAP;

  for (const child of children) {
    const w = subtreeWidth(child.id, childrenMap);
    assignPositions(child.id, curX + w / 2, childY, childrenMap, positions);
    curX += w + H_GAP;
  }
}

export function buildLayout(contacts) {
  const childrenMap = new Map();
  const roots = [];

  for (const c of contacts) {
    if (!childrenMap.has(c.id)) childrenMap.set(c.id, []);
    if (c.parentId === null) {
      roots.push(c);
    } else {
      if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
      childrenMap.get(c.parentId).push(c);
    }
  }

  const positions = new Map();

  if (roots.length === 1) {
    assignPositions(roots[0].id, 0, 0, childrenMap, positions);
  } else {
    // Multiple roots side by side
    let curX = 0;
    for (const root of roots) {
      const w = subtreeWidth(root.id, childrenMap);
      assignPositions(root.id, curX + w / 2, 0, childrenMap, positions);
      curX += w + H_GAP * 2;
    }
  }

  const nodes = contacts.map(c => {
    const pos = positions.get(c.id) ?? { x: 0, y: 0 };
    return {
      id: c.id,
      type: 'contact',
      position: pos,
      data: { contact: c },
    };
  });

  const edges = contacts
    .filter(c => c.parentId !== null)
    .map(c => ({
      id: `e-${c.parentId}-${c.id}`,
      source: c.parentId,
      target: c.id,
      type: 'smoothstep',
    }));

  return { nodes, edges };
}
