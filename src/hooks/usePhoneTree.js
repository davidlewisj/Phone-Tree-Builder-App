import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'phone-tree-blocks';
const LEGACY_STORAGE_KEY = 'phone-tree-contacts';
const PHONE_HOURS_TYPE = 'phone_hours';
const MAX_ROUTE_OPTION = 9;

function genId() {
  return crypto.randomUUID();
}

function parseRouteOption(route) {
  const normalized = `${route || ''}`.trim();
  if (!normalized) return null;
  const match = normalized.match(/[1-9]/);
  if (!match) return null;
  const option = Number(match[0]);
  return Number.isInteger(option) && option >= 1 && option <= MAX_ROUTE_OPTION ? option : null;
}

function formatRouteOption(option) {
  return `Press ${option}`;
}

function findFirstAvailableOption(usedOptions, maxOption, excludeOption = null) {
  for (let option = 1; option <= maxOption; option += 1) {
    if (option === excludeOption) continue;
    if (!usedOptions.has(option)) return option;
  }
  return null;
}

function assignDefaultRouteForBlock(nextBlocks, blockId) {
  const target = nextBlocks.find(block => block.id === blockId);
  if (!target || target.parentId === null || target.type === PHONE_HOURS_TYPE) return;

  const siblings = nextBlocks.filter(block => block.parentId === target.parentId);
  const maxOption = Math.min(MAX_ROUTE_OPTION, siblings.length);
  if (maxOption < 1) {
    target.route = '';
    return;
  }

  const usedOptions = new Set(
    siblings
      .filter(block => block.id !== target.id)
      .map(block => parseRouteOption(block.route))
      .filter(option => option !== null)
  );

  const nextOption = findFirstAvailableOption(usedOptions, maxOption) ?? maxOption;
  target.route = formatRouteOption(nextOption);
}

function swapSiblingRoutes(nextBlocks, blockId, nextRoute) {
  const target = nextBlocks.find(block => block.id === blockId);
  if (!target || target.parentId === null || target.type === PHONE_HOURS_TYPE) {
    return;
  }

  const siblings = nextBlocks.filter(block => block.parentId === target.parentId);
  const maxOption = Math.min(MAX_ROUTE_OPTION, siblings.length);
  const desiredOption = parseRouteOption(nextRoute);

  if (!desiredOption || desiredOption > maxOption) {
    return;
  }

  const currentOption = parseRouteOption(target.route);
  let occupyingSibling = siblings.find(
    block => block.id !== target.id && parseRouteOption(block.route) === desiredOption
  );

  if (!occupyingSibling) {
    const siblingOrder = [...siblings].sort((a, b) => {
      const aOption = parseRouteOption(a.route);
      const bOption = parseRouteOption(b.route);

      if (aOption !== null && bOption !== null && aOption !== bOption) {
        return aOption - bOption;
      }
      if (aOption !== null && bOption === null) return -1;
      if (aOption === null && bOption !== null) return 1;

      const aIndex = nextBlocks.findIndex(block => block.id === a.id);
      const bIndex = nextBlocks.findIndex(block => block.id === b.id);
      return aIndex - bIndex;
    });

    const implicitSeatSibling = siblingOrder[desiredOption - 1] || null;
    if (implicitSeatSibling && implicitSeatSibling.id !== target.id) {
      occupyingSibling = implicitSeatSibling;
    }
  }

  target.route = formatRouteOption(desiredOption);

  if (!occupyingSibling) {
    return;
  }

  if (currentOption && currentOption <= maxOption) {
    occupyingSibling.route = formatRouteOption(currentOption);
    return;
  }

  const usedOptions = new Set(
    siblings
      .filter(block => block.id !== occupyingSibling.id)
      .map(block => parseRouteOption(block.route))
      .filter(option => option !== null)
  );

  const fallbackOption = findFirstAvailableOption(usedOptions, maxOption, desiredOption) ?? desiredOption;
  occupyingSibling.route = formatRouteOption(fallbackOption);
}

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

const SAMPLE_DATA = [
  {
    id: '1',
    title: 'Incoming Caller',
    type: 'phone_tree',
    route: '',
    prompt: 'Thank you for calling. Press 1 for sales, 2 for support, or 0 for reception.',

    parentId: null,
  },
  {
    id: '2',
    title: 'Greeting Message',
    type: 'play_message',
    route: '',
    prompt: 'Play the initial greeting before presenting hours and routing options.',
    audioDataUrl: '',
    audioFileName: '',
    notes: '',
    parentId: '1',
  },
  {
    id: '3',
    title: 'Phone Hours',
    type: PHONE_HOURS_TYPE,
    route: 'Availability',
    prompt: 'Share phone hours and present the main call routing options.',
    hoursSchedule: createDefaultHoursSchedule(),
    notes: '',
    parentId: '2',
  },
  {
    id: '4',
    title: 'Sales Queue',
    type: 'call_queue',
    route: 'Press 1',
    prompt: 'Queue callers for the sales team with hold music.',
    notes: '',
    parentId: '3',
  },
  {
    id: '5',
    title: 'Support Call Group',
    type: 'call_group',
    route: 'Press 2',
    prompt: 'Ring Tier 1 support devices together for 20 seconds.',
    notes: '',
    parentId: '3',
  },
  {
    id: '6',
    title: 'Reception Device',
    type: 'device',
    route: 'Press 0',
    prompt: 'Send directly to reception desk extension 100.',
    notes: '',
    parentId: '3',
  },
  {
    id: '7',
    title: 'General Voicemail',
    type: 'voicemail',
    route: 'No input / timeout',
    prompt: 'Send caller to general voicemail box.',
    notes: '',
    parentId: '3',
  },
  {
    id: '8',
    title: 'Billing Call Route',
    type: 'call_route',
    route: 'Billing Requests',
    prompt: 'Jump callers into the shared billing route.',
    notes: '',
    parentId: '4',
  },
  {
    id: '9',
    title: 'After Hours Forwarding',
    type: 'forwarding_number',
    route: 'After Hours',
    prompt: 'Forward to the external on-call number.',
    notes: '',
    parentId: '4',
  },
  {
    id: '10',
    title: 'Queue Intro Message',
    type: 'play_message',
    route: 'Before Queue',
    prompt: 'Play a brief informational greeting before entering the sales queue.',
    notes: '',
    parentId: '4',
  },
];

function inferType(entry) {
  const title = `${entry.title || entry.name || ''}`.toLowerCase();
  if (entry.type === PHONE_HOURS_TYPE || entry.type === 'phone_tree' || entry.type === 'call_queue' || entry.type === 'call_group' || entry.type === 'device' || entry.type === 'forwarding_number' || entry.type === 'call_route' || entry.type === 'voicemail' || entry.type === 'play_message') {
    return entry.type;
  }
  if (title.includes('phone hours')) return PHONE_HOURS_TYPE;
  if (entry.parentId === null) return 'phone_tree';
  if (title.includes('phone tree') || title.includes('menu')) return 'phone_tree';
  if (title.includes('voicemail')) return 'voicemail';
  if (title.includes('queue')) return 'call_queue';
  if (title.includes('group')) return 'call_group';
  if (title.includes('route')) return 'call_route';
  if (title.includes('forward')) return 'forwarding_number';
  if (title.includes('message') || title.includes('greeting')) return 'play_message';
  if (title.includes('device') || title.includes('operator') || title.includes('desk') || title.includes('extension')) return 'device';
  return 'phone_tree';
}

function normalizeStep(entry) {
  if ('title' in entry || 'prompt' in entry || 'route' in entry) {
    const normalizedTitle =
      entry.parentId === null
        ? 'Incoming Caller'
        : entry.title;

    return {
      ...entry,
      title: normalizedTitle || 'Untitled Block',
      type: inferType(entry),
      prompt: entry.prompt || '',
      voicemailAutoTextTemplate: entry.voicemailAutoTextTemplate || '',
      route: entry.parentId === null ? '' : entry.route || '',
      audioDataUrl: entry.audioDataUrl || '',
      audioFileName: entry.audioFileName || '',
      hoursSchedule: entry.hoursSchedule || null,

      position: entry.position ?? null,
      parentId: entry.parentId ?? null,
    };
  }

  const legacyTitle = entry.parentId === null && (entry.name === 'Alice Johnson' || entry.name === 'Incoming Call')
    ? 'Incoming Caller'
    : entry.name;

  return {
    id: entry.id,
    title: legacyTitle || 'Untitled Block',
    type: inferType(entry),
    prompt: entry.role || '',
    voicemailAutoTextTemplate: '',
    route: entry.parentId === null ? '' : entry.phone || '',
    audioDataUrl: '',
    audioFileName: '',
    hoursSchedule: null,
    notes: '',
    position: null,
    parentId: entry.parentId ?? null,
  };
}

function createPhoneHoursBlock(parentId) {
  return {
    id: genId(),
    title: 'Phone Hours',
    type: PHONE_HOURS_TYPE,
    route: 'Availability',
    prompt: 'Share phone hours and present the main call routing options.',
    hoursSchedule: createDefaultHoursSchedule(),
    notes: '',
    position: null,
    parentId,
  };
}

function createGreetingMessageBlock(parentId) {
  return {
    id: genId(),
    title: 'Greeting Message',
    type: 'play_message',
    route: 'Greeting',
    prompt: 'Play the initial greeting before presenting hours and routing options.',
    audioDataUrl: '',
    audioFileName: '',
    notes: '',
    position: null,
    parentId,
  };
}

function ensurePhoneTreeScaffold(nextBlocks, phoneTreeId) {
  let greetingBlock = nextBlocks.find(
    block => block.parentId === phoneTreeId && block.type === 'play_message'
  );

  if (!greetingBlock) {
    greetingBlock = createGreetingMessageBlock(phoneTreeId);
    nextBlocks.push(greetingBlock);
  }

  greetingBlock.route = greetingBlock.route || 'Greeting';

  let phoneHoursBlock = nextBlocks.find(
    block => block.parentId === greetingBlock.id && block.type === PHONE_HOURS_TYPE
  );

  if (!phoneHoursBlock) {
    const legacyDirectPhoneHours = nextBlocks.find(
      block => block.parentId === phoneTreeId && block.type === PHONE_HOURS_TYPE
    );

    if (legacyDirectPhoneHours) {
      legacyDirectPhoneHours.parentId = greetingBlock.id;
      phoneHoursBlock = legacyDirectPhoneHours;
    } else {
      phoneHoursBlock = createPhoneHoursBlock(greetingBlock.id);
      nextBlocks.push(phoneHoursBlock);
    }
  }

  phoneHoursBlock.type = PHONE_HOURS_TYPE;
  phoneHoursBlock.title = 'Phone Hours';
  phoneHoursBlock.route = phoneHoursBlock.route || 'Availability';
  phoneHoursBlock.hoursSchedule = phoneHoursBlock.hoursSchedule || createDefaultHoursSchedule();
}

function isProtectedScaffoldBlock(target, blocks) {
  if (!target) return false;

  if (target.type === PHONE_HOURS_TYPE) {
    const greeting = blocks.find(block => block.id === target.parentId);
    const phoneTree = greeting ? blocks.find(block => block.id === greeting.parentId) : null;
    return greeting?.type === 'play_message' && phoneTree?.type === 'phone_tree';
  }

  if (target.type === 'play_message') {
    const phoneTree = blocks.find(block => block.id === target.parentId);
    const hasPhoneHoursChild = blocks.some(block => block.parentId === target.id && block.type === PHONE_HOURS_TYPE);
    return phoneTree?.type === 'phone_tree' && hasPhoneHoursChild;
  }

  return false;
}

function ensureMasterFlowStructure(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return blocks;
  }

  const nextBlocks = blocks.map(block => ({ ...block }));
  const rootBlock = nextBlocks.find(block => block.parentId === null);

  if (!rootBlock) {
    return nextBlocks;
  }

  rootBlock.title = 'Incoming Caller';
  rootBlock.route = '';

  let playMessageBlock = nextBlocks.find(
    block => block.parentId === rootBlock.id && block.type === 'play_message'
  );

  if (!playMessageBlock) {
    playMessageBlock = {
      id: genId(),
      title: 'Greeting Message',
      type: 'play_message',
      route: '',
      prompt: 'Play the initial greeting before presenting hours and routing options.',
      audioDataUrl: '',
      audioFileName: '',
      notes: '',
      position: null,
      parentId: rootBlock.id,
    };
    nextBlocks.push(playMessageBlock);
  }

  let phoneHoursBlock = nextBlocks.find(
    block => block.parentId === playMessageBlock.id && (block.type === PHONE_HOURS_TYPE || block.title?.toLowerCase() === 'phone hours')
  );

  if (!phoneHoursBlock) {
    phoneHoursBlock = createPhoneHoursBlock(playMessageBlock.id);
    nextBlocks.push(phoneHoursBlock);
  } else {
    phoneHoursBlock.type = PHONE_HOURS_TYPE;
    phoneHoursBlock.route = phoneHoursBlock.route || 'Availability';
    phoneHoursBlock.hoursSchedule = phoneHoursBlock.hoursSchedule || createDefaultHoursSchedule();
  }

  nextBlocks.forEach(block => {
    if (block.id === rootBlock.id || block.id === playMessageBlock.id || block.id === phoneHoursBlock.id) {
      return;
    }

    if (block.parentId === rootBlock.id || block.parentId === playMessageBlock.id) {
      block.parentId = phoneHoursBlock.id;
    }
  });

  return nextBlocks;
}

export function usePhoneTree() {
  const [blocks, setBlocks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!stored) return SAMPLE_DATA;

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? ensureMasterFlowStructure(parsed.map(normalizeStep)) : SAMPLE_DATA;
    } catch {
      return SAMPLE_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  }, [blocks]);

  const addBlock = useCallback(({ title, type, route, prompt, parentId, position, audioDataUrl, audioFileName, hoursSchedule, voicemailAutoTextTemplate }) => {
    const newBlock = {
      id: genId(),
      title: parentId === null ? 'Incoming Caller' : title,
      type: type || 'phone_tree',
      route: parentId === null ? '' : route,
      prompt,
      voicemailAutoTextTemplate: voicemailAutoTextTemplate || '',
      audioDataUrl: audioDataUrl || '',
      audioFileName: audioFileName || '',
      hoursSchedule: hoursSchedule || null,

      position: position ?? null,
      parentId: parentId ?? null,
    };
    setBlocks(prev => {
      const next = [...prev, newBlock];

      if (newBlock.parentId !== null && newBlock.type !== PHONE_HOURS_TYPE) {
        assignDefaultRouteForBlock(next, newBlock.id);
      }

      const shouldEnsureScaffold =
        newBlock.type === 'phone_tree' &&
        newBlock.parentId !== null;

      if (shouldEnsureScaffold) {
        ensurePhoneTreeScaffold(next, newBlock.id);
      }

      return next;
    });
    return newBlock;
  }, []);

  const updateBlock = useCallback((id, updates) => {
    setBlocks(prev => {
      const mapped = prev.map(c => ({ ...c }));
      const target = mapped.find(c => c.id === id);
      if (!target) return mapped;

      const previousRoute = target.route;
      Object.assign(target, updates);

      if (updates.route !== undefined && target.parentId !== null && target.type !== PHONE_HOURS_TYPE) {
        target.route = previousRoute;
        swapSiblingRoutes(mapped, id, updates.route);
      }

      mapped.forEach(merged => {
        if (merged.parentId === null) {
          merged.title = 'Incoming Caller';
          merged.route = '';
        }
        if (merged.type === PHONE_HOURS_TYPE) {
          merged.title = 'Phone Hours';
          merged.route = merged.route || 'Availability';
          merged.hoursSchedule = merged.hoursSchedule || createDefaultHoursSchedule();
        }
      });

      const updated = mapped.find(block => block.id === id);
      if (!updated) return mapped;

      const shouldEnsureScaffold =
        updated.type === 'phone_tree' &&
        updated.parentId !== null;

      if (!shouldEnsureScaffold) return mapped;

      const next = [...mapped];
      ensurePhoneTreeScaffold(next, updated.id);
      return next;
    });
  }, []);

  const removeBlock = useCallback(id => {
    // Also remove all descendants
    setBlocks(prev => {
      const target = prev.find(block => block.id === id);
      if (isProtectedScaffoldBlock(target, prev)) {
        return prev;
      }

      const toRemove = new Set();
      const queue = [id];
      while (queue.length) {
        const current = queue.shift();
        toRemove.add(current);
        prev.filter(c => c.parentId === current).forEach(c => queue.push(c.id));
      }
      return prev.filter(c => !toRemove.has(c.id));
    });
  }, []);

  const getChildBlocks = useCallback(parentId => {
    return blocks.filter(c => c.parentId === parentId);
  }, [blocks]);

  const getRootBlocks = useCallback(() => {
    return blocks.filter(c => c.parentId === null);
  }, [blocks]);

  return { blocks, setBlocks, addBlock, updateBlock, removeBlock, getChildBlocks, getRootBlocks };
}
