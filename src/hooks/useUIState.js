// Reducer for managing UI state (modal, form, search, etc.)

export const INITIAL_UI_STATE = {
  modal: null, // { mode: 'add'|'edit', parentBlock?, initialPosition? }
  selectedId: null,
  searchQuery: '',
  showExportImport: false,
  catalogContext: null, // { mode: 'child'|'above', targetId }
  previewDrop: null, // { targetId, placement, type }
  draggingPaletteType: null,
};

export const UI_ACTIONS = {
  OPEN_ADD_MODAL: 'OPEN_ADD_MODAL',
  OPEN_EDIT_MODAL: 'OPEN_EDIT_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  SELECT_BLOCK: 'SELECT_BLOCK',
  SET_SEARCH: 'SET_SEARCH',
  TOGGLE_EXPORT_IMPORT: 'TOGGLE_EXPORT_IMPORT',
  SET_CATALOG_CONTEXT: 'SET_CATALOG_CONTEXT',
  SET_PREVIEW_DROP: 'SET_PREVIEW_DROP',
  SET_DRAGGING_PALETTE_TYPE: 'SET_DRAGGING_PALETTE_TYPE',
};

export function uiReducer(state, action) {
  switch (action.type) {
    case UI_ACTIONS.OPEN_ADD_MODAL:
      return {
        ...state,
        modal: {
          mode: 'add',
          parentBlock: action.payload.parentBlock || null,
          initialPosition: action.payload.initialPosition || null,
        },
      };

    case UI_ACTIONS.OPEN_EDIT_MODAL:
      return {
        ...state,
        modal: {
          mode: 'edit',
          parentBlock: null,
          initialPosition: null,
        },
      };

    case UI_ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        modal: null,
      };

    case UI_ACTIONS.SELECT_BLOCK:
      return {
        ...state,
        selectedId: action.payload,
      };

    case UI_ACTIONS.SET_SEARCH:
      return {
        ...state,
        searchQuery: action.payload,
      };

    case UI_ACTIONS.TOGGLE_EXPORT_IMPORT:
      return {
        ...state,
        showExportImport: !state.showExportImport,
      };

    case UI_ACTIONS.SET_CATALOG_CONTEXT:
      return {
        ...state,
        catalogContext: action.payload,
      };

    case UI_ACTIONS.SET_PREVIEW_DROP:
      return {
        ...state,
        previewDrop: action.payload,
      };

    case UI_ACTIONS.SET_DRAGGING_PALETTE_TYPE:
      return {
        ...state,
        draggingPaletteType: action.payload,
      };

    default:
      return state;
  }
}
