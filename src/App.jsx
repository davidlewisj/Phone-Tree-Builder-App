import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { usePhoneTree } from './hooks/usePhoneTree';
import { buildLayout } from './utils/layout';
import { BLOCK_TYPE_OPTIONS } from './utils/blockTypes';
import { validateFlow } from './utils/validation';
import BlockNode from './components/BlockNode';
import BlockForm from './components/BlockForm';
import ExportImportModal from './components/ExportImportModal';
import AddChildEdge from './components/AddChildEdge';
import BlockCatalogModal from './components/BlockCatalogModal';
import BlockTypeIcon from './components/BlockTypeIcon';
import BlockTypeDropdown from './components/BlockTypeDropdown';
import SmsPreviewField from './components/SmsPreviewField';
import CopyButton from './components/CopyButton';
import HoursScheduleEditor from './components/HoursScheduleEditor';
import RouteFromParentKeypad from './components/RouteFromParentKeypad';
import './App.css';

import SuggestionsDropdown from './components/SuggestionsDropdown';

const NODE_TYPES = { block: BlockNode };
const EDGE_TYPES = { addChild: AddChildEdge };
const DND_TYPE = 'application/ivr-step-type';
const SIDEBAR_WIDTH_KEY = 'phone-tree-sidebar-width';
const SIDEBAR_MIN_WIDTH = 260;
const SIDEBAR_MAX_WIDTH = 560;

function countByType(blocks, type) {
  return blocks.filter(c => c.type === type).length;
}

const WEEK_DAYS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

function createDefaultHoursSchedule() {
  return {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  };
}

function clampSidebarWidth(value) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
}

function isBlockDraftComplete(draft, canEditRoute) {
  if (!draft) return false;
  const hasTitle = Boolean(draft.title?.trim());
  const hasPrompt = Boolean(draft.prompt?.trim());
  const hasRoute = canEditRoute ? Boolean(draft.route?.trim()) : true;
  return hasTitle && hasPrompt && hasRoute;
}

function isProtectedScaffoldBlock(block, blocks) {
  if (!block) return false;

  if (block.type === 'phone_hours') {
    const greeting = blocks.find(candidate => candidate.id === block.parentId);
    const phoneTree = greeting ? blocks.find(candidate => candidate.id === greeting.parentId) : null;
    return greeting?.type === 'play_message' && phoneTree?.type === 'phone_tree';
  }

  if (block.type === 'play_message') {
    const phoneTree = blocks.find(candidate => candidate.id === block.parentId);
    const hasPhoneHoursChild = blocks.some(candidate => candidate.parentId === block.id && candidate.type === 'phone_hours');
    return phoneTree?.type === 'phone_tree' && hasPhoneHoursChild;
  }

  return false;
}

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#c00' }}>
          <h2>App Error</h2>
          <p>{this.state.error?.toString()}</p>
          <button onClick={() => this.setState({ hasError: false })}>Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function PhoneTreeInner({ blocks, addBlock, updateBlock, removeBlock, setBlocks }) {
  const [modal, setModal] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingBlockIds, setPendingBlockIds] = useState(() => new Set());
  const [draft, setDraft] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [history, setHistory] = useState([JSON.stringify(blocks)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportImport, setShowExportImport] = useState(false);
  const [catalogContext, setCatalogContext] = useState(null);
  const [draggingPaletteType, setDraggingPaletteType] = useState(null);
  const [previewDrop, setPreviewDrop] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(stored) ? clampSidebarWidth(stored) : 280;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const historyTimeoutRef = useRef(null);
  const sidebarResizeRef = useRef({ startX: 0, startWidth: 280 });
  const { fitView, screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  const onSidebarResizeStart = useCallback(
    event => {
      event.preventDefault();
      sidebarResizeRef.current = { startX: event.clientX, startWidth: sidebarWidth };
      setIsResizingSidebar(true);
    },
    [sidebarWidth]
  );

  useEffect(() => {
    if (!isResizingSidebar) return;

    function handlePointerMove(event) {
      const delta = event.clientX - sidebarResizeRef.current.startX;
      const nextWidth = clampSidebarWidth(sidebarResizeRef.current.startWidth + delta);
      setSidebarWidth(nextWidth);
    }

    function handlePointerUp() {
      setIsResizingSidebar(false);
    }

    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [isResizingSidebar]);

  const validation = useMemo(() => validateFlow(blocks), [blocks]);
  const blocksWithWarnings = useMemo(() => new Set(validation.warnings.map(w => w.id)), [validation]);
  const blocksWithErrors = useMemo(() => new Set(validation.errors.map(e => e.id)), [validation]);

  // Filter blocks by search query
  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) return blocks;
    const q = searchQuery.toLowerCase();
    return blocks.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.prompt || '').toLowerCase().includes(q) ||
      (c.route || '').toLowerCase().includes(q)
    );
  }, [blocks, searchQuery]);

  // Track history snapshots on block changes (debounced)
  useEffect(() => {
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);

    historyTimeoutRef.current = setTimeout(() => {
      const snapshot = JSON.stringify(blocks);
      if (snapshot !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(snapshot);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }, 800);

    return () => {
      if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    };
  }, [blocks]);

  const blocksForLayout = filteredBlocks;

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(blocksForLayout),
    [blocksForLayout]
  );

  const enrichedEdges = useMemo(
    () => layoutEdges.map(edge => ({ ...edge, type: 'addChild' })),
    [layoutEdges]
  );

  const enrichedNodes = useMemo(
    () =>
      layoutNodes.map(n => ({
        ...n,
        className: [
          blocksWithErrors.has(n.id) && 'node--error',
          blocksWithWarnings.has(n.id) && 'node--warning',
        ].filter(Boolean).join(' '),
        data: {
          ...n.data,
          isPreview: n.id.startsWith('__preview__'),
          previewPlacement: previewDrop?.targetId === n.id ? previewDrop.placement : null,
          draggingPaletteType,
          hasError: blocksWithErrors.has(n.id),
          hasWarning: blocksWithWarnings.has(n.id),
          onEdit: block => setSelectedId(block.id),
          onDelete: block => {
            if (isProtectedScaffoldBlock(block, blocks)) {
              window.alert('This scaffold block is required for the phone tree and cannot be deleted directly.');
              return;
            }
            if (window.confirm(`Delete "${block.title}" and all downstream blocks?`)) {
              removeBlock(block.id);
              if (selectedId === block.id) setSelectedId(null);
            }
          },
          onAddChild: block => setCatalogContext({ mode: 'child', targetId: block.id }),
          onAddAbove: block => {
            if (block.parentId === null) return;
            setCatalogContext({ mode: 'above', targetId: block.id });
          },
          onNodeDragOver: (blockId, placement, draggedType) => {
            if (!draggedType) return;
            setPreviewDrop(current => {
              if (
                current &&
                current.targetId === blockId &&
                current.placement === placement &&
                current.type === draggedType
              ) {
                return current;
              }
              return { targetId: blockId, placement, type: draggedType };
            });
          },
          onNodeDragLeave: blockId => {
            setPreviewDrop(current => (current?.targetId === blockId ? null : current));
          },
          onNodeDropType: (block, placement, draggedType) => {
            if (!draggedType || !block?.id) return;

            if (placement === 'above' && block.parentId === null) return;

            let created = null;
            if (placement === 'above') {
              const parentId = block.parentId;
              created = addBlock({
                title: '',
                type: draggedType,
                route: '',
                prompt: '',

                parentId,
                position: null,
              });
              updateBlock(block.id, { parentId: created.id });
            } else {
              created = addBlock({
                title: '',
                type: draggedType,
                route: '',
                prompt: '',

                parentId: block.id,
                position: null,
              });
            }

            setPendingBlockIds(prev => {
              const next = new Set(prev);
              next.add(created.id);
              return next;
            });
            setSelectedId(created.id);

            setPreviewDrop(null);
            setDraggingPaletteType(null);
            setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 80);
          },
          onDuplicate: block => {
            addBlock({
              title: `${block.title} (copy)`,
              type: block.type,
              route: block.route,
              prompt: block.prompt,

              parentId: block.parentId,
              position: block.position ? { x: block.position.x + 60, y: block.position.y + 60 } : null,
            });
          },
        },
      })),
    [layoutNodes, previewDrop, draggingPaletteType, removeBlock, selectedId, blocksWithErrors, blocksWithWarnings, addBlock, blocks, updateBlock, fitView]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(enrichedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(enrichedEdges);

  useEffect(() => {
    setNodes(enrichedNodes);
  }, [enrichedNodes, setNodes]);

  useEffect(() => {
    setEdges(enrichedEdges);
  }, [enrichedEdges, setEdges]);

  function handleSave(formData) {
    if (modal.mode === 'add') {
      addBlock({
        ...formData,
        parentId: modal.parentBlock?.id ?? null,
        position: modal.initialPosition ?? null,
      });
    }
    setModal(null);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100);
  }

  function savePendingBlock() {
    if (!selectedBlock || !draft || !isPendingSelected || !isPendingDraftValid) return;

    updateBlock(selectedBlock.id, {
      title: draft.title,
      type: draft.type,
      route: canEditRoute ? draft.route : '',
      prompt: draft.prompt,
      voicemailAutoTextTemplate: draft.voicemailAutoTextTemplate || '',
      audioDataUrl: draft.audioDataUrl || '',
      audioFileName: draft.audioFileName || '',
      hoursSchedule: draft.hoursSchedule || null,

    });

    setPendingBlockIds(prev => {
      const next = new Set(prev);
      next.delete(selectedBlock.id);
      return next;
    });
    setSaveStatus('saved');
  }

  function cancelPendingBlock() {
    if (!selectedBlock || !isPendingSelected) return;
    removeBlock(selectedBlock.id);
    setPendingBlockIds(prev => {
      const next = new Set(prev);
      next.delete(selectedBlock.id);
      return next;
    });
    setSelectedId(null);
    setDraft(null);
  }

  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }

    const selected = blocks.find(c => c.id === selectedId);
    if (!selected) {
      setSelectedId(null);
      setDraft(null);
      return;
    }

    setDraft({
      title: selected.title,
      type: selected.type || 'phone_tree',
      route: selected.route || '',
      prompt: selected.prompt || '',
      voicemailAutoTextTemplate: selected.voicemailAutoTextTemplate || '',
      audioDataUrl: selected.audioDataUrl || '',
      audioFileName: selected.audioFileName || '',
      hoursSchedule: selected.hoursSchedule || createDefaultHoursSchedule(),

      parentId: selected.parentId,
    });
  }, [blocks, selectedId]);

  const selectedBlock = useMemo(() => blocks.find(c => c.id === selectedId) || null, [blocks, selectedId]);
  const isPhoneHoursBlock = Boolean(selectedBlock && selectedBlock.type === 'phone_hours');
  const canEditRoute = Boolean(selectedBlock && selectedBlock.parentId !== null && selectedBlock.type !== 'phone_hours');
  const isPendingSelected = Boolean(selectedBlock && pendingBlockIds.has(selectedBlock.id));
  const isPendingDraftValid = isBlockDraftComplete(draft, canEditRoute);
  const isTriggerBlock = Boolean(selectedBlock && selectedBlock.parentId === null);
  const isProtectedSelectedBlock = Boolean(selectedBlock && isProtectedScaffoldBlock(selectedBlock, blocks));
  const isPlayMessageBlock = Boolean(selectedBlock && selectedBlock.type === 'play_message');
  const isVoicemailBlock = Boolean(selectedBlock && selectedBlock.type === 'voicemail');
  const routeOptionCount = useMemo(() => {
    if (!selectedBlock || selectedBlock.parentId === null) return 0;
    return Math.min(9, blocks.filter(block => block.parentId === selectedBlock.parentId).length);
  }, [blocks, selectedBlock]);

  const onDragStart = useCallback((event, blockType) => {
    event.dataTransfer.setData(DND_TYPE, blockType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingPaletteType(blockType);
  }, []);

  const onDragOver = useCallback(event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const overNode = event.target instanceof Element && event.target.closest('.block-node');
    if (!overNode) {
      setPreviewDrop(null);
    }
  }, []);

  const onDrop = useCallback(
    event => {
      event.preventDefault();
      const blockType = event.dataTransfer.getData(DND_TYPE);
      if (!blockType) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const created = addBlock({
        title: '',
        type: blockType,
        route: '',
        prompt: '',

        parentId: null,
        position,
      });
      setPendingBlockIds(prev => {
        const next = new Set(prev);
        next.add(created.id);
        return next;
      });
      setSelectedId(created.id);
      setDraggingPaletteType(null);
      setPreviewDrop(null);
    },
    [screenToFlowPosition, addBlock]
  );

  const onConnect = useCallback(
    connection => {
      if (!connection.source || !connection.target || connection.source === connection.target) return;

      const target = blocks.find(c => c.id === connection.target);
      updateBlock(connection.target, {
        parentId: connection.source,
        type: target?.type || 'phone_tree',
        route: target?.route || 'New route',
      });
    },
    [blocks, updateBlock]
  );

  const onNodeClick = useCallback((_event, node) => {
    setSelectedId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'd') {
          e.preventDefault();
          if (selectedId) duplicateBlock();
        } else if (e.key === 'f') {
          e.preventDefault();
          document.querySelector('.search-input')?.focus();
        }
      } else if (e.key === 'Delete' && selectedId) {
        e.preventDefault();
        deleteSelected();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  function duplicateBlock() {
    if (!selectedBlock) return;
    addBlock({
      title: `${selectedBlock.title} (copy)`,
      type: selectedBlock.type,
      route: selectedBlock.route,
      prompt: selectedBlock.prompt,
      voicemailAutoTextTemplate: selectedBlock.voicemailAutoTextTemplate,
      audioDataUrl: selectedBlock.audioDataUrl,
      audioFileName: selectedBlock.audioFileName,
      hoursSchedule: selectedBlock.hoursSchedule,

      parentId: selectedBlock.parentId,
      position: selectedBlock.position ? { x: selectedBlock.position.x + 60, y: selectedBlock.position.y + 60 } : null,
    });
  }

  function handleAudioUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result;
      if (typeof content !== 'string') return;
      setDraft(prev => ({
        ...prev,
        audioDataUrl: content,
        audioFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  }

  function clearAudioFile() {
    setDraft(prev => ({
      ...prev,
      audioDataUrl: '',
      audioFileName: '',
    }));
  }

  // Auto-save with debounce
  useEffect(() => {
    if (!selectedBlock || !draft || !draft.title.trim() || pendingBlockIds.has(selectedBlock.id)) return;

    setSaveStatus('saving');
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    autoSaveTimeoutRef.current = setTimeout(() => {
      updateBlock(selectedBlock.id, {
        title: isTriggerBlock ? 'Incoming Caller' : draft.title,
        type: draft.type,
        route: canEditRoute ? draft.route : '',
        prompt: draft.prompt,
        voicemailAutoTextTemplate: draft.voicemailAutoTextTemplate || '',
        audioDataUrl: draft.audioDataUrl || '',
        audioFileName: draft.audioFileName || '',
        hoursSchedule: draft.hoursSchedule || null,

      });
      setSaveStatus('saved');
    }, 600);

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [draft, selectedBlock, isTriggerBlock, canEditRoute, updateBlock, pendingBlockIds]);

  function deleteSelected() {
    if (!selectedBlock) return;
    if (isProtectedSelectedBlock) {
      window.alert('This scaffold block is required for the phone tree and cannot be deleted directly.');
      return;
    }
    if (window.confirm(`Delete "${selectedBlock.title}" and all downstream blocks?`)) {
      removeBlock(selectedBlock.id);
      setPendingBlockIds(prev => {
        const next = new Set(prev);
        next.delete(selectedBlock.id);
        return next;
      });
      setSelectedId(null);
    }
  }

  function handleCatalogSelect(type) {
    if (!catalogContext?.targetId) return;

    const targetBlock = blocks.find(c => c.id === catalogContext.targetId);
    if (!targetBlock) {
      setCatalogContext(null);
      return;
    }

    let created = null;

    if (catalogContext.mode === 'above') {
      if (targetBlock.parentId === null) {
        setCatalogContext(null);
        return;
      }

      const parentId = targetBlock.parentId;
      created = addBlock({
        title: '',
        type,
        route: '',
        prompt: '',

        parentId,
        position: null,
      });

      updateBlock(targetBlock.id, { parentId: created.id });
    } else {
      const parentId = targetBlock.id;
      created = addBlock({
        title: '',
        type,
        route: '',
        prompt: '',

        parentId,
        position: null,
      });
    }

    setPendingBlockIds(prev => {
      const next = new Set(prev);
      next.add(created.id);
      return next;
    });
    setCatalogContext(null);
    setSelectedId(created.id);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 80);
  }

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  function handleUndo() {
    if (!canUndo) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setBlocks(JSON.parse(history[newIndex]));
    setSelectedId(null);
    setPendingBlockIds(new Set());
  }

  function handleRedo() {
    if (!canRedo) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setBlocks(JSON.parse(history[newIndex]));
    setSelectedId(null);
    setPendingBlockIds(new Set());
  }

  const stats = {
    phoneTrees: countByType(blocks, 'phone_tree'),
    queues: countByType(blocks, 'call_queue'),
    groups: countByType(blocks, 'call_group'),
    voicemail: countByType(blocks, 'voicemail'),
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__left">
          <span className="app-kicker">IVR Studio</span>
          <h1 className="app-title">Phone Tree Routing Builder</h1>
          <span className="app-subtitle">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
          {validation.errors.length > 0 && (
            <span className="validation-badge validation-badge--error" title={validation.errors.map(e => e.message).join(', ')}>
              ⚠ {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {validation.warnings.length > 0 && validation.errors.length === 0 && (
            <span className="validation-badge validation-badge--warning" title={validation.warnings.map(w => w.message).join(', ')}>
              ℹ {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="app-header__search">
          <input
            type="text"
            className="search-input"
            placeholder="Search blocks (Ctrl+F)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="app-header__actions">
          <button className="btn btn--ghost" title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={!canUndo}>
            ↶ Undo
          </button>
          <button className="btn btn--ghost" title="Redo (Ctrl+Y)" onClick={handleRedo} disabled={!canRedo}>
            ↷ Redo
          </button>
          <button className="btn btn--ghost" onClick={() => fitView({ padding: 0.2, duration: 400 })}>
            Fit Flow
          </button>
          <button className="btn btn--ghost" title="Export / Import" onClick={() => setShowExportImport(true)}>
            📥 Import / Export
          </button>
          <button className="btn btn--primary" onClick={() => setModal({ mode: 'add', parentBlock: null })}>
            + Add Starting Block
          </button>
        </div>
      </header>

      <div
        className={`workspace ${isResizingSidebar ? 'workspace--resizing' : ''}`}
        style={{ '--sidebar-width': `${sidebarWidth}px` }}
      >
        <aside className="inspector">
          <h2 className="inspector__title">Phone Tree Overview</h2>
          <div className="inspector__metrics">
            <div className="metric-card">
              <span className="metric-card__label">Phone Trees</span>
              <span className="metric-card__value">{stats.phoneTrees}</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__label">Call Queues</span>
              <span className="metric-card__value">{stats.queues}</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__label">Call Groups</span>
              <span className="metric-card__value">{stats.groups}</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__label">Voicemail</span>
              <span className="metric-card__value">{stats.voicemail}</span>
            </div>
          </div>
          <div className="inspector__block">
            <h3>Routing Tips</h3>
            <p>Use Phone Tree blocks for IVR menus and Call Route blocks for reusable internal routing.</p>
            <p>Use Call Queue, Call Group, Device, and Forwarding Number blocks to define exactly how callers land.</p>
          </div>

          <div className="inspector__block">
            <h3>Selected Block</h3>
            {!selectedBlock || !draft ? (
              <p>Select a block in the canvas to edit call handling details.</p>
            ) : isTriggerBlock ? (
              <div className="inspector__read-only">
                <p>This is the master trigger node for the phone tree.</p>
                <p>It stays fixed as <strong>Incoming Caller</strong> and acts as the starting label for everything below it.</p>
              </div>
            ) : (
              <form
                className="inspector-form"
              >
                <label className="form-label">
                  <span>Block Label</span>
                  <input
                    className="form-input"
                    value={draft.title}
                    onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <label className="form-label">
                  <span>Block Type</span>
                  <BlockTypeDropdown
                    value={draft.type}
                    onChange={type => setDraft(prev => ({ ...prev, type }))}
                    disabled={isPhoneHoursBlock}
                  />
                </label>
                <label className="form-label">
                  <span>Route From Parent</span>
                  <RouteFromParentKeypad
                    value={canEditRoute ? draft.route : ''}
                    onChange={nextRoute => {
                      setDraft(prev => ({ ...prev, route: nextRoute }));
                      if (!selectedBlock || !canEditRoute) return;
                      updateBlock(selectedBlock.id, { route: nextRoute });
                    }}
                    disabled={!canEditRoute}
                    availableCount={routeOptionCount}
                  />
                </label>
                {isPlayMessageBlock || isVoicemailBlock ? (
                  <label className="form-label">
                    <div className="form-label__header">
                      <span>{isVoicemailBlock ? 'Voicemail Script' : 'Message Script'}</span>
                      <CopyButton text={draft.prompt} title="Copy script" />
                    </div>
                    <textarea
                      className="form-input"
                      value={draft.prompt}
                      onChange={event => setDraft(prev => ({ ...prev, prompt: event.target.value }))}
                      placeholder={
                        isVoicemailBlock
                          ? 'Enter the voicemail greeting script callers will hear'
                          : 'Enter the full script to be spoken in this message'
                      }
                      rows={4}
                    />
                  </label>
                ) : (
                  <label className="form-label" style={{ position: 'relative', display: 'block' }}>
                    <span>Handling Instructions</span>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        className="form-input"
                        value={draft.prompt}
                        onChange={event => setDraft(prev => ({ ...prev, prompt: event.target.value }))}
                        placeholder="Describe what happens next"
                        style={{ width: '100%', paddingRight: 38 }}
                      />
                      <SuggestionsDropdown
                        suggestions={(() => {
                          const SUGGESTIONS = {
                            phone_tree: [
                              'Repeat menu if no input',
                              'Route to fallback after 3 failed attempts',
                              'Timeout after 10 seconds',
                              'Play error message on invalid input',
                            ],
                            call_queue: [
                              'Announce estimated wait time',
                              'Overflow to voicemail after 2 minutes',
                              'Play hold music',
                              'Allow caller to exit queue by pressing 0',
                            ],
                            call_group: [
                              'Ring all members simultaneously',
                              'Fallback to main menu if no answer',
                              'Send missed call notification',
                            ],
                            device: [
                              'Retry if busy',
                              'Forward to mobile after 3 rings',
                              'Log call for analytics',
                            ],
                            forwarding_number: [
                              'Confirm successful transfer',
                              'Retry if number is unreachable',
                              'Log external call details',
                            ],
                            call_route: [
                              'Jump to shared route',
                              'Return to previous menu after completion',
                            ],
                            voicemail: [
                              'Send email notification on new message',
                              'Auto-delete messages after 30 days',
                              'Play busy greeting after hours',
                            ],
                            play_message: [
                              'Repeat message once',
                              'Route to main menu after playback',
                              'Play alternate message after hours',
                            ],
                          };
                          return SUGGESTIONS[draft.type] || [];
                        })()}
                        onSelect={s => setDraft(prev => ({ ...prev, prompt: s }))}
                        icon={(
                          <svg viewBox="0 0 24 24" fill="none" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.5 13L7.28446 14.5689C7.54995 15.0999 7.68269 15.3654 7.86003 15.5954C8.01739 15.7996 8.20041 15.9826 8.40455 16.14C8.63462 16.3173 8.9001 16.4501 9.43108 16.7155L11 17.5L9.43108 18.2845C8.9001 18.5499 8.63462 18.6827 8.40455 18.86C8.20041 19.0174 8.01739 19.2004 7.86003 19.4046C7.68269 19.6346 7.54995 19.9001 7.28446 20.4311L6.5 22L5.71554 20.4311C5.45005 19.9001 5.31731 19.6346 5.13997 19.4046C4.98261 19.2004 4.79959 19.0174 4.59545 18.86C4.36538 18.6827 4.0999 18.5499 3.56892 18.2845L2 17.5L3.56892 16.7155C4.0999 16.4501 4.36538 16.3173 4.59545 16.14C4.79959 15.9826 4.98261 15.7996 5.13997 15.5954C5.31731 15.3654 5.45005 15.0999 5.71554 14.5689L6.5 13Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M15 2L16.1786 5.06442C16.4606 5.79765 16.6016 6.16426 16.8209 6.47264C17.0153 6.74595 17.254 6.98475 17.5274 7.17909C17.8357 7.39836 18.2024 7.53937 18.9356 7.82138L22 9L18.9356 10.1786C18.2024 10.4606 17.8357 10.6016 17.5274 10.8209C17.254 11.0153 17.0153 11.254 16.8209 11.5274C16.6016 11.8357 16.4606 12.2024 16.1786 12.9356L15 16L13.8214 12.9356C13.5394 12.2024 13.3984 11.8357 13.1791 11.5274C12.9847 11.254 12.746 11.0153 12.4726 10.8209C12.1643 10.6016 11.7976 10.4606 11.0644 10.1786L8 9L11.0644 7.82138C11.7976 7.53937 12.1643 7.39836 12.4726 7.17909C12.746 6.98475 12.9847 6.74595 13.1791 6.47264C13.3984 6.16426 13.5394 5.79765 13.8214 5.06442L15 2Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        buttonClassName="suggestions-inside-input"
                      />
                    </div>
                  </label>
                )}
                {isVoicemailBlock && (
                  <div className="form-label">
                    <div className="form-label__header">
                      <span>Auto-Text Template</span>
                      <CopyButton text={draft.voicemailAutoTextTemplate} title="Copy message" />
                    </div>
                    <SmsPreviewField
                      value={draft.voicemailAutoTextTemplate || ''}
                      onChange={nextText => setDraft(prev => ({ ...prev, voicemailAutoTextTemplate: nextText }))}
                    />
                  </div>
                )}


                {(isPlayMessageBlock || isVoicemailBlock) && (
                  <div className="inspector-special">
                    <span className="inspector-special__header">{isVoicemailBlock ? 'Voicemail Audio File' : 'Play Message Audio File'}</span>
                    <label className="form-label">
                      <input
                        type="file"
                        accept="audio/*"
                        className="form-input form-input--file"
                        onChange={handleAudioUpload}
                      />
                    </label>
                    {draft.audioFileName && (
                      <p className="form-label__hint">Current file: {draft.audioFileName}</p>
                    )}
                    {draft.audioDataUrl && (
                      <audio className="audio-preview" controls src={draft.audioDataUrl} />
                    )}
                    {draft.audioDataUrl && (
                      <button type="button" className="btn btn--ghost" onClick={clearAudioFile}>
                        Remove Audio File
                      </button>
                    )}
                  </div>
                )}

                {isPhoneHoursBlock && (
                  <HoursScheduleEditor
                    hoursSchedule={draft.hoursSchedule}
                    onChange={updated => setDraft(prev => ({ ...prev, hoursSchedule: updated }))}
                    createDefaultSchedule={createDefaultHoursSchedule}
                  />
                )}

                <div className="inspector-form__status">
                  <span className={`status-badge status-badge--${isPendingSelected ? 'saving' : saveStatus}`}>
                    {isPendingSelected
                      ? (isPendingDraftValid ? 'Ready to save' : 'Complete required fields')
                      : saveStatus === 'saved'
                      ? '✓ Saved'
                      : 'Saving...'}
                  </span>
                </div>
                <div className="inspector-form__actions">
                  {isPendingSelected ? (
                    <>
                      <button type="button" className="btn btn--secondary" onClick={cancelPendingBlock}>
                        Cancel New Block
                      </button>
                      <button type="button" className="btn btn--primary" onClick={savePendingBlock} disabled={!isPendingDraftValid}>
                        Save Block
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn--secondary" onClick={duplicateBlock} title="Ctrl+D">
                        📋 Duplicate
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={deleteSelected}
                        disabled={isProtectedSelectedBlock}
                        title={isProtectedSelectedBlock ? 'Required scaffold block' : undefined}
                      >
                        Delete Block
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </div>


          <button className="btn btn--secondary" onClick={() => setModal({ mode: 'add', parentBlock: null })}>
            Add Starting Block
          </button>
          <div className="palette">
            <h3>Drag New Block</h3>
            <div className="palette__grid">
              {BLOCK_TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className="palette__item"
                  draggable
                  onDragStart={event => onDragStart(event, value)}
                  onDragEnd={() => {
                    setDraggingPaletteType(null);
                    setPreviewDrop(null);
                  }}
                >
                  <span className={`palette__item-icon block-node__type--${value}`} aria-hidden="true">
                    <BlockTypeIcon type={value} title={label} />
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div
          className="sidebar-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={onSidebarResizeStart}
        />

        <div className={`flow-container${draggingPaletteType ? ' flow-container--dragging' : ''}`}>
          {blocks.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__text">No call flow blocks yet.</p>
              <button className="btn btn--primary" onClick={() => setModal({ mode: 'add', parentBlock: null })}>
                Add your starting block
              </button>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              edgeTypes={EDGE_TYPES}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={NODE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={2}
              nodesDraggable={false}
              nodesConnectable
              elementsSelectable
            >
              <Background gap={18} color="#b4bfd7" />
              <Controls showInteractive={false} />
              <MiniMap nodeStrokeWidth={2} zoomable pannable />
            </ReactFlow>
          )}
        </div>
      </div>

      {modal && (
        <BlockForm
          initial={modal.mode === 'edit' ? modal.block : null}
          defaults={
            modal.mode === 'add'
              ? { type: modal.initialType || 'phone_tree' }
              : null
          }
          dialogTitle={modal.dialogTitle}
          parentName={modal.parentBlock?.title}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}

      {showExportImport && (
        <ExportImportModal
          blocks={blocks}
          onImport={imported => {
            setBlocks(imported);
            setSelectedId(null);
            setSearchQuery('');
            setPendingBlockIds(new Set());
          }}
          onCancel={() => setShowExportImport(false)}
        />
      )}

      {catalogContext && (
        <BlockCatalogModal
          parentTitle={blocks.find(c => c.id === catalogContext.targetId)?.title || 'Selected Block'}
          mode={catalogContext.mode}
          onSelect={handleCatalogSelect}
          onCancel={() => setCatalogContext(null)}
        />
      )}
    </div>
  );
}

function AppWithProvider() {
  try {
    const tree = usePhoneTree();
    if (!tree || !tree.blocks) {
      return <div style={{ padding: '20px', color: 'red' }}>Error: usePhoneTree() returned invalid data</div>;
    }
    return (
      <ReactFlowProvider>
        <PhoneTreeInner {...tree} />
      </ReactFlowProvider>
    );
  } catch (error) {
    return (
      <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        <h2>Error in AppWithProvider</h2>
        <p>{error?.toString()}</p>
        <pre>{error?.stack}</pre>
      </div>
    );
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppWithProvider />
    </ErrorBoundary>
  );
}
