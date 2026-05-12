import { useMemo, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { usePhoneTree } from './hooks/usePhoneTree';
import { buildLayout } from './utils/layout';
import ContactNode from './components/ContactNode';
import ContactForm from './components/ContactForm';
import './App.css';

const NODE_TYPES = { contact: ContactNode };

function PhoneTreeInner({ contacts, addContact, updateContact, removeContact }) {
  const [modal, setModal] = useState(null);
  const { fitView } = useReactFlow();

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(contacts),
    [contacts]
  );

  const enrichedNodes = useMemo(
    () =>
      layoutNodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          onEdit: contact => setModal({ mode: 'edit', contact }),
          onDelete: contact => {
            if (window.confirm(`Delete "${contact.name}" and all their contacts?`)) {
              removeContact(contact.id);
            }
          },
          onAddChild: contact => setModal({ mode: 'add', parentContact: contact }),
        },
      })),
    [layoutNodes, removeContact]
  );

  const [nodes, , onNodesChange] = useNodesState(enrichedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutEdges);

  function handleSave(formData) {
    if (modal.mode === 'edit') {
      updateContact(modal.contact.id, formData);
    } else {
      addContact({ ...formData, parentId: modal.parentContact?.id ?? null });
    }
    setModal(null);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__left">
          <h1 className="app-title">Phone Tree Builder</h1>
          <span className="app-subtitle">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn--primary" onClick={() => setModal({ mode: 'add', parentContact: null })}>
          + Add Root Contact
        </button>
      </header>

      <div className="flow-container">
        {contacts.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__text">No contacts yet.</p>
            <button className="btn btn--primary" onClick={() => setModal({ mode: 'add', parentContact: null })}>
              Add your first contact
            </button>
          </div>
        ) : (
          <ReactFlow
            nodes={enrichedNodes}
            edges={layoutEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <Background gap={20} color="#e5e7eb" />
            <Controls showInteractive={false} />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>
        )}
      </div>

      {modal && (
        <ContactForm
          initial={modal.mode === 'edit' ? modal.contact : null}
          parentName={modal.parentContact?.name}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  const tree = usePhoneTree();
  return (
    <ReactFlowProvider>
      <PhoneTreeInner {...tree} />
    </ReactFlowProvider>
  );
}
