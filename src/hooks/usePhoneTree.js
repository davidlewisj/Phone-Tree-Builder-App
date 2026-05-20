import { useState, useEffect } from 'react';

const STORAGE_KEY = 'phone-tree-contacts';

function genId() {
  return crypto.randomUUID();
}

const SAMPLE_DATA = [
  { id: '1', name: 'Front Desk',    phone: '555-0100', role: 'Director', blockType: 'Main Line',   parentId: null },
  { id: '2', name: 'Sleep Lab',     phone: '555-0101', role: 'Manager',  blockType: 'Department',  parentId: '1' },
  { id: '3', name: 'Billing Dept',  phone: '555-0102', role: 'Manager',  blockType: 'Department',  parentId: '1' },
  { id: '4', name: 'Check-In Desk', phone: '555-0103', role: 'Staff',    blockType: 'Reception',   parentId: '2' },
  { id: '5', name: 'General VM',    phone: '',         role: 'Staff',    blockType: 'Voicemail',   parentId: '2' },
  { id: '6', name: 'On-Call Line',  phone: '555-0199', role: 'Staff',    blockType: 'After Hours', parentId: '1' },
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

  function addContact({ name, phone, role, blockType, parentId }) {
    const newContact = {
      id: genId(),
      name,
      phone: phone ?? '',
      role: role ?? '',
      blockType: blockType ?? '',
      parentId: parentId ?? null,
    };
    setContacts(prev => [...prev, newContact]);
    return newContact;
  }

  function updateContact(id, updates) {
    setContacts(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              name: updates.name ?? c.name,
              phone: updates.phone ?? c.phone,
              role: updates.role ?? c.role,
              blockType: updates.blockType !== undefined ? updates.blockType : c.blockType,
            }
          : c
      )
    );
  }

  function removeContact(id) {
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
