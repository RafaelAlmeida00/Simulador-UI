'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FactoryIcon from '@mui/icons-material/Factory';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import SpeedIcon from '@mui/icons-material/Speed';
import StarIcon from '@mui/icons-material/Star';
import EditIcon from '@mui/icons-material/Edit';
import CodeIcon from '@mui/icons-material/Code';
import FolderIcon from '@mui/icons-material/Folder';
import RefreshIcon from '@mui/icons-material/Refresh';
import CategoryIcon from '@mui/icons-material/Category';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

import { AppHeader } from '../src/components/AppHeader';
import http from '../src/utils/http';
import { useTheme } from '@mui/material/styles';

// ─────────────────────────────────────────────────────────────
// API Types
// ─────────────────────────────────────────────────────────────

type ConfigPlant = {
  id: string;
  name: string;
  config: string | Record<string, unknown>; // JSON stringified ou objeto
  isDefault: boolean;
  created_at: number; // timestamp
};

// ─────────────────────────────────────────────────────────────
// Types
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
  // Part Line fields
  partType?: string;
  createWith?: CreateWithConfig;
  // Required Parts fields (for consuming parts)
  requiredParts?: RequiredPart[];
  partConsumptionStation?: string;
};

type ShopConfig = {
  name: string;
  bufferCapacity: number;
  reworkBuffer: number;
  lines: Record<string, LineConfig>;
};

type FlowPlantConfig = {
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

const initialConfig: FlowPlantConfig = {
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

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const STOP_TYPES = ['LUNCH', 'MEETING', 'SHIFT_CHANGE', 'NIGHT_STOP', 'MAINTENANCE', 'OTHER'];

// ─────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
      {icon}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [config, setConfig] = React.useState<FlowPlantConfig>(initialConfig);
  const [configName, setConfigName] = React.useState('');
  const [isDefault, setIsDefault] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // State for "Modelos" tab
  const [savedConfigs, setSavedConfigs] = React.useState<ConfigPlant[]>([]);
  const [configsLoading, setConfigsLoading] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [expandedConfigs, setExpandedConfigs] = React.useState<Set<string>>(new Set());
  const repairedConfigWarningsRef = React.useRef<Set<string>>(new Set());
  const theme = useTheme();

  // ─────────────────────────────────────────────────────────────
  // Fetch Saved Configurations
  // ─────────────────────────────────────────────────────────────

  const fetchConfigs = React.useCallback(async () => {
    setConfigsLoading(true);
    try {
      const response = await http.get<ConfigPlant[]>('/config');
      // Garantir que savedConfigs seja sempre um array
      const data = response.data;
      if (Array.isArray(data)) {
        setSavedConfigs(data);
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: ConfigPlant[] }).data)) {
        // API pode retornar { data: [...] }
        setSavedConfigs((data as { data: ConfigPlant[] }).data);
      } else {
        console.warn('API returned unexpected format:', data);
        setSavedConfigs([]);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      setSnackbar({ open: true, message: 'Erro ao carregar configurações', severity: 'error' });
    } finally {
      setConfigsLoading(false);
    }
  }, []);

  // Fetch configs when switching to "Modelos" tab
  React.useEffect(() => {
    if (activeTab === 4) {
      fetchConfigs();
    }
  }, [activeTab, fetchConfigs]);

  // ─────────────────────────────────────────────────────────────
  // Global Settings Handlers
  // ─────────────────────────────────────────────────────────────

  const updateGlobal = (key: keyof FlowPlantConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // ─────────────────────────────────────────────────────────────
  // Shifts Handlers
  // ─────────────────────────────────────────────────────────────

  const addShift = () => {
    const newId = `TURNO_${config.shifts.length + 1}`;
    setConfig((prev) => ({
      ...prev,
      shifts: [...prev.shifts, { id: newId, start: '07:00', end: '16:00' }],
    }));
  };

  const updateShift = (index: number, field: keyof ShiftConfig, value: string) => {
    setConfig((prev) => ({
      ...prev,
      shifts: prev.shifts.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const removeShift = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((_, i) => i !== index),
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Planned Stops Handlers
  // ─────────────────────────────────────────────────────────────

  const addPlannedStop = () => {
    const newId = `STOP_${Date.now()}`;
    setConfig((prev) => ({
      ...prev,
      plannedStops: [
        ...prev.plannedStops,
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
    }));
  };

  const updatePlannedStop = (index: number, field: keyof PlannedStopConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      plannedStops: prev.plannedStops.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const removePlannedStop = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      plannedStops: prev.plannedStops.filter((_, i) => i !== index),
    }));
  };

  const toggleDayOfWeek = (stopIndex: number, day: number) => {
    setConfig((prev) => ({
      ...prev,
      plannedStops: prev.plannedStops.map((s, i) => {
        if (i !== stopIndex) return s;
        const days = s.daysOfWeek.includes(day) ? s.daysOfWeek.filter((d) => d !== day) : [...s.daysOfWeek, day].sort();
        return { ...s, daysOfWeek: days };
      }),
    }));
  };

  const toggleAffectsShop = (stopIndex: number, shop: string) => {
    setConfig((prev) => ({
      ...prev,
      plannedStops: prev.plannedStops.map((s, i) => {
        if (i !== stopIndex) return s;
        const shops = s.affectsShops || [];
        const newShops = shops.includes(shop) ? shops.filter((sh) => sh !== shop) : [...shops, shop];
        return { ...s, affectsShops: newShops };
      }),
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Shops Handlers
  // ─────────────────────────────────────────────────────────────

  const addShop = () => {
    const shopName = `Shop_${Object.keys(config.shops).length + 1}`;
    setConfig((prev) => ({
      ...prev,
      shops: {
        ...prev.shops,
        [shopName]: {
          name: shopName,
          bufferCapacity: 100,
          reworkBuffer: 50,
          lines: {},
        },
      },
      oeeTargets: {
        ...prev.oeeTargets,
        [shopName]: 0.85,
      },
    }));
  };

  const updateShop = (shopKey: string, field: keyof ShopConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      shops: {
        ...prev.shops,
        [shopKey]: { ...prev.shops[shopKey], [field]: value },
      },
    }));
  };

  const renameShop = (oldKey: string, newName: string) => {
    if (oldKey === newName || !newName.trim()) return;
    if (config.shops[newName]) {
      setSnackbar({ open: true, message: 'Já existe um shop com esse nome', severity: 'error' });
      return;
    }
    setConfig((prev) => {
      const { [oldKey]: shop, ...restShops } = prev.shops;
      const { [oldKey]: oeeTarget, ...restOee } = prev.oeeTargets;
      return {
        ...prev,
        shops: { ...restShops, [newName]: { ...shop, name: newName } },
        oeeTargets: { ...restOee, [newName]: oeeTarget ?? 0.85 },
      };
    });
  };

  const removeShop = (shopKey: string) => {
    setConfig((prev) => {
      const { [shopKey]: _, ...restShops } = prev.shops;
      const { [shopKey]: __, ...restOee } = prev.oeeTargets;
      return { ...prev, shops: restShops, oeeTargets: restOee };
    });
  };

  const updateOeeTarget = (shopKey: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      oeeTargets: { ...prev.oeeTargets, [shopKey]: value },
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Lines Handlers
  // ─────────────────────────────────────────────────────────────

  const addLine = (shopKey: string) => {
    const lineName = `Line_${Object.keys(config.shops[shopKey]?.lines || {}).length + 1}`;
    setConfig((prev) => ({
      ...prev,
      shops: {
        ...prev.shops,
        [shopKey]: {
          ...prev.shops[shopKey],
          lines: {
            ...prev.shops[shopKey].lines,
            [lineName]: {
              MTTR: 5,
              MTBF: 60,
              stations: ['s1'],
              takt: { jph: 28, leadtime: 0.1, shiftStart: '07:00', shiftEnd: '23:48' },
              buffers: [],
              routes: [],
              partType: undefined,
              createWith: undefined,
              requiredParts: [],
              partConsumptionStation: undefined,
            },
          },
        },
      },
    }));
  };

  const updateLine = (shopKey: string, lineKey: string, field: keyof LineConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      shops: {
        ...prev.shops,
        [shopKey]: {
          ...prev.shops[shopKey],
          lines: {
            ...prev.shops[shopKey].lines,
            [lineKey]: { ...prev.shops[shopKey].lines[lineKey], [field]: value },
          },
        },
      },
    }));
  };

  const renameLine = (shopKey: string, oldLineKey: string, newLineName: string) => {
    if (oldLineKey === newLineName || !newLineName.trim()) return;
    if (config.shops[shopKey]?.lines[newLineName]) {
      setSnackbar({ open: true, message: 'Já existe uma linha com esse nome', severity: 'error' });
      return;
    }
    setConfig((prev) => {
      const { [oldLineKey]: line, ...restLines } = prev.shops[shopKey].lines;
      return {
        ...prev,
        shops: {
          ...prev.shops,
          [shopKey]: { ...prev.shops[shopKey], lines: { ...restLines, [newLineName]: line } },
        },
      };
    });
  };

  const removeLine = (shopKey: string, lineKey: string) => {
    setConfig((prev) => {
      const { [lineKey]: _, ...restLines } = prev.shops[shopKey].lines;
      return {
        ...prev,
        shops: {
          ...prev.shops,
          [shopKey]: { ...prev.shops[shopKey], lines: restLines },
        },
      };
    });
  };

  const updateLineTakt = (shopKey: string, lineKey: string, field: keyof TaktConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      shops: {
        ...prev.shops,
        [shopKey]: {
          ...prev.shops[shopKey],
          lines: {
            ...prev.shops[shopKey].lines,
            [lineKey]: {
              ...prev.shops[shopKey].lines[lineKey],
              takt: { ...prev.shops[shopKey].lines[lineKey].takt, [field]: value },
            },
          },
        },
      },
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Stations Handlers
  // ─────────────────────────────────────────────────────────────

  const addStation = (shopKey: string, lineKey: string) => {
    const stations = config.shops[shopKey]?.lines[lineKey]?.stations || [];
    const newStation = `s${stations.length + 1}`;
    updateLine(shopKey, lineKey, 'stations', [...stations, newStation]);
  };

  const removeStation = (shopKey: string, lineKey: string, stationIndex: number) => {
    const stations = config.shops[shopKey]?.lines[lineKey]?.stations || [];
    updateLine(
      shopKey,
      lineKey,
      'stations',
      stations.filter((_, i) => i !== stationIndex)
    );
  };

  const renameStation = (shopKey: string, lineKey: string, stationIndex: number, newName: string) => {
    const stations = config.shops[shopKey]?.lines[lineKey]?.stations || [];
    updateLine(
      shopKey,
      lineKey,
      'stations',
      stations.map((s, i) => (i === stationIndex ? newName : s))
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Buffers Handlers
  // ─────────────────────────────────────────────────────────────

  const addBuffer = (shopKey: string, lineKey: string) => {
    const buffers = config.shops[shopKey]?.lines[lineKey]?.buffers || [];
    updateLine(shopKey, lineKey, 'buffers', [...buffers, { to: { shop: '', line: '' }, capacity: 10 }]);
  };

  const updateBuffer = (shopKey: string, lineKey: string, bufferIndex: number, field: string, value: unknown) => {
    const buffers = config.shops[shopKey]?.lines[lineKey]?.buffers || [];
    const updated = buffers.map((b, i) => {
      if (i !== bufferIndex) return b;
      if (field === 'capacity') return { ...b, capacity: value as number };
      if (field === 'toShop') return { ...b, to: { ...b.to, shop: value as string } };
      if (field === 'toLine') return { ...b, to: { ...b.to, line: value as string } };
      return b;
    });
    updateLine(shopKey, lineKey, 'buffers', updated);
  };

  const removeBuffer = (shopKey: string, lineKey: string, bufferIndex: number) => {
    const buffers = config.shops[shopKey]?.lines[lineKey]?.buffers || [];
    updateLine(
      shopKey,
      lineKey,
      'buffers',
      buffers.filter((_, i) => i !== bufferIndex)
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Routes Handlers
  // ─────────────────────────────────────────────────────────────

  const addRoute = (shopKey: string, lineKey: string) => {
    const routes = config.shops[shopKey]?.lines[lineKey]?.routes || [];
    const stations = config.shops[shopKey]?.lines[lineKey]?.stations || [];
    const lastStation = stations[stations.length - 1] || 's1';
    updateLine(shopKey, lineKey, 'routes', [...routes, { fromStation: lastStation, to: [] }]);
  };

  const updateRoute = (shopKey: string, lineKey: string, routeIndex: number, field: string, value: unknown) => {
    const routes = config.shops[shopKey]?.lines[lineKey]?.routes || [];
    const updated = routes.map((r, i) => {
      if (i !== routeIndex) return r;
      if (field === 'fromStation') return { ...r, fromStation: value as string };
      return r;
    });
    updateLine(shopKey, lineKey, 'routes', updated);
  };

  const removeRoute = (shopKey: string, lineKey: string, routeIndex: number) => {
    const routes = config.shops[shopKey]?.lines[lineKey]?.routes || [];
    updateLine(
      shopKey,
      lineKey,
      'routes',
      routes.filter((_, i) => i !== routeIndex)
    );
  };

  const addRouteDestination = (shopKey: string, lineKey: string, routeIndex: number) => {
    const routes = config.shops[shopKey]?.lines[lineKey]?.routes || [];
    const updated = routes.map((r, i) => {
      if (i !== routeIndex) return r;
      return { ...r, to: [...r.to, { shop: '', line: '', station: '' }] };
    });
    updateLine(shopKey, lineKey, 'routes', updated);
  };

  const updateRouteDestination = (
    shopKey: string,
    lineKey: string,
    routeIndex: number,
    destIndex: number,
    field: keyof RouteDestination,
    value: string
  ) => {
    const routes = config.shops[shopKey]?.lines[lineKey]?.routes || [];
    const updated = routes.map((r, i) => {
      if (i !== routeIndex) return r;
      return {
        ...r,
        to: r.to.map((d, j) => (j === destIndex ? { ...d, [field]: value } : d)),
      };
    });
    updateLine(shopKey, lineKey, 'routes', updated);
  };

  const removeRouteDestination = (shopKey: string, lineKey: string, routeIndex: number, destIndex: number) => {
    const routes = config.shops[shopKey]?.lines[lineKey]?.routes || [];
    const updated = routes.map((r, i) => {
      if (i !== routeIndex) return r;
      return { ...r, to: r.to.filter((_, j) => j !== destIndex) };
    });
    updateLine(shopKey, lineKey, 'routes', updated);
  };

  // ─────────────────────────────────────────────────────────────
  // Start Production Stations Handlers
  // ─────────────────────────────────────────────────────────────

  const addStartStation = () => {
    setConfig((prev) => ({
      ...prev,
      stationstartProduction: [...prev.stationstartProduction, { shop: '', line: '', station: '' }],
    }));
  };

  const updateStartStation = (index: number, field: keyof StartProductionStation, value: string) => {
    setConfig((prev) => ({
      ...prev,
      stationstartProduction: prev.stationstartProduction.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const removeStartStation = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      stationstartProduction: prev.stationstartProduction.filter((_, i) => i !== index),
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Required Parts Handlers
  // ─────────────────────────────────────────────────────────────

  const addRequiredPart = (shopKey: string, lineKey: string) => {
    const line = config.shops[shopKey]?.lines[lineKey];
    if (!line) return;
    const requiredParts = line.requiredParts || [];
    updateLine(shopKey, lineKey, 'requiredParts', [...requiredParts, { partType: '', consumeStation: 's1' }]);
  };

  const updateRequiredPart = (shopKey: string, lineKey: string, partIndex: number, field: keyof RequiredPart, value: string) => {
    const line = config.shops[shopKey]?.lines[lineKey];
    if (!line) return;
    const requiredParts = line.requiredParts || [];
    const updated = requiredParts.map((p, i) => (i === partIndex ? { ...p, [field]: value } : p));
    updateLine(shopKey, lineKey, 'requiredParts', updated);
  };

  const removeRequiredPart = (shopKey: string, lineKey: string, partIndex: number) => {
    const line = config.shops[shopKey]?.lines[lineKey];
    if (!line) return;
    const requiredParts = line.requiredParts || [];
    updateLine(shopKey, lineKey, 'requiredParts', requiredParts.filter((_, i) => i !== partIndex));
  };

  const updateCreateWith = (shopKey: string, lineKey: string, field: keyof CreateWithConfig, value: string) => {
    const line = config.shops[shopKey]?.lines[lineKey];
    if (!line) return;
    const current = line.createWith || { line: '', station: '' };
    updateLine(shopKey, lineKey, 'createWith', { ...current, [field]: value });
  };

  const clearCreateWith = (shopKey: string, lineKey: string) => {
    updateLine(shopKey, lineKey, 'createWith', undefined);
  };

  // ─────────────────────────────────────────────────────────────
  // Save Handler
  // ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!configName.trim()) {
      setSnackbar({ open: true, message: 'Por favor, informe o nome da configuração', severity: 'error' });
      return;
    }

    // Build the final JSON
    const flowPlant = {
      typeSpeedFactor: config.typeSpeedFactor,
      stationTaktMinFraction: config.stationTaktMinFraction,
      stationTaktMaxFraction: config.stationTaktMaxFraction,
      stationstartProduction: config.stationstartProduction,
      shifts: config.shifts,
      plannedStops: config.plannedStops,
      DPHU: config.DPHU,
      Rework_Time: config.Rework_Time,
      targetJPH: config.targetJPH,
      oeeTargets: config.oeeTargets,
      shops: config.shops,
    };

    const payload = {
      name: configName.trim(),
      config: JSON.stringify(flowPlant),
      isDefault,
    };

    try {
      if (editingId) {
        // Update existing configuration
        await http.put(`/config/${editingId}`, payload);
        setSnackbar({ open: true, message: 'Configuração atualizada com sucesso!', severity: 'success' });
      } else {
        // Create new configuration
        await http.post('/config', payload);
        setSnackbar({ open: true, message: 'Configuração salva com sucesso!', severity: 'success' });
      }

      // Reset editing state after successful save
      setEditingId(null);

      console.log('FlowPlant Configuration:', JSON.stringify(flowPlant, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
      console.log('FlowPlant Configuration:', JSON.stringify(flowPlant, null, 2));

      setSnackbar({ open: true, message: 'Erro ao salvar configuração', severity: 'error' });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Load Config into Form (for editing)
  // ─────────────────────────────────────────────────────────────

  const normalizeFlowPlantConfig = (raw: FlowPlantConfig): FlowPlantConfig => {
    const stationstartProduction = Array.isArray(raw.stationstartProduction) ? raw.stationstartProduction : [];
    const shifts = Array.isArray(raw.shifts) ? raw.shifts : [];
    const plannedStops = Array.isArray(raw.plannedStops) ? raw.plannedStops : [];
    const oeeTargets = raw.oeeTargets && typeof raw.oeeTargets === 'object' ? raw.oeeTargets : {};

    const shops: Record<string, ShopConfig> = {};
    const rawShops = raw.shops && typeof raw.shops === 'object' ? raw.shops : {};

    for (const [shopKey, shopValue] of Object.entries(rawShops)) {
      const s = shopValue as Partial<ShopConfig> & { lines?: Record<string, unknown> };
      const rawLines = s.lines && typeof s.lines === 'object' ? (s.lines as Record<string, unknown>) : {};
      const lines: Record<string, LineConfig> = {};

      for (const [lineKey, lineValue] of Object.entries(rawLines)) {
        const l = (lineValue || {}) as Partial<LineConfig> & {
          buffers?: unknown;
          routes?: unknown;
          stations?: unknown;
          takt?: Partial<TaktConfig>;
          requiredParts?: unknown;
          createWith?: Partial<CreateWithConfig>;
        };

        const stations = Array.isArray(l.stations) ? (l.stations as string[]) : [];
        const buffers = Array.isArray(l.buffers) ? (l.buffers as BufferConfig[]) : [];
        const routes = Array.isArray(l.routes) ? (l.routes as RouteConfig[]) : [];

        lines[lineKey] = {
          MTTR: Number(l.MTTR ?? 0),
          MTBF: Number(l.MTBF ?? 0),
          stations,
          takt: {
            jph: Number(l.takt?.jph ?? raw.targetJPH ?? initialConfig.targetJPH),
            leadtime: Number(l.takt?.leadtime ?? 0),
            shiftStart: String(l.takt?.shiftStart ?? '07:00'),
            shiftEnd: String(l.takt?.shiftEnd ?? '16:00'),
          },
          buffers: buffers.map((b) => ({
            to: {
              shop: String((b as BufferConfig).to?.shop ?? ''),
              line: String((b as BufferConfig).to?.line ?? ''),
            },
            capacity: Number((b as BufferConfig).capacity ?? 0),
          })),
          routes: routes.map((r) => ({
            fromStation: String((r as RouteConfig).fromStation ?? ''),
            to: Array.isArray((r as RouteConfig).to)
              ? (r as RouteConfig).to.map((d) => ({
                  shop: String((d as RouteDestination).shop ?? ''),
                  line: String((d as RouteDestination).line ?? ''),
                  station: String((d as RouteDestination).station ?? ''),
                }))
              : [],
          })),

          partType: typeof l.partType === 'string' && l.partType.trim() ? l.partType : undefined,
          createWith:
            l.createWith && (typeof l.createWith.line === 'string' || typeof l.createWith.station === 'string')
              ? { line: String(l.createWith.line ?? ''), station: String(l.createWith.station ?? '') }
              : undefined,
          requiredParts: Array.isArray(l.requiredParts)
            ? (l.requiredParts as RequiredPart[]).map((rp) => ({
                partType: String((rp as RequiredPart).partType ?? ''),
                consumeStation: String((rp as RequiredPart).consumeStation ?? ''),
              }))
            : undefined,
          partConsumptionStation:
            typeof l.partConsumptionStation === 'string' && l.partConsumptionStation.trim()
              ? l.partConsumptionStation
              : undefined,
        };
      }

      shops[shopKey] = {
        name: typeof s.name === 'string' ? s.name : shopKey,
        bufferCapacity: Number((s as ShopConfig).bufferCapacity ?? 0),
        reworkBuffer: Number((s as ShopConfig).reworkBuffer ?? 0),
        lines,
      };
    }

    return {
      ...initialConfig,
      ...raw,
      stationstartProduction,
      shifts,
      plannedStops,
      oeeTargets,
      shops,
    };
  };

  const parseFlowPlantConfig = (value: ConfigPlant['config']): FlowPlantConfig => {
    if (value && typeof value === 'object') {
      return normalizeFlowPlantConfig(value as unknown as FlowPlantConfig);
    }

    if (typeof value !== 'string') {
      throw new Error('Config inválida: formato não suportado');
    }

    const getParseErrorPosition = (error: unknown): number | null => {
      if (!(error instanceof Error)) return null;
      const match = /position\s+(\d+)/i.exec(error.message);
      if (!match) return null;
      const pos = Number(match[1]);
      return Number.isFinite(pos) ? pos : null;
    };

    const repairJsonByBalancingClosers = (text: string): { repaired: string; appended: string } => {
      // Tenta reparar JSON truncado no final adicionando fechamentos faltantes.
      // Usa stack para manter a ordem correta e ignora caracteres dentro de strings.
      const stack: Array<'}' | ']'> = [];
      let inString = false;
      let escaped = false;

      for (const char of text) {
        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === '\\') {
          if (inString) escaped = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (inString) continue;

        if (char === '{') stack.push('}');
        else if (char === '[') stack.push(']');
        else if (char === '}' || char === ']') {
          const expected = stack[stack.length - 1];
          if (expected === char) {
            stack.pop();
          } else {
            // Estrutura inconsistente; não dá para reparar com segurança
            return { repaired: text, appended: '' };
          }
        }
      }

      if (inString || stack.length === 0) {
        return { repaired: text, appended: '' };
      }

      const appended = stack.reverse().join('');
      return { repaired: text + appended, appended };
    };

    const safeParse = (text: string): unknown => {
      try {
        return JSON.parse(text);
      } catch (error) {
        const trimmed = text.trim();
        const canAttemptRepair = trimmed.startsWith('{') || trimmed.startsWith('[');
        if (canAttemptRepair) {
          const { repaired, appended } = repairJsonByBalancingClosers(trimmed);
          if (appended) {
            try {
              const repairedValue = JSON.parse(repaired);
              const warnKey = `${trimmed.length}:${appended}`;
              if (!repairedConfigWarningsRef.current.has(warnKey)) {
                repairedConfigWarningsRef.current.add(warnKey);
                console.warn('Config JSON reparado (fechamentos adicionados):', appended);
              }
              return repairedValue;
            } catch {
              // fallthrough
            }
          }
        }

        const pos = getParseErrorPosition(error);
        if (pos != null) {
          const start = Math.max(0, pos - 80);
          const end = Math.min(trimmed.length, pos + 80);
          const snippet = trimmed.slice(start, end);
          throw new Error(`Falha ao interpretar JSON (pos ${pos}). Trecho: ${snippet}`);
        }

        throw error;
      }
    };

    // Suporta:
    // - JSON como string ("{...}")
    // - JSON duplamente stringificado ("\"{...}\"")
    // - Objeto já parseado (tratado acima)
    let current: unknown = value.trim();
    for (let i = 0; i < 3; i += 1) {
      if (typeof current !== 'string') break;

      const trimmed = current.trim();
      if (!trimmed) {
        throw new Error('Config inválida: string vazia');
      }

      current = safeParse(trimmed);
    }

    if (!current || typeof current !== 'object') {
      throw new Error('Config inválida: JSON não resultou em objeto');
    }

    return normalizeFlowPlantConfig(current as FlowPlantConfig);
  };

  const loadConfigForEdit = (savedConfig: ConfigPlant) => {
    try {
      const parsedConfig = parseFlowPlantConfig(savedConfig.config);
      
      setConfig({
        ...initialConfig,
        ...parsedConfig,
      });
      setConfigName(savedConfig.name);
      setIsDefault(savedConfig.isDefault);
      setEditingId(savedConfig.id);
      setActiveTab(0); // Switch to "Parâmetros Globais" tab
      setSnackbar({ open: true, message: `Configuração "${savedConfig.name}" carregada para edição`, severity: 'success' });
    } catch (error) {
      console.error('Error parsing config:', error);
      console.error(
        'Config debug:',
        typeof savedConfig.config === 'string'
          ? {
              length: savedConfig.config.length,
              start: savedConfig.config.slice(0, 100),
              end: savedConfig.config.slice(-100),
            }
          : savedConfig.config
      );

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setSnackbar({
        open: true,
        message: `Erro ao carregar configuração: ${errorMessage}`,
        severity: 'error',
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Delete Configuration
  // ─────────────────────────────────────────────────────────────

  const deleteConfig = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a configuração "${name}"?`)) {
      return;
    }

    try {
      await http.delete(`/config/${id}`);
      setSnackbar({ open: true, message: 'Configuração excluída com sucesso!', severity: 'success' });
      fetchConfigs(); // Refresh the list
    } catch (error) {
      console.error('Error deleting config:', error);
      setSnackbar({ open: true, message: 'Erro ao excluir configuração', severity: 'error' });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Toggle expanded JSON view
  // ─────────────────────────────────────────────────────────────

  const toggleExpandConfig = (id: string) => {
    setExpandedConfigs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Reset form for new configuration
  // ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setConfig(initialConfig);
    setConfigName('');
    setIsDefault(false);
    setEditingId(null);
    setActiveTab(0);
  };

  // ─────────────────────────────────────────────────────────────
  // Helper: Get all shops/lines for selects
  // ─────────────────────────────────────────────────────────────

  const shopNames = Object.keys(config.shops);
  const getAllLines = (shopKey: string) => Object.keys(config.shops[shopKey]?.lines || {});
  const getStations = (shopKey: string, lineKey: string) => config.shops[shopKey]?.lines[lineKey]?.stations || [];

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 4, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            ⚙️ Configurações da Planta
          </Typography>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} size="large">
            Salvar Configuração
          </Button>
        </Stack>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
          <Tab label="Parâmetros Globais" />
          <Tab label="Turnos" />
          <Tab label="Paradas Planejadas" />
          <Tab label="Shops & Linhas" />
          <Tab label="Modelos" />
        </Tabs>

        {/* ─────────────────────────────────────────────────────────────
            TAB 0: Global Parameters
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            {/* Configuration Name - Highlighted */}
            <Paper sx={{ p: 3, border: 2, borderColor: 'primary.main', bgcolor: 'primary.50' }}>
              <SectionHeader
                icon={<SettingsIcon color="primary" />}
                title="Nome da Configuração"
                subtitle="Identificador único desta configuração de planta"
              />
              <TextField
                label="Nome da Configuração"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                size="medium"
                fullWidth
                placeholder="Ex: Planta São Paulo - Produção"
                helperText="Este nome será usado como identificador no banco de dados"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StarIcon color={isDefault ? 'warning' : 'disabled'} fontSize="small" />
                    <Typography>Marcar como Modelo padrão</Typography>
                  </Stack>
                }
                sx={{ mt: 2 }}
              />
              {editingId && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Editando configuração existente. <Button size="small" onClick={resetForm}>Cancelar edição</Button>
                </Alert>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <SectionHeader
                icon={<SpeedIcon color="primary" />}
                title="Parâmetros Globais"
                subtitle="Configurações gerais da simulação"
              />
              <Stack direction="row" flexWrap="wrap" gap={2}>
                <TextField
                  label="Speed Factor"
                  type="number"
                  value={config.typeSpeedFactor}
                  onChange={(e) => updateGlobal('typeSpeedFactor', Number(e.target.value))}
                  size="small"
                  sx={{ width: 150 }}
                  helperText="1 = tempo real"
                />
                <TextField
                  label="Takt Min Fraction"
                  type="number"
                  inputProps={{ step: 0.01, min: 0, max: 1 }}
                  value={config.stationTaktMinFraction}
                  onChange={(e) => updateGlobal('stationTaktMinFraction', Number(e.target.value))}
                  size="small"
                  sx={{ width: 150 }}
                />
                <TextField
                  label="Takt Max Fraction"
                  type="number"
                  inputProps={{ step: 0.001, min: 0, max: 1 }}
                  value={config.stationTaktMaxFraction}
                  onChange={(e) => updateGlobal('stationTaktMaxFraction', Number(e.target.value))}
                  size="small"
                  sx={{ width: 150 }}
                />
                <TextField
                  label="DPHU"
                  type="number"
                  value={config.DPHU}
                  onChange={(e) => updateGlobal('DPHU', Number(e.target.value))}
                  size="small"
                  sx={{ width: 120 }}
                  helperText="Defeitos/100 un"
                />
                <TextField
                  label="Rework Time (min)"
                  type="number"
                  value={config.Rework_Time}
                  onChange={(e) => updateGlobal('Rework_Time', Number(e.target.value))}
                  size="small"
                  sx={{ width: 150 }}
                />
                <TextField
                  label="Target JPH"
                  type="number"
                  value={config.targetJPH}
                  onChange={(e) => updateGlobal('targetJPH', Number(e.target.value))}
                  size="small"
                  sx={{ width: 120 }}
                  helperText="Jobs por hora"
                />
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <SectionHeader
                icon={<FactoryIcon color="primary" />}
                title="Estações de Início de Produção"
                subtitle="Postos que recebem carros novos (injeção no fluxo)"
              />
              <Stack spacing={2}>
                {config.stationstartProduction.map((sp, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Shop</InputLabel>
                      <Select
                        label="Shop"
                        value={sp.shop}
                        onChange={(e) => updateStartStation(i, 'shop', e.target.value)}
                      >
                        {shopNames.map((s) => (
                          <MenuItem key={s} value={s}>
                            {s}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Line</InputLabel>
                      <Select
                        label="Line"
                        value={sp.line}
                        onChange={(e) => updateStartStation(i, 'line', e.target.value)}
                      >
                        {getAllLines(sp.shop).map((l) => (
                          <MenuItem key={l} value={l}>
                            {l}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>Station</InputLabel>
                      <Select
                        label="Station"
                        value={sp.station}
                        onChange={(e) => updateStartStation(i, 'station', e.target.value)}
                      >
                        {getStations(sp.shop, sp.line).map((st) => (
                          <MenuItem key={st} value={st}>
                            {st}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <IconButton color="error" onClick={() => removeStartStation(i)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button startIcon={<AddIcon />} onClick={addStartStation} variant="outlined" size="small">
                  Adicionar Estação de Início
                </Button>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: Shifts
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <SectionHeader icon={<AccessTimeIcon color="primary" />} title="Turnos" subtitle="Configuração dos turnos de trabalho" />
            <Stack spacing={2}>
              {config.shifts.map((shift, i) => (
                <Stack key={i} direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="ID"
                    value={shift.id}
                    onChange={(e) => updateShift(i, 'id', e.target.value)}
                    size="small"
                    sx={{ width: 150 }}
                  />
                  <TextField
                    label="Início"
                    type="time"
                    value={shift.start}
                    onChange={(e) => updateShift(i, 'start', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Fim"
                    type="time"
                    value={shift.end}
                    onChange={(e) => updateShift(i, 'end', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <IconButton color="error" onClick={() => removeShift(i)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button startIcon={<AddIcon />} onClick={addShift} variant="outlined">
                Adicionar Turno
              </Button>
            </Stack>
          </Paper>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: Planned Stops
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <SectionHeader
              icon={<EventBusyIcon color="primary" />}
              title="Paradas Planejadas"
              subtitle="Configure paradas programadas (almoço, reuniões, etc.)"
            />
            <Stack spacing={2}>
              {config.plannedStops.map((stop, i) => (
                <Accordion key={i}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography sx={{ fontWeight: 600 }}>{stop.name || 'Nova Parada'}</Typography>
                      <Chip label={stop.type} size="small" />
                      <Typography variant="body2" color="text.secondary">
                        {stop.startTime} - {stop.durationMn}min
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Stack direction="row" flexWrap="wrap" gap={2}>
                        <TextField
                          label="ID"
                          value={stop.id}
                          onChange={(e) => updatePlannedStop(i, 'id', e.target.value)}
                          size="small"
                          sx={{ width: 180 }}
                        />
                        <TextField
                          label="Nome"
                          value={stop.name}
                          onChange={(e) => updatePlannedStop(i, 'name', e.target.value)}
                          size="small"
                          sx={{ width: 200 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            label="Tipo"
                            value={stop.type}
                            onChange={(e) => updatePlannedStop(i, 'type', e.target.value)}
                          >
                            {STOP_TYPES.map((t) => (
                              <MenuItem key={t} value={t}>
                                {t}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Reason"
                          value={stop.reason}
                          onChange={(e) => updatePlannedStop(i, 'reason', e.target.value)}
                          size="small"
                          sx={{ width: 140 }}
                        />
                        <TextField
                          label="Hora Início"
                          type="time"
                          value={stop.startTime}
                          onChange={(e) => updatePlannedStop(i, 'startTime', e.target.value)}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          label="Duração (min)"
                          type="number"
                          value={stop.durationMn}
                          onChange={(e) => updatePlannedStop(i, 'durationMn', Number(e.target.value))}
                          size="small"
                          sx={{ width: 130 }}
                        />
                      </Stack>

                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                        Dias da Semana
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {DAYS_OF_WEEK.map((d) => (
                          <FormControlLabel
                            key={d.value}
                            control={
                              <Checkbox
                                checked={stop.daysOfWeek.includes(d.value)}
                                onChange={() => toggleDayOfWeek(i, d.value)}
                                size="small"
                              />
                            }
                            label={d.label}
                          />
                        ))}
                      </Stack>

                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                        Afeta Shops (deixe vazio para todos)
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {shopNames.map((s) => (
                          <FormControlLabel
                            key={s}
                            control={
                              <Checkbox
                                checked={(stop.affectsShops || []).includes(s)}
                                onChange={() => toggleAffectsShop(i, s)}
                                size="small"
                              />
                            }
                            label={s}
                          />
                        ))}
                      </Stack>

                      <Button
                        startIcon={<DeleteIcon />}
                        color="error"
                        variant="outlined"
                        onClick={() => removePlannedStop(i)}
                        sx={{ alignSelf: 'flex-start', mt: 1 }}
                      >
                        Remover Parada
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
              <Button startIcon={<AddIcon />} onClick={addPlannedStop} variant="outlined">
                Adicionar Parada Planejada
              </Button>
            </Stack>
          </Paper>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: Shops & Lines
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 3 && (
          <Stack spacing={2}>
            <Button startIcon={<AddIcon />} onClick={addShop} variant="contained" sx={{ alignSelf: 'flex-start' }}>
              Adicionar Shop
            </Button>

            {Object.entries(config.shops).map(([shopKey, shop]) => (
              <Accordion key={shopKey} defaultExpanded={shopNames.length <= 2}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                    <FactoryIcon color="primary" />
                    <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>{shop.name}</Typography>
                    <Chip label={`${Object.keys(shop.lines).length} linhas`} size="small" />
                    <Chip label={`OEE: ${((config.oeeTargets[shopKey] ?? 0.85) * 100).toFixed(0)}%`} size="small" color="success" />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={3}>
                    {/* Shop Settings */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Configurações do Shop
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={2}>
                        <TextField
                          label="Nome"
                          value={shop.name}
                          onChange={(e) => renameShop(shopKey, e.target.value)}
                          size="small"
                          sx={{ width: 150 }}
                        />
                        <TextField
                          label="Buffer Capacity"
                          type="number"
                          value={shop.bufferCapacity}
                          onChange={(e) => updateShop(shopKey, 'bufferCapacity', Number(e.target.value))}
                          size="small"
                          sx={{ width: 140 }}
                        />
                        <TextField
                          label="Rework Buffer"
                          type="number"
                          value={shop.reworkBuffer}
                          onChange={(e) => updateShop(shopKey, 'reworkBuffer', Number(e.target.value))}
                          size="small"
                          sx={{ width: 140 }}
                        />
                        <TextField
                          label="OEE Target"
                          type="number"
                          inputProps={{ step: 0.01, min: 0, max: 1 }}
                          value={config.oeeTargets[shopKey] ?? 0.85}
                          onChange={(e) => updateOeeTarget(shopKey, Number(e.target.value))}
                          size="small"
                          sx={{ width: 120 }}
                          helperText="0 a 1"
                        />
                        <Button
                          startIcon={<DeleteIcon />}
                          color="error"
                          variant="outlined"
                          onClick={() => removeShop(shopKey)}
                          size="small"
                        >
                          Excluir Shop
                        </Button>
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Lines */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Linhas
                        </Typography>
                        <Button startIcon={<AddIcon />} onClick={() => addLine(shopKey)} variant="outlined" size="small">
                          Adicionar Linha
                        </Button>
                      </Stack>

                      {Object.entries(shop.lines).map(([lineKey, line]) => (
                        <Accordion key={lineKey} sx={{ mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                              {line.partType ? (
                                <CategoryIcon color="info" fontSize="small" />
                              ) : (
                                <DirectionsCarIcon color="success" fontSize="small" />
                              )}
                              <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>{lineKey}</Typography>
                              {line.partType && (
                                <Chip label={`Part: ${line.partType}`} size="small" color="info" />
                              )}
                              {(line.requiredParts?.length ?? 0) > 0 && (
                                <Chip label={`Consome ${line.requiredParts?.length} peça(s)`} size="small" color="warning" />
                              )}
                              <Chip label={`${line.stations.length} stations`} size="small" variant="outlined" />
                              <Chip label={`JPH: ${line.takt.jph}`} size="small" variant="outlined" />
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={2}>
                              {/* Line basic info */}
                              <Stack direction="row" flexWrap="wrap" gap={2}>
                                <TextField
                                  label="Nome da Linha"
                                  value={lineKey}
                                  onChange={(e) => renameLine(shopKey, lineKey, e.target.value)}
                                  size="small"
                                  sx={{ width: 150 }}
                                />
                                <TextField
                                  label="MTTR"
                                  type="number"
                                  value={line.MTTR}
                                  onChange={(e) => updateLine(shopKey, lineKey, 'MTTR', Number(e.target.value))}
                                  size="small"
                                  sx={{ width: 100 }}
                                />
                                <TextField
                                  label="MTBF"
                                  type="number"
                                  value={line.MTBF}
                                  onChange={(e) => updateLine(shopKey, lineKey, 'MTBF', Number(e.target.value))}
                                  size="small"
                                  sx={{ width: 100 }}
                                />
                                <Button
                                  startIcon={<DeleteIcon />}
                                  color="error"
                                  variant="outlined"
                                  onClick={() => removeLine(shopKey, lineKey)}
                                  size="small"
                                >
                                  Excluir Linha
                                </Button>
                              </Stack>

                              {/* Part Line Configuration */}
                              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                                  🔧 Tipo de Linha (Part Line ou Car Line)
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
                                  <TextField
                                    label="Part Type"
                                    value={line.partType || ''}
                                    onChange={(e) => updateLine(shopKey, lineKey, 'partType', e.target.value || undefined)}
                                    size="small"
                                    sx={{ width: 200 }}
                                    placeholder="Ex: ENGINE, DOORS, FRONT_FLOOR..."
                                    helperText="Deixe vazio para Car Line"
                                  />
                                  {line.partType ? (
                                    <Chip
                                      icon={<CategoryIcon />}
                                      label={`Part Line: ${line.partType}`}
                                      color="info"
                                      size="small"
                                      onDelete={() => updateLine(shopKey, lineKey, 'partType', undefined)}
                                    />
                                  ) : (
                                    <Chip
                                      icon={<DirectionsCarIcon />}
                                      label="Car Line"
                                      color="success"
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Stack>

                                {/* CreateWith - sync part creation with another line */}
                                {line.partType && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                      Sincronizar Criação (createWith) - opcional
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <FormControl size="small" sx={{ minWidth: 140 }}>
                                        <InputLabel>Sync Line</InputLabel>
                                        <Select
                                          label="Sync Line"
                                          value={line.createWith?.line || ''}
                                          onChange={(e) => updateCreateWith(shopKey, lineKey, 'line', e.target.value)}
                                        >
                                          <MenuItem value="">
                                            <em>Nenhum</em>
                                          </MenuItem>
                                          {Object.keys(config.shops).flatMap((sk) =>
                                            Object.keys(config.shops[sk].lines).map((lk) => (
                                              <MenuItem key={`${sk}-${lk}`} value={lk}>
                                                {sk} → {lk}
                                              </MenuItem>
                                            ))
                                          )}
                                        </Select>
                                      </FormControl>
                                      <FormControl size="small" sx={{ minWidth: 100 }}>
                                        <InputLabel>Station</InputLabel>
                                        <Select
                                          label="Station"
                                          value={line.createWith?.station || ''}
                                          onChange={(e) => updateCreateWith(shopKey, lineKey, 'station', e.target.value)}
                                        >
                                          <MenuItem value="">
                                            <em>--</em>
                                          </MenuItem>
                                          {line.createWith?.line &&
                                            Object.entries(config.shops).flatMap(([, s]) =>
                                              Object.entries(s.lines)
                                                .filter(([lk]) => lk === line.createWith?.line)
                                                .flatMap(([, l]) => (l.stations || []).map((st) => (
                                                  <MenuItem key={st} value={st}>
                                                    {st}
                                                  </MenuItem>
                                                )))
                                            )}
                                        </Select>
                                      </FormControl>
                                      {line.createWith?.line && (
                                        <Button size="small" color="error" onClick={() => clearCreateWith(shopKey, lineKey)}>
                                          Limpar
                                        </Button>
                                      )}
                                    </Stack>
                                  </Box>
                                )}
                              </Paper>

                              {/* Required Parts - for Car Lines that consume parts */}
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                                  📦 Peças Consumidas (requiredParts) - para linhas que consomem peças
                                </Typography>
                                <Stack spacing={1}>
                                  {(line.requiredParts || []).map((rp, rpi) => (
                                    <Stack key={rpi} direction="row" spacing={1} alignItems="center">
                                      <TextField
                                        label="Part Type"
                                        value={rp.partType}
                                        onChange={(e) => updateRequiredPart(shopKey, lineKey, rpi, 'partType', e.target.value)}
                                        size="small"
                                        sx={{ width: 180 }}
                                        placeholder="Ex: ENGINE, DOORS..."
                                      />
                                      <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>Consume Station</InputLabel>
                                        <Select
                                          label="Consume Station"
                                          value={rp.consumeStation}
                                          onChange={(e) => updateRequiredPart(shopKey, lineKey, rpi, 'consumeStation', e.target.value)}
                                        >
                                          {(line.stations || []).map((st) => (
                                            <MenuItem key={st} value={st}>
                                              {st}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                      <IconButton color="error" size="small" onClick={() => removeRequiredPart(shopKey, lineKey, rpi)}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  ))}
                                  <Button
                                    startIcon={<AddIcon />}
                                    onClick={() => addRequiredPart(shopKey, lineKey)}
                                    variant="text"
                                    size="small"
                                    sx={{ alignSelf: 'flex-start' }}
                                  >
                                    Adicionar Peça Consumida
                                  </Button>
                                  {(line.requiredParts?.length ?? 0) > 0 && (
                                    <FormControl size="small" sx={{ minWidth: 180, mt: 1 }}>
                                      <InputLabel>Part Consumption Station</InputLabel>
                                      <Select
                                        label="Part Consumption Station"
                                        value={line.partConsumptionStation || ''}
                                        onChange={(e) => updateLine(shopKey, lineKey, 'partConsumptionStation', e.target.value || undefined)}
                                      >
                                        <MenuItem value="">
                                          <em>Usar consumeStation de cada peça</em>
                                        </MenuItem>
                                        {(line.stations || []).map((st) => (
                                          <MenuItem key={st} value={st}>
                                            {st}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  )}
                                </Stack>
                              </Paper>

                              {/* Takt */}
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Takt
                              </Typography>
                              <Stack direction="row" flexWrap="wrap" gap={2}>
                                <TextField
                                  label="JPH"
                                  type="number"
                                  value={line.takt.jph}
                                  onChange={(e) => updateLineTakt(shopKey, lineKey, 'jph', Number(e.target.value))}
                                  size="small"
                                  sx={{ width: 100 }}
                                />
                                <TextField
                                  label="Leadtime"
                                  type="number"
                                  inputProps={{ step: 0.01 }}
                                  value={line.takt.leadtime}
                                  onChange={(e) => updateLineTakt(shopKey, lineKey, 'leadtime', Number(e.target.value))}
                                  size="small"
                                  sx={{ width: 120 }}
                                />
                                <TextField
                                  label="Shift Start"
                                  type="time"
                                  value={line.takt.shiftStart}
                                  onChange={(e) => updateLineTakt(shopKey, lineKey, 'shiftStart', e.target.value)}
                                  size="small"
                                  InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                  label="Shift End"
                                  type="time"
                                  value={line.takt.shiftEnd}
                                  onChange={(e) => updateLineTakt(shopKey, lineKey, 'shiftEnd', e.target.value)}
                                  size="small"
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Stack>

                              {/* Stations */}
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Stations
                              </Typography>
                              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                                {(line.stations || []).map((st, si) => (
                                  <Chip
                                    key={si}
                                    label={st}
                                    onDelete={() => removeStation(shopKey, lineKey, si)}
                                    onClick={() => {
                                      const newName = prompt('Novo nome:', st);
                                      if (newName) renameStation(shopKey, lineKey, si, newName);
                                    }}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                ))}
                                <IconButton size="small" onClick={() => addStation(shopKey, lineKey)} color="primary">
                                  <AddIcon />
                                </IconButton>
                              </Stack>

                              {/* Buffers */}
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Buffers (saída para outras linhas)
                              </Typography>
                              {(line.buffers || []).map((buf, bi) => (
                                <Stack key={bi} direction="row" spacing={1} alignItems="center">
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>To Shop</InputLabel>
                                    <Select
                                      label="To Shop"
                                      value={buf.to.shop}
                                      onChange={(e) => updateBuffer(shopKey, lineKey, bi, 'toShop', e.target.value)}
                                    >
                                      {shopNames.map((s) => (
                                        <MenuItem key={s} value={s}>
                                          {s}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>To Line</InputLabel>
                                    <Select
                                      label="To Line"
                                      value={buf.to.line}
                                      onChange={(e) => updateBuffer(shopKey, lineKey, bi, 'toLine', e.target.value)}
                                    >
                                      {getAllLines(buf.to.shop).map((l) => (
                                        <MenuItem key={l} value={l}>
                                          {l}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <TextField
                                    label="Capacity"
                                    type="number"
                                    value={buf.capacity}
                                    onChange={(e) => updateBuffer(shopKey, lineKey, bi, 'capacity', Number(e.target.value))}
                                    size="small"
                                    sx={{ width: 100 }}
                                  />
                                  <IconButton color="error" onClick={() => removeBuffer(shopKey, lineKey, bi)}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Stack>
                              ))}
                              <Button
                                startIcon={<AddIcon />}
                                onClick={() => addBuffer(shopKey, lineKey)}
                                variant="text"
                                size="small"
                              >
                                Adicionar Buffer
                              </Button>

                              {/* Routes */}
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Rotas (de qual station vai para onde)
                              </Typography>
                              {(line.routes || []).map((route, ri) => (
                                <Paper key={ri} variant="outlined" sx={{ p: 1.5 }}>
                                  <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>From Station</InputLabel>
                                        <Select
                                          label="From Station"
                                          value={route.fromStation}
                                          onChange={(e) => updateRoute(shopKey, lineKey, ri, 'fromStation', e.target.value)}
                                        >
                                          {(line.stations || []).map((st) => (
                                            <MenuItem key={st} value={st}>
                                              {st}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                      <Typography variant="body2">→</Typography>
                                      <IconButton color="error" onClick={() => removeRoute(shopKey, lineKey, ri)} size="small">
                                        <DeleteIcon />
                                      </IconButton>
                                    </Stack>

                                    {(route.to || []).map((dest, di) => (
                                      <Stack key={di} direction="row" spacing={1} alignItems="center" sx={{ pl: 2 }}>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <InputLabel>Shop</InputLabel>
                                          <Select
                                            label="Shop"
                                            value={dest.shop}
                                            onChange={(e) =>
                                              updateRouteDestination(shopKey, lineKey, ri, di, 'shop', e.target.value)
                                            }
                                          >
                                            {shopNames.map((s) => (
                                              <MenuItem key={s} value={s}>
                                                {s}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <InputLabel>Line</InputLabel>
                                          <Select
                                            label="Line"
                                            value={dest.line}
                                            onChange={(e) =>
                                              updateRouteDestination(shopKey, lineKey, ri, di, 'line', e.target.value)
                                            }
                                          >
                                            {getAllLines(dest.shop).map((l) => (
                                              <MenuItem key={l} value={l}>
                                                {l}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                        <FormControl size="small" sx={{ minWidth: 80 }}>
                                          <InputLabel>Station</InputLabel>
                                          <Select
                                            label="Station"
                                            value={dest.station}
                                            onChange={(e) =>
                                              updateRouteDestination(shopKey, lineKey, ri, di, 'station', e.target.value)
                                            }
                                          >
                                            {getStations(dest.shop, dest.line).map((st) => (
                                              <MenuItem key={st} value={st}>
                                                {st}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                        <IconButton
                                          color="error"
                                          onClick={() => removeRouteDestination(shopKey, lineKey, ri, di)}
                                          size="small"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Stack>
                                    ))}
                                    <Button
                                      startIcon={<AddIcon />}
                                      onClick={() => addRouteDestination(shopKey, lineKey, ri)}
                                      variant="text"
                                      size="small"
                                      sx={{ alignSelf: 'flex-start', pl: 2 }}
                                    >
                                      Adicionar Destino
                                    </Button>
                                  </Stack>
                                </Paper>
                              ))}
                              <Button
                                startIcon={<AddIcon />}
                                onClick={() => addRoute(shopKey, lineKey)}
                                variant="text"
                                size="small"
                              >
                                Adicionar Rota
                              </Button>
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: Modelos (Saved Configurations)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 4 && (
          <Stack spacing={3}>
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <SectionHeader
                  icon={<FolderIcon color="primary" />}
                  title="Configurações Salvas"
                  subtitle="Gerencie todos os modelos de configuração da planta"
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={fetchConfigs}
                    disabled={configsLoading}
                  >
                    Atualizar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={resetForm}
                  >
                    Nova Configuração
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            {configsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : savedConfigs.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Nenhuma configuração salva ainda.
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={resetForm}>
                  Criar Primeira Configuração
                </Button>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {savedConfigs.map((savedConfig) => (
                  <Card key={savedConfig.id} sx={{ position: 'relative' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {savedConfig.name}
                            </Typography>
                            {savedConfig.isDefault && (
                              <Tooltip title="Modelo Padrão">
                                <Chip
                                  icon={<StarIcon />}
                                  label="Padrão"
                                  color="warning"
                                  size="small"
                                />
                              </Tooltip>
                            )}
                          </Stack>
                          <Stack direction="row" spacing={3}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>ID:</strong> {savedConfig.id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Criado em:</strong> {new Date(savedConfig.created_at * 1000).toLocaleString('pt-BR')}
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CodeIcon />}
                            onClick={() => toggleExpandConfig(savedConfig.id)}
                          >
                            {expandedConfigs.has(savedConfig.id) ? 'Ocultar JSON' : 'Ver JSON'}
                          </Button>
                        </Stack>
                      </Stack>

                      <Collapse in={expandedConfigs.has(savedConfig.id)}>
                        <Paper
                          sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: 'grey.100',
                            maxHeight: 400,
                            overflow: 'auto',
                          }}
                        >
                          <Typography
                            component="pre"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              color: theme.palette.textStation,
                              m: 0,
                            }}
                          >
                            {(() => {
                              try {
                                const parsed = parseFlowPlantConfig(savedConfig.config);
                                return JSON.stringify(parsed, null, 2);
                              } catch {
                                return String(savedConfig.config);
                              }
                            })()}
                          </Typography>
                        </Paper>
                      </Collapse>
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ justifyContent: 'flex-end', px: 2 }}>
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => loadConfigForEdit(savedConfig)}
                        color="primary"
                      >
                        Alterar
                      </Button>
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={() => deleteConfig(savedConfig.id, savedConfig.name)}
                        color="error"
                      >
                        Excluir
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
