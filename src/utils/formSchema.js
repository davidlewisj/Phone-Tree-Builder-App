// Form schema system for block types
// Defines which fields should appear for each block type

export const BLOCK_FORM_FIELDS = {
  phone_tree: {
    sections: [
      { name: 'basic', title: 'Basic Info', fields: ['title', 'type', 'route', 'prompt'] },

    ],
  },
  phone_hours: {
    sections: [
      { name: 'basic', title: 'Basic Info', fields: ['title', 'type', 'route', 'prompt'] },
      { name: 'hours', title: 'Schedule', fields: ['hoursSchedule'] },
      { name: 'advanced', title: 'Advanced', fields: ['notes'] },
    ],
  },
  play_message: {
    sections: [
      { name: 'basic', title: 'Basic Info', fields: ['title', 'type', 'route', 'prompt'] },
      { name: 'audio', title: 'Audio', fields: ['audioFile'] },
      { name: 'advanced', title: 'Advanced', fields: ['notes'] },
    ],
  },
  voicemail: {
    sections: [
      { name: 'basic', title: 'Basic Info', fields: ['title', 'type', 'route', 'prompt'] },
      { name: 'sms', title: 'Auto-Text Template', fields: ['voicemailAutoTextTemplate'] },
      { name: 'audio', title: 'Audio', fields: ['audioFile'] },
      { name: 'advanced', title: 'Advanced', fields: ['notes'] },
    ],
  },
  call_queue: {
    sections: [
      { name: 'basic', title: 'Basic Info', fields: ['title', 'type', 'route', 'prompt'] },
      { name: 'advanced', title: 'Advanced', fields: ['notes'] },
    ],
  },
  call_group: {
    sections: [
      { name: 'basic', title: 'Basic Info', fields: ['title', 'type', 'route', 'prompt'] },
      { name: 'advanced', title: 'Advanced', fields: ['notes'] },
    ],
  },
  device: {
    sections: [
      { name: 'basic', title: 'Basic Info', fields: ['title', 'type', 'route', 'prompt'] },
      { name: 'advanced', title: 'Advanced', fields: ['notes'] },
    ],
  },
  forwarding_number: {
    sections: [
      { name: 'basic', title: 'Basic Info', fields: ['title', 'type', 'route', 'prompt'] },
      { name: 'advanced', title: 'Advanced', fields: ['notes'] },
    ],
  },
  call_route: {
    sections: [
      { name: 'basic', title: 'Basic Info', fields: ['title', 'type', 'route', 'prompt'] },
      { name: 'advanced', title: 'Advanced', fields: ['notes'] },
    ],
  },
};

export function getFormFieldsForType(blockType) {
  return BLOCK_FORM_FIELDS[blockType] || BLOCK_FORM_FIELDS.phone_tree;
}

export function shouldRenderField(blockType, fieldName) {
  const schema = getFormFieldsForType(blockType);
  return schema.sections.some(section => section.fields.includes(fieldName));
}
