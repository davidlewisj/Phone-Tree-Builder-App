const NODE_WIDTH = 240;
const NODE_HEIGHT = 130;
const H_GAP = 54;
const V_GAP = 88;

function parseRouteOption(route) {
  const normalized = `${route || ''}`.trim();
  if (!normalized) return null;
  const match = normalized.match(/[1-9]/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isInteger(value) && value >= 1 && value <= 9 ? value : null;
}

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

export function buildLayout(blocks) {
  const childrenMap = new Map();
  const insertionOrder = new Map();
  const roots = [];

  for (const [index, c] of blocks.entries()) {
    insertionOrder.set(c.id, index);
    if (!childrenMap.has(c.id)) childrenMap.set(c.id, []);
    if (c.parentId === null) {
      roots.push(c);
    } else {
      if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
      childrenMap.get(c.parentId).push(c);
    }
  }

  for (const [parentId, children] of childrenMap.entries()) {
    if (!children.length) continue;
    const sortedChildren = [...children].sort((a, b) => {
      const aRoute = parseRouteOption(a.route);
      const bRoute = parseRouteOption(b.route);

      if (aRoute !== null && bRoute !== null && aRoute !== bRoute) {
        return aRoute - bRoute;
      }
      if (aRoute !== null && bRoute === null) return -1;
      if (aRoute === null && bRoute !== null) return 1;

      const aIndex = insertionOrder.get(a.id) ?? 0;
      const bIndex = insertionOrder.get(b.id) ?? 0;
      return aIndex - bIndex;
    });

    childrenMap.set(parentId, sortedChildren);
  }

  const positions = new Map();

  if (roots.length === 1) {
    assignPositions(roots[0].id, 0, 0, childrenMap, positions);
  } else if (roots.length > 1) {
    // Multiple roots side by side
    const rootWidths = roots.map(root => subtreeWidth(root.id, childrenMap));
    const totalWidth = rootWidths.reduce((sum, w) => sum + w, 0) + H_GAP * 2 * (roots.length - 1);
    let curX = -totalWidth / 2;

    for (const root of roots) {
      const w = subtreeWidth(root.id, childrenMap);
      assignPositions(root.id, curX + w / 2, 0, childrenMap, positions);
      curX += w + H_GAP * 2;
    }
  }

  const siblingOrderMap = new Map();
  for (const [parentId, children] of childrenMap.entries()) {
    if (!children.length) continue;

    const sortedChildren = [...children].sort((a, b) => {
      const aPos = positions.get(a.id)?.x ?? 0;
      const bPos = positions.get(b.id)?.x ?? 0;
      return aPos - bPos;
    });

    sortedChildren.forEach((child, index) => {
      siblingOrderMap.set(child.id, index + 1);
    });
  }

  const nodes = blocks.map(c => {
    const pos = positions.get(c.id) ?? { x: 0, y: 0 };
    return {
      id: c.id,
      type: 'block',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y },
      data: {
        block: c,
        siblingRouteNumber: siblingOrderMap.get(c.id) ?? null,
      },
    };
  });

  const edges = blocks
    .filter(c => c.parentId !== null)
    .map(c => ({
      id: `e-${c.parentId}-${c.id}`,
      source: c.parentId,
      target: c.id,
      type: 'addChild',
      label: '',
    }));

  return { nodes, edges };
}
