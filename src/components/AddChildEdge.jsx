import { BaseEdge } from '@xyflow/react';

export default function AddChildEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }) {
  const xDelta = Math.abs(targetX - sourceX);
  const straightTolerance = 18;

  if (xDelta <= straightTolerance) {
    const straightPath = `M ${sourceX},${sourceY} L ${sourceX},${targetY}`;
    return <BaseEdge id={id} path={straightPath} markerEnd={markerEnd} style={style} />;
  }

  const verticalGap = Math.max(0, targetY - sourceY);
  const trunkLength = Math.max(24, Math.min(54, verticalGap * 0.25));
  const junctionY = sourceY + trunkLength;
  const edgePath = [
    `M ${sourceX},${sourceY}`,
    `L ${sourceX},${junctionY}`,
    `L ${targetX},${junctionY}`,
    `L ${targetX},${targetY}`,
  ].join(' ');
  return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />;
}
