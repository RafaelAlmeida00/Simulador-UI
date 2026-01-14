import * as React from 'react';

// ─────────────────────────────────────────────────────────────
// Types (shared with page.tsx)
// ─────────────────────────────────────────────────────────────

type StartProductionStation = {
  shop: string;
  line: string;
  station: string;
};

type ShiftConfig = {
  id: string;
  start: string;
  end: string;
};

type PlannedStopConfig = {
  id: string;
  name: string;
  type: string;
  reason: string;
  affectsShops?: string[];
  startTime: string;
  durationMn: number;
  daysOfWeek: number[];
};

type TaktConfig = {
  jph: number;
  leadtime: number;
  shiftStart: string;
  shiftEnd: string;
};

type BufferConfig = {
  to: { shop: string; line: string };
  capacity: number;
};

type RouteDestination = {
  shop: string;
  line: string;
  station: string;
};

type RouteConfig = {
  fromStation: string;
  to: RouteDestination[];
};

type RequiredPart = {
  partType: string;
  consumeStation: string;
};

type CreateWithConfig = {
  line: string;
  station: string;
};

type LineConfig = {
  MTTR: number;
  MTBF: number;
  stations: string[];
  takt: TaktConfig;
  buffers: BufferConfig[];
  routes: RouteConfig[];
  partType?: string;
  createWith?: CreateWithConfig;
  requiredParts?: RequiredPart[];
  partConsumptionStation?: string;
};

type ShopConfig = {
  name: string;
  bufferCapacity: number;
  reworkBuffer: number;
  lines: Record<string, LineConfig>;
};

export type FlowPlantConfig = {
  MIX_ITEMS_PER_LINE: number;
  colors: string[];
  models: string[];
  BUFFER_EMIT_INTERVAL: number;
  BUFFER_PERSIST_INTERVAL: number;
  PLANT_EMIT_INTERVAL: number;
  STOPS_EMIT_INTERVAL: number;
  OEE_EMIT_INTERVAL: number;
  CARS_EMIT_INTERVAL: number;
  typeSpeedFactor: number;
  stationTaktMinFraction: number;
  stationTaktMaxFraction: number;
  stationstartProduction: StartProductionStation[];
  shifts: ShiftConfig[];
  plannedStops: PlannedStopConfig[];
  DPHU: number;
  Rework_Time: number;
  targetJPH: number;
  oeeTargets: Record<string, number>;
  shops: Record<string, ShopConfig>;
};

// ─────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────

export const initialConfig: FlowPlantConfig = {
  MIX_ITEMS_PER_LINE: 10,
  colors: ['Red', 'Blue', 'Green', 'Black', 'White', 'Silver', 'Yellow', 'Orange', 'Purple', 'Gray'],
  models: ['P19', 'P20', 'P35'],
  BUFFER_EMIT_INTERVAL: 5000,
  BUFFER_PERSIST_INTERVAL: 3600000,
  PLANT_EMIT_INTERVAL: 10000,
  STOPS_EMIT_INTERVAL: 10000,
  OEE_EMIT_INTERVAL: 10000,
  CARS_EMIT_INTERVAL: 10000,
  typeSpeedFactor: 1,
  stationTaktMinFraction: 0.7,
  stationTaktMaxFraction: 0.999,
  stationstartProduction: [],
  shifts: [],
  plannedStops: [],
  DPHU: 5,
  Rework_Time: 60,
  targetJPH: 28,
  oeeTargets: {},
  shops: {},
};

// ─────────────────────────────────────────────────────────────
// State Type
// ─────────────────────────────────────────────────────────────

export type SettingsState = {
  config: FlowPlantConfig;
  meta: {
    name: string;
    isDefault: boolean;
    editingId: string | null;
  };
  inputs: {
    newColor: string;
    newModel: string;
  };
};

export const initialState: SettingsState = {
  config: initialConfig,
  meta: {
    name: '',
    isDefault: false,
    editingId: null,
  },
  inputs: {
    newColor: '',
    newModel: '',
  },
};

// ─────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────

export type SettingsAction =
  // Config updates
  | { type: 'UPDATE_GLOBAL'; key: keyof FlowPlantConfig; value: number }
  | { type: 'UPDATE_INTERVAL'; key: keyof FlowPlantConfig; value: number }
  // Shifts
  | { type: 'ADD_SHIFT' }
  | { type: 'UPDATE_SHIFT'; index: number; field: keyof ShiftConfig; value: string }
  | { type: 'REMOVE_SHIFT'; index: number }
  // Planned Stops
  | { type: 'ADD_PLANNED_STOP' }
  | { type: 'UPDATE_PLANNED_STOP'; index: number; field: keyof PlannedStopConfig; value: unknown }
  | { type: 'REMOVE_PLANNED_STOP'; index: number }
  | { type: 'TOGGLE_DAY_OF_WEEK'; stopIndex: number; day: number }
  // Shops
  | { type: 'ADD_SHOP' }
  | { type: 'UPDATE_SHOP'; shopKey: string; field: keyof ShopConfig; value: unknown }
  | { type: 'REMOVE_SHOP'; shopKey: string }
  | { type: 'UPDATE_OEE_TARGET'; shopKey: string; value: number }
  // Lines
  | { type: 'ADD_LINE'; shopKey: string }
  | { type: 'REMOVE_LINE'; shopKey: string; lineKey: string }
  // Start Stations
  | { type: 'ADD_START_STATION' }
  | { type: 'UPDATE_START_STATION'; index: number; field: keyof StartProductionStation; value: string }
  | { type: 'REMOVE_START_STATION'; index: number }
  // Colors
  | { type: 'ADD_COLOR'; color: string }
  | { type: 'REMOVE_COLOR'; index: number }
  | { type: 'SET_NEW_COLOR'; value: string }
  // Models
  | { type: 'ADD_MODEL'; model: string }
  | { type: 'REMOVE_MODEL'; index: number }
  | { type: 'SET_NEW_MODEL'; value: string }
  // Meta
  | { type: 'SET_CONFIG_NAME'; name: string }
  | { type: 'SET_IS_DEFAULT'; isDefault: boolean }
  | { type: 'SET_EDITING_ID'; id: string | null }
  // Bulk operations
  | { type: 'LOAD_CONFIG'; config: FlowPlantConfig; name: string; isDefault: boolean; editingId: string }
  | { type: 'RESET_FORM' };

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────

export function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    // Config updates
    case 'UPDATE_GLOBAL':
    case 'UPDATE_INTERVAL':
      return {
        ...state,
        config: { ...state.config, [action.key]: action.value },
      };

    // Shifts
    case 'ADD_SHIFT': {
      const newId = `TURNO_${state.config.shifts.length + 1}`;
      return {
        ...state,
        config: {
          ...state.config,
          shifts: [...state.config.shifts, { id: newId, start: '07:00', end: '16:00' }],
        },
      };
    }

    case 'UPDATE_SHIFT':
      return {
        ...state,
        config: {
          ...state.config,
          shifts: state.config.shifts.map((s, i) =>
            i === action.index ? { ...s, [action.field]: action.value } : s
          ),
        },
      };

    case 'REMOVE_SHIFT':
      return {
        ...state,
        config: {
          ...state.config,
          shifts: state.config.shifts.filter((_, i) => i !== action.index),
        },
      };

    // Planned Stops
    case 'ADD_PLANNED_STOP': {
      const newId = `STOP_${Date.now()}`;
      return {
        ...state,
        config: {
          ...state.config,
          plannedStops: [
            ...state.config.plannedStops,
            {
              id: newId,
              name: 'Nova Parada',
              type: 'OTHER',
              reason: 'OTHER',
              affectsShops: [],
              startTime: '12:00',
              durationMn: 30,
              daysOfWeek: [1, 2, 3, 4, 5],
            },
          ],
        },
      };
    }

    case 'UPDATE_PLANNED_STOP':
      return {
        ...state,
        config: {
          ...state.config,
          plannedStops: state.config.plannedStops.map((s, i) =>
            i === action.index ? { ...s, [action.field]: action.value } : s
          ),
        },
      };

    case 'REMOVE_PLANNED_STOP':
      return {
        ...state,
        config: {
          ...state.config,
          plannedStops: state.config.plannedStops.filter((_, i) => i !== action.index),
        },
      };

    case 'TOGGLE_DAY_OF_WEEK':
      return {
        ...state,
        config: {
          ...state.config,
          plannedStops: state.config.plannedStops.map((s, i) => {
            if (i !== action.stopIndex) return s;
            const days = s.daysOfWeek.includes(action.day)
              ? s.daysOfWeek.filter((d) => d !== action.day)
              : [...s.daysOfWeek, action.day].sort();
            return { ...s, daysOfWeek: days };
          }),
        },
      };

    // Shops
    case 'ADD_SHOP': {
      const shopName = `Shop_${Object.keys(state.config.shops).length + 1}`;
      return {
        ...state,
        config: {
          ...state.config,
          shops: {
            ...state.config.shops,
            [shopName]: {
              name: shopName,
              bufferCapacity: 100,
              reworkBuffer: 50,
              lines: {},
            },
          },
          oeeTargets: {
            ...state.config.oeeTargets,
            [shopName]: 0.85,
          },
        },
      };
    }

    case 'UPDATE_SHOP':
      return {
        ...state,
        config: {
          ...state.config,
          shops: {
            ...state.config.shops,
            [action.shopKey]: { ...state.config.shops[action.shopKey], [action.field]: action.value },
          },
        },
      };

    case 'REMOVE_SHOP': {
      const { [action.shopKey]: _, ...restShops } = state.config.shops;
      const { [action.shopKey]: __, ...restOee } = state.config.oeeTargets;
      return {
        ...state,
        config: { ...state.config, shops: restShops, oeeTargets: restOee },
      };
    }

    case 'UPDATE_OEE_TARGET':
      return {
        ...state,
        config: {
          ...state.config,
          oeeTargets: { ...state.config.oeeTargets, [action.shopKey]: action.value },
        },
      };

    // Lines
    case 'ADD_LINE': {
      const lineName = `Line_${Object.keys(state.config.shops[action.shopKey]?.lines || {}).length + 1}`;
      return {
        ...state,
        config: {
          ...state.config,
          shops: {
            ...state.config.shops,
            [action.shopKey]: {
              ...state.config.shops[action.shopKey],
              lines: {
                ...state.config.shops[action.shopKey].lines,
                [lineName]: {
                  MTTR: 5,
                  MTBF: 60,
                  stations: ['s1'],
                  takt: { jph: 28, leadtime: 0.1, shiftStart: '07:00', shiftEnd: '23:48' },
                  buffers: [],
                  routes: [],
                },
              },
            },
          },
        },
      };
    }

    case 'REMOVE_LINE': {
      const { [action.lineKey]: _, ...restLines } = state.config.shops[action.shopKey].lines;
      return {
        ...state,
        config: {
          ...state.config,
          shops: {
            ...state.config.shops,
            [action.shopKey]: { ...state.config.shops[action.shopKey], lines: restLines },
          },
        },
      };
    }

    // Start Stations
    case 'ADD_START_STATION':
      return {
        ...state,
        config: {
          ...state.config,
          stationstartProduction: [
            ...state.config.stationstartProduction,
            { shop: '', line: '', station: '' },
          ],
        },
      };

    case 'UPDATE_START_STATION':
      return {
        ...state,
        config: {
          ...state.config,
          stationstartProduction: state.config.stationstartProduction.map((s, i) =>
            i === action.index ? { ...s, [action.field]: action.value } : s
          ),
        },
      };

    case 'REMOVE_START_STATION':
      return {
        ...state,
        config: {
          ...state.config,
          stationstartProduction: state.config.stationstartProduction.filter((_, i) => i !== action.index),
        },
      };

    // Colors
    case 'ADD_COLOR':
      if (!action.color.trim() || state.config.colors.includes(action.color.trim())) {
        return state;
      }
      return {
        ...state,
        config: {
          ...state.config,
          colors: [...state.config.colors, action.color.trim()],
        },
        inputs: { ...state.inputs, newColor: '' },
      };

    case 'REMOVE_COLOR':
      return {
        ...state,
        config: {
          ...state.config,
          colors: state.config.colors.filter((_, i) => i !== action.index),
        },
      };

    case 'SET_NEW_COLOR':
      return { ...state, inputs: { ...state.inputs, newColor: action.value } };

    // Models
    case 'ADD_MODEL':
      if (!action.model.trim() || state.config.models.includes(action.model.trim())) {
        return state;
      }
      return {
        ...state,
        config: {
          ...state.config,
          models: [...state.config.models, action.model.trim()],
        },
        inputs: { ...state.inputs, newModel: '' },
      };

    case 'REMOVE_MODEL':
      return {
        ...state,
        config: {
          ...state.config,
          models: state.config.models.filter((_, i) => i !== action.index),
        },
      };

    case 'SET_NEW_MODEL':
      return { ...state, inputs: { ...state.inputs, newModel: action.value } };

    // Meta
    case 'SET_CONFIG_NAME':
      return { ...state, meta: { ...state.meta, name: action.name } };

    case 'SET_IS_DEFAULT':
      return { ...state, meta: { ...state.meta, isDefault: action.isDefault } };

    case 'SET_EDITING_ID':
      return { ...state, meta: { ...state.meta, editingId: action.id } };

    // Bulk operations
    case 'LOAD_CONFIG':
      return {
        ...state,
        config: { ...initialConfig, ...action.config },
        meta: {
          name: action.name,
          isDefault: action.isDefault,
          editingId: action.editingId,
        },
      };

    case 'RESET_FORM':
      return initialState;

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useSettingsReducer() {
  const [state, dispatch] = React.useReducer(settingsReducer, initialState);

  // Memoized action creators for stable references
  const actions = React.useMemo(
    () => ({
      updateGlobal: (key: keyof FlowPlantConfig, value: number) =>
        dispatch({ type: 'UPDATE_GLOBAL', key, value }),
      updateInterval: (key: keyof FlowPlantConfig, value: number) =>
        dispatch({ type: 'UPDATE_INTERVAL', key, value }),
      addShift: () => dispatch({ type: 'ADD_SHIFT' }),
      updateShift: (index: number, field: keyof ShiftConfig, value: string) =>
        dispatch({ type: 'UPDATE_SHIFT', index, field, value }),
      removeShift: (index: number) => dispatch({ type: 'REMOVE_SHIFT', index }),
      addPlannedStop: () => dispatch({ type: 'ADD_PLANNED_STOP' }),
      updatePlannedStop: (index: number, field: keyof PlannedStopConfig, value: unknown) =>
        dispatch({ type: 'UPDATE_PLANNED_STOP', index, field, value }),
      removePlannedStop: (index: number) => dispatch({ type: 'REMOVE_PLANNED_STOP', index }),
      toggleDayOfWeek: (stopIndex: number, day: number) =>
        dispatch({ type: 'TOGGLE_DAY_OF_WEEK', stopIndex, day }),
      addShop: () => dispatch({ type: 'ADD_SHOP' }),
      updateShop: (shopKey: string, field: keyof ShopConfig, value: unknown) =>
        dispatch({ type: 'UPDATE_SHOP', shopKey, field, value }),
      removeShop: (shopKey: string) => dispatch({ type: 'REMOVE_SHOP', shopKey }),
      updateOeeTarget: (shopKey: string, value: number) =>
        dispatch({ type: 'UPDATE_OEE_TARGET', shopKey, value }),
      addLine: (shopKey: string) => dispatch({ type: 'ADD_LINE', shopKey }),
      removeLine: (shopKey: string, lineKey: string) =>
        dispatch({ type: 'REMOVE_LINE', shopKey, lineKey }),
      addStartStation: () => dispatch({ type: 'ADD_START_STATION' }),
      updateStartStation: (index: number, field: keyof StartProductionStation, value: string) =>
        dispatch({ type: 'UPDATE_START_STATION', index, field, value }),
      removeStartStation: (index: number) => dispatch({ type: 'REMOVE_START_STATION', index }),
      addColor: (color: string) => dispatch({ type: 'ADD_COLOR', color }),
      removeColor: (index: number) => dispatch({ type: 'REMOVE_COLOR', index }),
      setNewColor: (value: string) => dispatch({ type: 'SET_NEW_COLOR', value }),
      addModel: (model: string) => dispatch({ type: 'ADD_MODEL', model }),
      removeModel: (index: number) => dispatch({ type: 'REMOVE_MODEL', index }),
      setNewModel: (value: string) => dispatch({ type: 'SET_NEW_MODEL', value }),
      setConfigName: (name: string) => dispatch({ type: 'SET_CONFIG_NAME', name }),
      setIsDefault: (isDefault: boolean) => dispatch({ type: 'SET_IS_DEFAULT', isDefault }),
      setEditingId: (id: string | null) => dispatch({ type: 'SET_EDITING_ID', id }),
      loadConfig: (config: FlowPlantConfig, name: string, isDefault: boolean, editingId: string) =>
        dispatch({ type: 'LOAD_CONFIG', config, name, isDefault, editingId }),
      resetForm: () => dispatch({ type: 'RESET_FORM' }),
    }),
    []
  );

  return { state, dispatch, actions };
}
