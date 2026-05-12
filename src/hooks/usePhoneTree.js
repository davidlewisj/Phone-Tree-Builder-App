import { useState, useEffect } from 'react';

const STORAGE_KEY = 'phone-tree-contacts';

function genId() {
  return crypto.randomUUID();
}

const SAMPLE_DATA = [
  { id: '1', name: 'Alice Johnson', phone: '555-0100', role: 'Director', parentId: null },
  { id: '2', name: 'Bob Smith', phone: '555-0101', role: 'Manager', parentId: '1' },
  { id: '3', name: 'Carol White', phone: '555-0102', role: 'Manager', parentId: '1' },
  { id: '4', name: 'Dave Brown', phone: '555-0103', role: 'Staff', parentId: '2' },
  { id: '5', name: 'Eve Davis', phone: '555-0104', role: 'Staff', parentId: '2' },
  { id: '6', name: 'Frank Lee', phone: '555-0105', role: 'Staff', parentId: '3' },
];

export function usePhoneTree() {
  const [contacts, setContacts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : SAMPLE_DATA;
    } catch {
      return SAMPLE_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  function addContact({ name, phone, role, parentId }) {
    const newContact = { id: genId(), name, phone, role, parentId: parentId ?? null };
    setContacts(prev => [...prev, newContact]);
    return newContact;
  }

  function updateContact(id, updates) {
    setContacts(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  }

  function removeContact(id) {
    // Also remove all descendants
    setContacts(prev => {
      const toRemove = new Set();
      const queue = [id];
      while (queue.length) {
        const current = queue.shift();
        toRemove.add(current);
        prev.filter(c => c.parentId === current).forEach(c => queue.push(c.id));
      }
      return prev.filter(c => !toRemove.has(c.id));
    });
  }

  function getChildren(parentId) {
    return contacts.filter(c => c.parentId === parentId);
  }

  function getRoots() {
    return contacts.filter(c => c.parentId === null);
  }

  return { contacts, addContact, updateContact, removeContact, getChildren, getRoots };
}
