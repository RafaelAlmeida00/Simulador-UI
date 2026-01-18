'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Factory,
  Clock,
  Calendar,
  Zap,
  Star,
  Edit,
  Code,
  Folder,
  GitBranch,
  Palette,
  Car,
  Timer,
  X,
} from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Separator } from '@/src/components/ui/separator';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/src/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';
import { EmptyState } from '@/src/components/feedback';
import http from '@/src/utils/http';

// ─────────────────────────────────────────────────────────────
// API Types
// ─────────────────────────────────────────────────────────────

type ConfigPlant = {
  id: string;
  name: string;
  config: string | Record<string, unknown>;
  isDefault: boolean;
  created_at: number;
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

type FlowPlantConfig = {
  // Mix & Product Config
  MIX_ITEMS_PER_LINE: number;
  colors: string[];
  models: string[];
  // Emit Intervals (ms)
  BUFFER_EMIT_INTERVAL: number;
  BUFFER_PERSIST_INTERVAL: number;
  PLANT_EMIT_INTERVAL: number;
  STOPS_EMIT_INTERVAL: number;
  OEE_EMIT_INTERVAL: number;
  CARS_EMIT_INTERVAL: number;
  // Simulation Parameters
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
  // Mix & Product Config
  MIX_ITEMS_PER_LINE: 10,
  colors: ['Red', 'Blue', 'Green', 'Black', 'White', 'Silver', 'Yellow', 'Orange', 'Purple', 'Gray'],
  models: ['P19', 'P20', 'P35'],
  // Emit Intervals (ms)
  BUFFER_EMIT_INTERVAL: 5000,
  BUFFER_PERSIST_INTERVAL: 3600000,
  PLANT_EMIT_INTERVAL: 10000,
  STOPS_EMIT_INTERVAL: 10000,
  OEE_EMIT_INTERVAL: 10000,
  CARS_EMIT_INTERVAL: 10000,
  // Simulation Parameters
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
  { value: 6, label: 'Sab' },
];

const STOP_TYPES = ['LUNCH', 'MEETING', 'SHIFT_CHANGE', 'NIGHT_STOP', 'MAINTENANCE', 'OTHER'];

// ─────────────────────────────────────────────────────────────
// Toast Helper (simplified)
// ─────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = React.useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return { toast, showToast };
}

// ─────────────────────────────────────────────────────────────
// Section Header Component
// ─────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [config, setConfig] = React.useState<FlowPlantConfig>(initialConfig);
  const [configName, setConfigName] = React.useState('');
  const [isDefault, setIsDefault] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('global');

  // State for saved configs
  const [savedConfigs, setSavedConfigs] = React.useState<ConfigPlant[]>([]);
  const [configsLoading, setConfigsLoading] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [expandedConfigs, setExpandedConfigs] = React.useState<Set<string>>(new Set());

  const { toast, showToast } = useToast();

  // ─────────────────────────────────────────────────────────────
  // Fetch Saved Configurations
  // ─────────────────────────────────────────────────────────────

  const fetchConfigs = React.useCallback(async () => {
    setConfigsLoading(true);
    try {
      const response = await http.get<ConfigPlant[]>('/config');
      const data = response.data;
      if (Array.isArray(data)) {
        setSavedConfigs(data);
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: ConfigPlant[] }).data)) {
        setSavedConfigs((data as { data: ConfigPlant[] }).data);
      } else {
        console.warn('API returned unexpected format:', data);
        setSavedConfigs([]);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      showToast('Erro ao carregar configuracoes', 'error');
    } finally {
      setConfigsLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    if (activeTab === 'modelos') {
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

  const removeShop = (shopKey: string) => {
    setConfig((prev) => {
      const restShops = { ...prev.shops };
      delete restShops[shopKey];
      const restOee = { ...prev.oeeTargets };
      delete restOee[shopKey];
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
            },
          },
        },
      },
    }));
  };

  const removeLine = (shopKey: string, lineKey: string) => {
    setConfig((prev) => {
      const restLines = { ...prev.shops[shopKey].lines };
      delete restLines[lineKey];
      return {
        ...prev,
        shops: {
          ...prev.shops,
          [shopKey]: { ...prev.shops[shopKey], lines: restLines },
        },
      };
    });
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
  // Colors Handlers
  // ─────────────────────────────────────────────────────────────

  const [newColor, setNewColor] = React.useState('');

  const addColor = () => {
    if (!newColor.trim()) return;
    if (config.colors.includes(newColor.trim())) {
      showToast('Cor ja existe na lista', 'error');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      colors: [...prev.colors, newColor.trim()],
    }));
    setNewColor('');
  };

  const removeColor = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Models Handlers
  // ─────────────────────────────────────────────────────────────

  const [newModel, setNewModel] = React.useState('');

  const addModel = () => {
    if (!newModel.trim()) return;
    if (config.models.includes(newModel.trim())) {
      showToast('Modelo ja existe na lista', 'error');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      models: [...prev.models, newModel.trim()],
    }));
    setNewModel('');
  };

  const removeModel = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      models: prev.models.filter((_, i) => i !== index),
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Emit Intervals Handler
  // ─────────────────────────────────────────────────────────────

  const updateInterval = (key: keyof FlowPlantConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // ─────────────────────────────────────────────────────────────
  // Save Handler
  // ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!configName.trim()) {
      showToast('Por favor, informe o nome da configuracao', 'error');
      return;
    }

    const flowPlant = {
      // Mix & Product Config
      MIX_ITEMS_PER_LINE: config.MIX_ITEMS_PER_LINE,
      colors: config.colors,
      models: config.models,
      // Emit Intervals
      BUFFER_EMIT_INTERVAL: config.BUFFER_EMIT_INTERVAL,
      BUFFER_PERSIST_INTERVAL: config.BUFFER_PERSIST_INTERVAL,
      PLANT_EMIT_INTERVAL: config.PLANT_EMIT_INTERVAL,
      STOPS_EMIT_INTERVAL: config.STOPS_EMIT_INTERVAL,
      OEE_EMIT_INTERVAL: config.OEE_EMIT_INTERVAL,
      CARS_EMIT_INTERVAL: config.CARS_EMIT_INTERVAL,
      // Simulation Parameters
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
        await http.put(`/config/${editingId}`, payload);
        showToast('Configuracao atualizada com sucesso!', 'success');
      } else {
        await http.post('/config', payload);
        showToast('Configuracao salva com sucesso!', 'success');
      }
      setEditingId(null);
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Erro ao salvar configuracao', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Load Config into Form
  // ─────────────────────────────────────────────────────────────

  const loadConfigForEdit = (savedConfig: ConfigPlant) => {
    try {
      let parsedConfig: FlowPlantConfig;

      if (typeof savedConfig.config === 'string') {
        parsedConfig = JSON.parse(savedConfig.config);
      } else {
        parsedConfig = savedConfig.config as unknown as FlowPlantConfig;
      }

      setConfig({
        ...initialConfig,
        ...parsedConfig,
      });
      setConfigName(savedConfig.name);
      setIsDefault(savedConfig.isDefault);
      setEditingId(savedConfig.id);
      setActiveTab('global');
      showToast(`Configuracao "${savedConfig.name}" carregada para edicao`, 'success');
    } catch (error) {
      console.error('Error parsing config:', error);
      showToast('Erro ao carregar configuracao', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Delete Configuration
  // ─────────────────────────────────────────────────────────────

  const deleteConfig = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a configuracao "${name}"?`)) {
      return;
    }

    try {
      await http.delete(`/config/${id}`);
      showToast('Configuracao excluida com sucesso!', 'success');
      fetchConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      showToast('Erro ao excluir configuracao', 'error');
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
  // Reset form
  // ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setConfig(initialConfig);
    setConfigName('');
    setIsDefault(false);
    setEditingId(null);
    setActiveTab('global');
  };

  // ─────────────────────────────────────────────────────────────
  // Helper functions
  // ─────────────────────────────────────────────────────────────

  const shopNames = Object.keys(config.shops);
  const getAllLines = (shopKey: string) => Object.keys(config.shops[shopKey]?.lines || {});
  const getStations = (shopKey: string, lineKey: string) => config.shops[shopKey]?.lines[lineKey]?.stations || [];

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Configuracoes da Planta</h1>
          {editingId && <Badge variant="warning">Editando</Badge>}
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Configuracao
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="global">Parametros Globais</TabsTrigger>
            <TabsTrigger value="turnos">Turnos</TabsTrigger>
            <TabsTrigger value="paradas">Paradas Planejadas</TabsTrigger>
            <TabsTrigger value="shops">Shops & Linhas</TabsTrigger>
            <TabsTrigger value="modelos">Modelos</TabsTrigger>
          </TabsList>

          {/* Global Parameters Tab */}
          <TabsContent value="global" className="space-y-4 mt-4">
            {/* Config Name Card */}
            <Card className="p-4 border-2 border-primary">
              <SectionHeader icon={Settings} title="Nome da Configuracao" subtitle="Identificador unico desta configuracao de planta" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Configuracao</Label>
                  <Input
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="Ex: Planta Sao Paulo - Producao"
                  />
                  <p className="text-xs text-muted-foreground">Este nome sera usado como identificador no banco de dados</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={isDefault}
                    onCheckedChange={(checked) => setIsDefault(checked === true)}
                  />
                  <Label htmlFor="isDefault" className="flex items-center gap-2">
                    <Star className={`h-4 w-4 ${isDefault ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                    Marcar como Modelo padrao
                  </Label>
                </div>
                {editingId && (
                  <div className="flex items-center gap-2 p-2 bg-info/10 rounded-lg">
                    <span className="text-sm text-info">Editando configuracao existente.</span>
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      Cancelar edicao
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Global Parameters */}
            <Card className="p-4">
              <SectionHeader icon={Zap} title="Parametros Globais" subtitle="Configuracoes gerais da simulacao" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                <div className="space-y-2">
                  <Label>Speed Factor</Label>
                  <Input
                    type="number"
                    value={config.typeSpeedFactor}
                    onChange={(e) => updateGlobal('typeSpeedFactor', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">1 = tempo real</p>
                </div>
                <div className="space-y-2">
                  <Label>Mix Items/Line</Label>
                  <Input
                    type="number"
                    value={config.MIX_ITEMS_PER_LINE}
                    onChange={(e) => updateGlobal('MIX_ITEMS_PER_LINE', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Ajusta o MIX de Carros</p>
                </div>
                <div className="space-y-2">
                  <Label>Takt Min Fraction</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.stationTaktMinFraction}
                    onChange={(e) => updateGlobal('stationTaktMinFraction', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Takt Max Fraction</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={config.stationTaktMaxFraction}
                    onChange={(e) => updateGlobal('stationTaktMaxFraction', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>DPHU</Label>
                  <Input
                    type="number"
                    value={config.DPHU}
                    onChange={(e) => updateGlobal('DPHU', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Defeitos/100 un</p>
                </div>
                <div className="space-y-2">
                  <Label>Rework Time (min)</Label>
                  <Input
                    type="number"
                    value={config.Rework_Time}
                    onChange={(e) => updateGlobal('Rework_Time', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target JPH</Label>
                  <Input
                    type="number"
                    value={config.targetJPH}
                    onChange={(e) => updateGlobal('targetJPH', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Jobs por hora</p>
                </div>
              </div>
            </Card>

            {/* Colors & Models */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Colors */}
              <Card className="p-4">
                <SectionHeader icon={Palette} title="Cores" subtitle="Cores disponiveis para os carros" />
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {config.colors.map((color, i) => (
                      <Badge key={i} variant="outline" className="flex items-center gap-1 px-3 py-1.5">
                        {color}
                        <button
                          type="button"
                          onClick={() => removeColor(i)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Nova cor..."
                      onKeyDown={(e) => e.key === 'Enter' && addColor()}
                    />
                    <Button variant="outline" onClick={addColor} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Models */}
              <Card className="p-4">
                <SectionHeader icon={Car} title="Modelos" subtitle="Modelos de carros (ex: P19, P20)" />
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {config.models.map((model, i) => (
                      <Badge key={i} variant="outline" className="flex items-center gap-1 px-3 py-1.5">
                        {model}
                        <button
                          type="button"
                          onClick={() => removeModel(i)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      placeholder="Novo modelo..."
                      onKeyDown={(e) => e.key === 'Enter' && addModel()}
                    />
                    <Button variant="outline" onClick={addModel} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Emit Intervals */}
            <Card className="p-4">
              <SectionHeader icon={Timer} title="Intervalos de Emissao" subtitle="Frequencia de envio de dados (ms)" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>Buffer Emit</Label>
                  <Input
                    type="number"
                    value={config.BUFFER_EMIT_INTERVAL}
                    onChange={(e) => updateInterval('BUFFER_EMIT_INTERVAL', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">{(config.BUFFER_EMIT_INTERVAL / 1000).toFixed(1)}s</p>
                </div>
                <div className="space-y-2">
                  <Label>Buffer Persist</Label>
                  <Input
                    type="number"
                    value={config.BUFFER_PERSIST_INTERVAL}
                    onChange={(e) => updateInterval('BUFFER_PERSIST_INTERVAL', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">{(config.BUFFER_PERSIST_INTERVAL / 60000).toFixed(0)}min</p>
                </div>
                <div className="space-y-2">
                  <Label>Plant Emit</Label>
                  <Input
                    type="number"
                    value={config.PLANT_EMIT_INTERVAL}
                    onChange={(e) => updateInterval('PLANT_EMIT_INTERVAL', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">{(config.PLANT_EMIT_INTERVAL / 1000).toFixed(1)}s</p>
                </div>
                <div className="space-y-2">
                  <Label>Stops Emit</Label>
                  <Input
                    type="number"
                    value={config.STOPS_EMIT_INTERVAL}
                    onChange={(e) => updateInterval('STOPS_EMIT_INTERVAL', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">{(config.STOPS_EMIT_INTERVAL / 1000).toFixed(1)}s</p>
                </div>
                <div className="space-y-2">
                  <Label>OEE Emit</Label>
                  <Input
                    type="number"
                    value={config.OEE_EMIT_INTERVAL}
                    onChange={(e) => updateInterval('OEE_EMIT_INTERVAL', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">{(config.OEE_EMIT_INTERVAL / 1000).toFixed(1)}s</p>
                </div>
                <div className="space-y-2">
                  <Label>Cars Emit</Label>
                  <Input
                    type="number"
                    value={config.CARS_EMIT_INTERVAL}
                    onChange={(e) => updateInterval('CARS_EMIT_INTERVAL', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">{(config.CARS_EMIT_INTERVAL / 1000).toFixed(1)}s</p>
                </div>
              </div>
            </Card>

            {/* Start Stations */}
            <Card className="p-4">
              <SectionHeader icon={Factory} title="Estacoes de Inicio de Producao" subtitle="Postos que recebem carros novos" />
              <div className="space-y-3">
                {config.stationstartProduction.map((sp, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <Select value={sp.shop} onValueChange={(v) => updateStartStation(i, 'shop', v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Shop" />
                      </SelectTrigger>
                      <SelectContent>
                        {shopNames.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sp.line} onValueChange={(v) => updateStartStation(i, 'line', v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Line" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllLines(sp.shop).map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sp.station} onValueChange={(v) => updateStartStation(i, 'station', v)}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Station" />
                      </SelectTrigger>
                      <SelectContent>
                        {getStations(sp.shop, sp.line).map((st) => (
                          <SelectItem key={st} value={st}>{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeStartStation(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addStartStation} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Estacao de Inicio
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Shifts Tab */}
          <TabsContent value="turnos" className="mt-4">
            <Card className="p-4">
              <SectionHeader icon={Clock} title="Turnos" subtitle="Configuracao dos turnos de trabalho" />
              <div className="space-y-3">
                {config.shifts.map((shift, i) => (
                  <div key={i} className="flex items-center gap-3 flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-xs">ID</Label>
                      <Input
                        value={shift.id}
                        onChange={(e) => updateShift(i, 'id', e.target.value)}
                        className="w-[150px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Inicio</Label>
                      <Input
                        type="time"
                        value={shift.start}
                        onChange={(e) => updateShift(i, 'start', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="time"
                        value={shift.end}
                        onChange={(e) => updateShift(i, 'end', e.target.value)}
                      />
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeShift(i)} className="mt-5">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addShift} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Turno
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Planned Stops Tab */}
          <TabsContent value="paradas" className="mt-4">
            <Card className="p-4">
              <SectionHeader icon={Calendar} title="Paradas Planejadas" subtitle="Configure paradas programadas" />
              <Accordion type="multiple" className="space-y-2">
                {config.plannedStops.map((stop, i) => (
                  <AccordionItem key={i} value={`stop-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{stop.name || 'Nova Parada'}</span>
                        <Badge variant="outline">{stop.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {stop.startTime} - {stop.durationMn}min
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="flex flex-wrap gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">ID</Label>
                          <Input
                            value={stop.id}
                            onChange={(e) => updatePlannedStop(i, 'id', e.target.value)}
                            className="w-[180px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={stop.name}
                            onChange={(e) => updatePlannedStop(i, 'name', e.target.value)}
                            className="w-[200px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo</Label>
                          <Select value={stop.type} onValueChange={(v) => updatePlannedStop(i, 'type', v)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STOP_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Reason</Label>
                          <Input
                            value={stop.reason}
                            onChange={(e) => updatePlannedStop(i, 'reason', e.target.value)}
                            className="w-[140px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Hora Inicio</Label>
                          <Input
                            type="time"
                            value={stop.startTime}
                            onChange={(e) => updatePlannedStop(i, 'startTime', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duracao (min)</Label>
                          <Input
                            type="number"
                            value={stop.durationMn}
                            onChange={(e) => updatePlannedStop(i, 'durationMn', Number(e.target.value))}
                            className="w-[100px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Dias da Semana</Label>
                        <div className="flex gap-2">
                          {DAYS_OF_WEEK.map((d) => (
                            <div key={d.value} className="flex items-center space-x-1">
                              <Checkbox
                                id={`day-${i}-${d.value}`}
                                checked={stop.daysOfWeek.includes(d.value)}
                                onCheckedChange={() => toggleDayOfWeek(i, d.value)}
                              />
                              <Label htmlFor={`day-${i}-${d.value}`} className="text-xs">{d.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button variant="destructive" size="sm" onClick={() => removePlannedStop(i)} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Remover Parada
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Button variant="outline" onClick={addPlannedStop} className="gap-2 mt-4">
                <Plus className="h-4 w-4" />
                Adicionar Parada Planejada
              </Button>
            </Card>
          </TabsContent>

          {/* Shops & Lines Tab */}
          <TabsContent value="shops" className="mt-4 space-y-4">
            <Button onClick={addShop} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Shop
            </Button>

            <Accordion type="multiple" className="space-y-2">
              {Object.entries(config.shops).map(([shopKey, shop]) => (
                <AccordionItem key={shopKey} value={shopKey} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Factory className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{shop.name}</span>
                      <Badge variant="outline">{Object.keys(shop.lines).length} linhas</Badge>
                      <Badge variant="success">OEE: {((config.oeeTargets[shopKey] ?? 0.85) * 100).toFixed(0)}%</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-4">
                    {/* Shop Settings */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Configuracoes do Shop</h4>
                      <div className="flex flex-wrap gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={shop.name}
                            onChange={(e) => updateShop(shopKey, 'name', e.target.value)}
                            className="w-[150px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Buffer Capacity</Label>
                          <Input
                            type="number"
                            value={shop.bufferCapacity}
                            onChange={(e) => updateShop(shopKey, 'bufferCapacity', Number(e.target.value))}
                            className="w-[120px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Rework Buffer</Label>
                          <Input
                            type="number"
                            value={shop.reworkBuffer}
                            onChange={(e) => updateShop(shopKey, 'reworkBuffer', Number(e.target.value))}
                            className="w-[120px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">OEE Target</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={config.oeeTargets[shopKey] ?? 0.85}
                            onChange={(e) => updateOeeTarget(shopKey, Number(e.target.value))}
                            className="w-[100px]"
                          />
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => removeShop(shopKey)} className="gap-2 mt-5">
                          <Trash2 className="h-4 w-4" />
                          Excluir Shop
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Lines */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Linhas</h4>
                        <Button variant="outline" size="sm" onClick={() => addLine(shopKey)} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar Linha
                        </Button>
                      </div>

                      {Object.entries(shop.lines).map(([lineKey, line]) => (
                        <Card key={lineKey} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4 text-success" />
                              <span className="font-medium">{lineKey}</span>
                              <Badge variant="outline">{line.stations.length} stations</Badge>
                              <Badge variant="outline">JPH: {line.takt.jph}</Badge>
                            </div>
                            <Button variant="ghost" size="icon-sm" onClick={() => removeLine(shopKey, lineKey)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            MTTR: {line.MTTR} | MTBF: {line.MTBF} | Takt: {line.takt.shiftStart} - {line.takt.shiftEnd}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="modelos" className="mt-4 space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <SectionHeader icon={Folder} title="Configuracoes Salvas" subtitle="Gerencie todos os modelos de configuracao" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchConfigs} disabled={configsLoading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${configsLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Button onClick={resetForm} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Configuracao
                  </Button>
                </div>
              </div>
            </Card>

            {configsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[120px] rounded-xl" />
                ))}
              </div>
            ) : savedConfigs.length === 0 ? (
              <Card className="p-8">
                <EmptyState
                  type="no-data"
                  title="Nenhuma configuracao salva"
                  description="Crie sua primeira configuracao de planta."
                  action={{ label: 'Criar Primeira Configuracao', onClick: resetForm }}
                />
              </Card>
            ) : (
              <div className="space-y-4">
                {savedConfigs.map((savedConfig) => (
                  <Card key={savedConfig.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{savedConfig.name}</h3>
                          {savedConfig.isDefault && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="warning" className="gap-1">
                                  <Star className="h-3 w-3" />
                                  Padrao
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Modelo Padrao</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span><strong>ID:</strong> {savedConfig.id}</span>
                          <span><strong>Criado em:</strong> {new Date(savedConfig.created_at * 1000).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toggleExpandConfig(savedConfig.id)} className="gap-2">
                        <Code className="h-4 w-4" />
                        {expandedConfigs.has(savedConfig.id) ? 'Ocultar JSON' : 'Ver JSON'}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {expandedConfigs.has(savedConfig.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4"
                        >
                          <ScrollArea className="h-[300px] rounded-lg bg-muted p-4">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                              {typeof savedConfig.config === 'string'
                                ? JSON.stringify(JSON.parse(savedConfig.config), null, 2)
                                : JSON.stringify(savedConfig.config, null, 2)}
                            </pre>
                          </ScrollArea>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Separator className="my-3" />

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => loadConfigForEdit(savedConfig)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Alterar
                      </Button>
                      <Button variant="destructive" onClick={() => deleteConfig(savedConfig.id, savedConfig.name)} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
