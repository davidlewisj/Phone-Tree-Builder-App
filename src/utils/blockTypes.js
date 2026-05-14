export const BLOCK_TYPE_DEFINITIONS = [
  {
    value: 'phone_tree',
    label: 'Phone Tree',
    icon: 'PT',
    category: 'Routing',
    description: 'IVR menu node that collects caller input and branches the flow.',
    defaultTitle: 'Main Phone Tree',
    titlePlaceholder: 'e.g. Main Phone Tree',
    promptLabel: 'Menu Prompt',
    promptPlaceholder: 'e.g. Thanks for calling. Press 1 for sales, 2 for support.',
    routePlaceholder: 'e.g. Press 1',

  },
  {
    value: 'call_queue',
    label: 'Call Queue',
    icon: 'CQ',
    category: 'Distribution',
    description: 'Wait-for-agent node that holds callers until an agent is available.',
    defaultTitle: 'Support Queue',
    titlePlaceholder: 'e.g. Support Queue',
    promptLabel: 'Queue Configuration',
    promptPlaceholder: 'e.g. Tier 1 queue with hold music and estimated wait time.',
    routePlaceholder: 'e.g. Press 2',

  },
  {
    value: 'call_group',
    label: 'Call Group',
    icon: 'CG',
    category: 'Distribution',
    description: 'Multi-destination ring node that alerts several internal endpoints.',
    defaultTitle: 'Reception Call Group',
    titlePlaceholder: 'e.g. Reception Call Group',
    promptLabel: 'Ring Strategy',
    promptPlaceholder: 'e.g. Ring Front Desk and Backup Device for 20 seconds.',
    routePlaceholder: 'e.g. Press 3',

  },
  {
    value: 'device',
    label: 'Device',
    icon: 'DV',
    category: 'Destinations',
    description: 'Single destination node that routes to one extension or device.',
    defaultTitle: 'Reception Desk Device',
    titlePlaceholder: 'e.g. Reception Desk Device',
    promptLabel: 'Device Destination',
    promptPlaceholder: 'e.g. Extension 100 desk phone.',
    routePlaceholder: 'e.g. Press 0',

  },
  {
    value: 'forwarding_number',
    label: 'Forwarding Number',
    icon: 'FN',
    category: 'Destinations',
    description: 'External transfer node that forwards to an outside phone number.',
    defaultTitle: 'After Hours Forwarding',
    titlePlaceholder: 'e.g. After Hours Forwarding',
    promptLabel: 'Forwarding Target',
    promptPlaceholder: 'e.g. Forward to +1 555 555 0100 after business hours.',
    routePlaceholder: 'e.g. After Hours',

  },
  {
    value: 'call_route',
    label: 'Call Route',
    icon: 'CR',
    category: 'Routing',
    description: 'Internal reusable route node that jumps callers to another shared flow.',
    defaultTitle: 'Shared Call Route',
    titlePlaceholder: 'e.g. Shared Call Route',
    promptLabel: 'Route Destination',
    promptPlaceholder: 'e.g. Route callers into the billing follow-up path.',
    routePlaceholder: 'e.g. Billing Requests',

  },
  {
    value: 'voicemail',
    label: 'Voicemail',
    icon: 'VM',
    category: 'Messaging',
    description: 'Record-message node that sends the caller to voicemail.',
    defaultTitle: 'General Voicemail',
    titlePlaceholder: 'e.g. General Voicemail',
    promptLabel: 'Voicemail Greeting',
    promptPlaceholder: 'e.g. Leave a message and we will return your call shortly.',
    routePlaceholder: 'e.g. No Answer',

  },
  {
    value: 'play_message',
    label: 'Play Message',
    icon: 'PM',
    category: 'Messaging',
    description: 'Informational audio node that plays a recorded or generated message.',
    defaultTitle: 'Greeting Message',
    titlePlaceholder: 'e.g. Greeting Message',
    promptLabel: 'Message Content',
    promptPlaceholder: 'e.g. Our office is currently closed. Please call back tomorrow.',
    routePlaceholder: 'e.g. Before Menu',

  },
];

export const BLOCK_TYPE_OPTIONS = BLOCK_TYPE_DEFINITIONS.map(({ value, label }) => ({ value, label }));

export const BLOCK_TYPE_CATEGORIES = Array.from(new Set(BLOCK_TYPE_DEFINITIONS.map(type => type.category)));

export const BLOCK_TYPE_MAP = Object.fromEntries(
  BLOCK_TYPE_DEFINITIONS.map(definition => [definition.value, definition])
);

export function getBlockTypeDefinition(type) {
  return BLOCK_TYPE_MAP[type] || BLOCK_TYPE_MAP.phone_tree;
}

export function groupBlockTypesByCategory() {
  return BLOCK_TYPE_CATEGORIES.map(category => ({
    category,
    items: BLOCK_TYPE_DEFINITIONS.filter(definition => definition.category === category),
  }));
}
