# Agent Guide: React FLUX Architecture & Best Practices

## 1. FLUX Architecture Overview

FLUX is a pattern for managing unidirectional data flow in React applications. It consists of:
- **Actions**: Payloads of information that send data from the app to the dispatcher.
- **Dispatcher**: Central hub that manages all data flow.
- **Stores**: Containers for application state & logic (Zustand in this project).
- **Views (React Components)**: Render UI based on data from stores.

### FLUX Data Flow
1. User interacts with a View.
2. View issues an Action.
3. Dispatcher receives the Action and notifies relevant Stores.
4. Stores update state and emit change events.
5. Views listen to Store changes and re-render.

## 2. Recommended Folder Structure

```
my-app/
├── app/
│   ├── (dashboard)/           # Dashboard routes (protected)
│   │   ├── buffers/
│   │   ├── events/
│   │   ├── health-simulator/
│   │   ├── mttr-mtbf/
│   │   ├── oee/
│   │   ├── settings/
│   │   ├── stoppages/
│   │   ├── layout.tsx         # Dashboard layout with Sidebar
│   │   └── page.tsx           # Home/Dashboard
│   ├── api/
│   │   ├── auth/              # NextAuth.js routes
│   │   │   ├── [...nextauth]/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── debug/route.ts
│   │   └── health/route.ts
│   ├── auth/                  # Auth pages (public)
│   │   ├── signin/page.tsx
│   │   ├── register/page.tsx
│   │   └── error/page.tsx
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui primitives
│   │   │   ├── layout/        # Layout components (Sidebar, Header)
│   │   │   ├── charts/        # Recharts wrappers
│   │   │   ├── data-display/  # Tables, Cards, Badges
│   │   │   ├── domain/        # Domain-specific components
│   │   │   └── feedback/      # Loading, Empty states, Toasts
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities (cn, auth)
│   │   ├── providers/         # Context providers
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── globals.css            # Tailwind CSS + CSS Variables
│   ├── layout.tsx             # Root layout
│   └── middleware.ts          # Auth middleware
├── public/                    # Static assets
├── documentation/             # Project documentation
├── tailwind.config.ts         # Tailwind configuration
└── ...
```

## 3. SOLID Principles in React

- **S**ingle Responsibility: Each component does one thing.
- **O**pen/Closed: Components are extensible but closed for modification.
- **L**iskov Substitution: Child components can replace parent without breaking.
- **I**nterface Segregation: Prefer small, focused props interfaces.
- **D**ependency Inversion: Use context/hooks for dependencies, not direct imports.

## 4. Componentization Best Practices

- Use small, focused components.
- Prefer composition over inheritance.
- Use presentational (dumb) and container (smart) components.
- Reuse components via props and children.
- Isolate state as much as possible.

## 5. Golden Rules (Regras de Ouro)

### 8 Regras de Ouro do Design de Interface (Shneiderman)
1. **Consistencia**: Manter padroes visuais e funcionais em toda a interface.
2. **Atalhos para usuarios experientes**: Permitir aceleracao de tarefas para usuarios avancados.
3. **Feedback informativo**: O sistema deve fornecer feedback claro e imediato para cada acao do usuario.
4. **Fechar o dialogo**: Informar claramente o inicio, meio e fim de processos, com mensagens de conclusao.
5. **Prevencao de erros**: Projetar para evitar erros antes que ocorram.
6. **Desfazer/refazer**: Permitir desfazer e refazer acoes facilmente.
7. **Controle do usuario**: Usuarios devem sentir-se no controle, podendo cancelar ou sair de operacoes.
8. **Reducao da carga de memoria**: Minimizar a necessidade de lembrar informacoes entre etapas.

### Golden Rules (Regras de Ouro) para Desenvolvimento
1. **Single Source of Truth**: State lives in stores or context, not scattered.
2. **Unidirectional Data Flow**: Data flows down, actions flow up.
3. **Pure Components**: Use pure functions for rendering.
4. **Avoid Side Effects in Render**: Use effects/hooks for side effects.
5. **Prop Drilling Minimization**: Use context or state management.
6. **Consistent Naming**: Use clear, consistent naming conventions.
7. **Accessibility**: All components must be accessible (a11y).
8. **Testing**: All logic and UI must be tested.
9. **Performance**: Avoid unnecessary renders, use memoization.
10. **Documentation**: All components and logic must be documented.

## 6. React Component Lifecycle (Functional)

- **Mounting**: `useEffect(() => { ... }, [])`
- **Updating**: `useEffect(() => { ... }, [deps])`
- **Unmounting**: `useEffect(() => { return () => { ... } }, [])`

## 7. Performance Best Practices (Next.js/React)

- Use `React.memo` and `useMemo` to avoid unnecessary renders.
- Use `useCallback` for stable function references.
- Lazy load components/pages with dynamic imports.
- Use Next.js Image for optimized images.
- Minimize state in components; lift state up only when needed.
- Use SWR or React Query for data fetching and caching.
- Avoid large objects/arrays in state.
- Use server-side rendering (SSR) or static generation (SSG) for performance.
- Use code splitting and tree shaking.
- Minimize use of localStorage/sessionStorage; prefer context or stores.

## 8. Data Storage Best Practices

- Use stores/context for app state.
- Use localStorage/sessionStorage only for non-sensitive, persistent data.
- Use cookies for authentication tokens (httpOnly, secure).
- Never store sensitive data in the client.

## 9. Theme System (Dark Theme with Red Accent)

Este projeto utiliza um tema dark com vermelho como cor primaria, definido via CSS Variables no `globals.css`:

```css
@layer base {
  .dark {
    --background: 216 28% 7%;        /* #0d1117 - fundo escuro */
    --foreground: 210 40% 98%;       /* texto claro */
    --card: 215 28% 11%;             /* #151b23 - cards */
    --card-foreground: 210 40% 98%;
    --primary: 0 84% 60%;            /* VERMELHO - cor principal */
    --primary-foreground: 0 0% 100%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --success: 173 80% 40%;          /* Teal/Cyan - sucesso */
    --success-foreground: 0 0% 100%;
    --warning: 45 93% 47%;           /* Amarelo - aviso */
    --warning-foreground: 0 0% 0%;
    --info: 217 91% 60%;             /* Azul - informacao */
    --info-foreground: 0 0% 100%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 217 33% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 51%;        /* Vermelho escuro - erro */
    --destructive-foreground: 0 0% 100%;
    --border: 217 33% 20%;
    --ring: 0 84% 60%;               /* Vermelho */
    --radius: 0.75rem;
  }
}
```

### Semantic Color Usage
- **Primary (Red)**: Acoes principais, botoes primarios, links ativos
- **Success (Teal)**: Confirmacao, status OK, OEE alto
- **Warning (Yellow)**: Alertas, atencao necessaria
- **Info (Blue)**: Informacoes neutras, badges informativos
- **Destructive (Red)**: Erros, acoes destrutivas, paradas aleatorias

## 10. Visual Theory: Color Usage

- **Confirmation**: Use green/teal (`success`) for positive actions.
- **Negation/Error**: Use red (`destructive`) for destructive/negative actions.
- **Warning**: Use yellow (`warning`) for caution.
- **Information**: Use blue (`info`) for neutral/informational messages.
- **Accessibility**: Ensure color contrast meets WCAG AA/AAA.
- **Consistent UI**: Use the same color for the same meaning everywhere.

## 11. HTTP Requests (Padrao)

- Utilize **Axios** como biblioteca padrao para requisicoes HTTP no front-end.
- Padronize o uso atraves do helper `app/src/utils/http.ts` (instancia unica `http`).
- Configure o endpoint via `NEXT_PUBLIC_API_BASE_URL` quando aplicavel.

```typescript
import http from '@/src/utils/http';

// GET request
const response = await http.get('/endpoint');

// POST request
await http.post('/endpoint', { data });
```

## 12. UI Frameworks and Iconography (Padrao Atualizado)

### Stack Principal
- **shadcn/ui**: Componentes primitivos baseados em Radix UI
- **Radix UI**: Primitivos acessiveis e sem estilo
- **Tailwind CSS v4**: Utilidades de estilizacao com CSS-based configuration
- **Lucide React**: Icones consistentes e modernos
- **Recharts**: Graficos e visualizacoes de dados
- **Framer Motion**: Animacoes fluidas e transicoes

### Componentes shadcn/ui Disponiveis
```
app/src/components/ui/
├── accordion.tsx      # Acordeoes expansiveis
├── avatar.tsx         # Avatares de usuario
├── badge.tsx          # Badges/tags
├── button.tsx         # Botoes (variants: default, destructive, outline, ghost)
├── card.tsx           # Cards container
├── checkbox.tsx       # Checkboxes
├── dialog.tsx         # Modais/dialogs
├── dropdown-menu.tsx  # Menus dropdown
├── input.tsx          # Inputs de texto
├── label.tsx          # Labels para forms
├── popover.tsx        # Popovers
├── progress.tsx       # Barras de progresso
├── scroll-area.tsx    # Areas com scroll customizado
├── select.tsx         # Selects/dropdowns
├── separator.tsx      # Separadores visuais
├── sheet.tsx          # Side sheets/drawers
├── skeleton.tsx       # Loading skeletons
├── switch.tsx         # Toggle switches
├── table.tsx          # Tabelas
├── tabs.tsx           # Navegacao por tabs
├── textarea.tsx       # Textareas
└── tooltip.tsx        # Tooltips
```

### Exemplo de Uso
```tsx
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Factory } from 'lucide-react';

<Card className="p-4">
  <div className="flex items-center gap-2">
    <Factory className="h-5 w-5 text-primary" />
    <span className="font-semibold">Shop Name</span>
    <Badge variant="success">Online</Badge>
  </div>
  <Button variant="outline" className="mt-4">
    Ver Detalhes
  </Button>
</Card>
```

### Utility Function: cn()
Use a funcao `cn()` para combinar classes condicionalmente:

```typescript
import { cn } from '@/src/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'large' && 'text-lg'
)} />
```

## 13. Graficos com Recharts

### Wrappers Disponiveis
```
app/src/components/charts/
├── AreaChart.tsx      # Graficos de area
├── BarChart.tsx       # Graficos de barras
├── LineChart.tsx      # Graficos de linha
├── OEEChart.tsx       # Gauge circular para OEE
└── index.ts           # Exports
```

### Exemplo de Uso
```tsx
import { BarChart, OEEChart } from '@/src/components/charts';

// Bar Chart
<BarChart
  data={[{ name: 'Jan', value: 85 }, { name: 'Feb', value: 92 }]}
  dataKey="value"
  xAxisKey="name"
  height={200}
  colorByValue  // Verde > 80%, Amarelo > 60%, Vermelho < 60%
/>

// OEE Gauge
<OEEChart value={87.5} size="lg" />
```

## 14. Animacoes: Framer Motion

### Padrao de Animacao para Paginas
```tsx
import { motion } from 'framer-motion';

// Animacao de entrada padrao
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
  Conteudo animado
</motion.div>
```

### AnimatePresence para Elementos Condicionais
```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      Conteudo condicional
    </motion.div>
  )}
</AnimatePresence>
```

### Boas Praticas de Animacao
- Use animacoes para reforcar feedback, transicoes e hierarquia visual, nunca como distracao.
- Prefira animacoes suaves e rapidas (duracao entre 150ms e 400ms).
- Sempre respeite as preferencias de acessibilidade do usuario (`prefers-reduced-motion`).
- Evite animar propriedades que causam reflow/layout (prefira `opacity`, `transform`).
- Sincronize animacoes com mudancas de estado e navegacao.

### Padroes de Ouro para Animacoes
1. **Consistencia:** Use padroes de animacao iguais para interacoes semelhantes.
2. **Acessibilidade:** Sempre respeite `prefers-reduced-motion`.
3. **Performance:** Prefira `transform` e `opacity` para animacoes.
4. **Feedback Imediato:** Use animacoes para indicar carregamento, sucesso, erro.
5. **Simplicidade:** Animacoes devem ser discretas e funcionais.

## 15. Autenticacao: NextAuth.js v5

### Configuracao
O projeto utiliza NextAuth.js v5 (beta) com Cloudflare D1 como banco de dados.

```
Arquivos de Autenticacao:
├── app/api/auth/[...nextauth]/route.ts  # Handler NextAuth
├── app/api/auth/register/route.ts       # Registro de usuarios
├── app/src/lib/auth.ts                  # Funcoes de acesso ao D1
└── middleware.ts                         # Protecao de rotas
```

### Variaveis de Ambiente Necessarias
```env
# NextAuth
NEXTAUTH_SECRET=<secret-aleatorio>
NEXTAUTH_URL=http://localhost:3000

# Cloudflare D1
CLOUDFLARE_ACCOUNT_ID=<account-id>
CLOUDFLARE_D1_UUID=<database-uuid>
CLOUDFLARE_D1_TOKEN=<api-token>

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
```

### Providers Configurados
- **Credentials**: Email/senha com hash bcrypt
- **Google**: OAuth 2.0

### Tratamento de Erros de Autenticacao
O sistema detecta o provider do usuario e exibe mensagens apropriadas:

```typescript
// Mapeamento de providers para nomes amigaveis
const providerDisplayNames: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  credentials: 'email e senha',
};

// Verificacao de conta OAuth tentando login com senha
if (!user.password_hash) {
  const providerName = getProviderDisplayName(user.provider);
  throw new Error(`Esta conta usa ${providerName}. Faca login usando ${providerName}.`);
}
```

### Cloudflare D1 - Queries Tipadas
```typescript
// app/src/lib/auth.ts
interface D1Response<T> {
  success: boolean;
  result?: D1QueryResult<T>[];
  errors?: Array<{ code: number; message: string }>;
}

async function executeD1Query<T>(sql: string, params: unknown[]): Promise<T[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  const data: D1Response<T> = await response.json();
  return data.result?.[0]?.results || [];
}
```

### Uso no Cliente
```tsx
import { useSession, signIn, signOut } from 'next-auth/react';

function Component() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <Loading />;
  if (!session) return <button onClick={() => signIn()}>Login</button>;

  return (
    <div>
      <p>Ola, {session.user?.name}</p>
      <button onClick={() => signOut()}>Sair</button>
    </div>
  );
}
```

### Fluxo de Registro
```typescript
// POST /api/auth/register
const body = {
  email: 'user@example.com',
  password: 'senha123',
  name: 'Nome do Usuario',
};

// Resposta de sucesso
{ success: true, userId: 'uuid-gerado' }

// Resposta de erro
{ error: 'Email ja cadastrado' }
```

## 16. Responsividade com Tailwind CSS

### Breakpoints Padrao
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
```tsx
// Layout responsivo
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>

// Espacamento responsivo
<div className="p-4 sm:p-6 md:p-8">
  {/* Conteudo */}
</div>

// Visibilidade condicional
<nav className="hidden md:flex gap-4">
  {/* Links de navegacao */}
</nav>
<button className="md:hidden">
  <Menu className="h-6 w-6" />
</button>
```

### Componentes Responsivos
- **Sidebar**: Collapsa em telas menores
- **DataTable**: Scroll horizontal em mobile
- **Cards**: Stack vertical em mobile, grid em desktop
- **Forms**: Full width em mobile, colunas em desktop

## 17. Componentes de Feedback

### Loading States
```tsx
import { Skeleton } from '@/src/components/ui/skeleton';
import { LoadingModal } from '@/src/components/feedback';

// Skeleton para loading inicial
<Skeleton className="h-[200px] rounded-xl" />

// Loading modal para operacoes pesadas
<LoadingModal isLoading={isLoading} />
```

### Empty States
```tsx
import { EmptyState } from '@/src/components/feedback';

<EmptyState
  type="search"  // 'search' | 'no-data' | 'error'
  title="Nenhum resultado"
  description="Nenhum item corresponde aos filtros."
  action={{ label: 'Limpar Filtros', onClick: clearFilters }}
/>
```

### Toast Notifications
```tsx
// Implementacao inline com estado
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 4000);
};

// Render
<AnimatePresence>
  {toast && (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={cn(
        'fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg',
        toast.type === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
      )}
    >
      {toast.message}
    </motion.div>
  )}
</AnimatePresence>
```

## 18. Radix UI Select - Importante

O componente Select do Radix UI **nao permite valores vazios** (`value=""`). Use um valor placeholder como `"__all__"`:

```tsx
// ERRADO - causara erro
<SelectItem value="">Todos</SelectItem>

// CORRETO
<Select
  value={filter || "__all__"}
  onValueChange={(v) => setFilter(v === "__all__" ? "" : v)}
>
  <SelectContent>
    <SelectItem value="__all__">Todos</SelectItem>
    {options.map((opt) => (
      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

## 19. State Management: Zustand

### Store Principal
```typescript
// app/src/stores/simulatorStore.ts
import { create } from 'zustand';

interface SimulatorState {
  plantState: PlantState | null;
  oeeState: OEEData[];
  health: HealthData | null;
  // ... actions
}

export const useSimulatorStore = create<SimulatorState>((set) => ({
  plantState: null,
  oeeState: [],
  health: null,
  setPlantState: (data) => set({ plantState: data }),
  // ...
}));
```

### Hook Selector
```typescript
// app/src/hooks/useSimulatorStore.ts
import { useSimulatorStore } from '../stores/simulatorStore';

export const useSimulatorSelector = <T>(selector: (state: SimulatorState) => T) => {
  return useSimulatorStore(selector);
};

// Uso
const plantState = useSimulatorSelector((s) => s.plantState?.data);
```

## 20. WebSocket Integration

### Socket.IO Client
```typescript
// app/src/utils/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
  }
  return socket;
}

export function subscribeTo(event: string) {
  const socket = getSocket();
  socket.emit('subscribe', event);
}
```

### Uso em Componentes
```tsx
useEffect(() => {
  const socket = getSocket();
  subscribeTo('plant');
  subscribeTo('oee');

  socket.on('plant', handlePlantUpdate);
  socket.on('oee', handleOeeUpdate);

  return () => {
    socket.off('plant', handlePlantUpdate);
    socket.off('oee', handleOeeUpdate);
  };
}, []);
```

## 21. Componentes de Dominio

### StationCard
Componente para exibir estacoes de producao com status, carros e indicadores.

```tsx
import { StationCard } from '@/src/components/domain';

<StationCard
  station={normalizedStation}
  shopName="BodyShop"
  lineName="BodyMain"
  nowSimMs={simulatorTime}
  onStationClick={(station) => openDetails(station)}
  onCarClick={(car, carId) => openCarDetails(car)}
/>
```

**Status Visual:**
- **Livre (success)**: Estacao vazia, pronta para receber carro
- **Operando (warning)**: Estacao processando um carro
- **Parado (destructive)**: Estacao em parada (planejada ou aleatoria)

**Padroes de Interacao:**
```tsx
// Animacao hover/tap
<motion.div
  whileHover={{ y: -3, scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
  <Card>...</Card>
</motion.div>
```

### BufferCard
Exibe buffers com capacidade, ocupacao e carros.

### ShopLineSelector
Seletor duplo para Shop e Linha com tratamento de estados vazios:

```tsx
<ShopLineSelector
  shops={shops}
  lines={lines}
  shopIndex={selectedShop}
  lineIndex={selectedLine}
  onShopChange={setSelectedShop}
  onLineChange={setSelectedLine}
/>
```

**Tratamento de Listas Vazias:**
```tsx
<SelectContent>
  {items.length === 0 ? (
    <div className="py-2 px-2 text-sm text-muted-foreground">
      Sem itens disponiveis
    </div>
  ) : (
    items.map((item, idx) => (
      <SelectItem key={item.id} value={String(idx)}>
        {item.name}
      </SelectItem>
    ))
  )}
</SelectContent>
```

### DetailsDrawer
Drawer lateral para exibir detalhes de objetos:

```tsx
<DetailsDrawer
  open={Boolean(selection)}
  title={`Estacao ${selection?.name}`}
  sections={[{ title: 'Detalhes', value: selection }]}
  onClose={() => setSelection(null)}
/>
```

## 22. Configuracao da Planta (FlowPlant)

### Estrutura do JSON de Configuracao
```typescript
interface FlowPlantConfig {
  // Mix & Product Config
  MIX_ITEMS_PER_LINE: number;      // Itens por linha (MIX de carros)
  colors: string[];                 // Cores disponiveis
  models: string[];                 // Modelos (P19, P20, P35)

  // Emit Intervals (ms)
  BUFFER_EMIT_INTERVAL: number;     // 5000 (5s)
  BUFFER_PERSIST_INTERVAL: number;  // 3600000 (1h)
  PLANT_EMIT_INTERVAL: number;      // 10000 (10s)
  STOPS_EMIT_INTERVAL: number;      // 10000 (10s)
  OEE_EMIT_INTERVAL: number;        // 10000 (10s)
  CARS_EMIT_INTERVAL: number;       // 10000 (10s)

  // Simulation Parameters
  typeSpeedFactor: number;          // 1 = tempo real
  stationTaktMinFraction: number;   // 0.7
  stationTaktMaxFraction: number;   // 0.999
  DPHU: number;                     // Defeitos por 100 unidades
  Rework_Time: number;              // Tempo de retrabalho (min)
  targetJPH: number;                // Jobs por hora alvo

  // Production Config
  stationstartProduction: StartStation[];
  shifts: ShiftConfig[];
  plannedStops: PlannedStopConfig[];
  oeeTargets: Record<string, number>;
  shops: Record<string, ShopConfig>;
}
```

### Tipos de Linhas
1. **CAR LINES (Linhas Normais)**
   - Produzem ou processam CARROS
   - TEM routes e buffers
   - Exemplo: BodyMain, MetalLine, Paint_In

2. **PART LINES (Linhas de Pecas)**
   - Produzem PECAS consumidas por outras linhas
   - TEM partType definido
   - NAO TEM routes (pecas vao para Part Buffer)
   - Exemplo: CoverHemming, DoorLine, CylinderHead

### Padrao Tag-Style para Arrays (Colors/Models)
Use este padrao para editar arrays de strings de forma visual:

```tsx
const [items, setItems] = useState<string[]>(['Item1', 'Item2']);
const [newItem, setNewItem] = useState('');

const addItem = () => {
  if (!newItem.trim()) return;
  if (items.includes(newItem.trim())) {
    showToast('Item ja existe', 'error');
    return;
  }
  setItems([...items, newItem.trim()]);
  setNewItem('');
};

const removeItem = (index: number) => {
  setItems(items.filter((_, i) => i !== index));
};

// Render
<div className="space-y-3">
  <div className="flex flex-wrap gap-2">
    {items.map((item, i) => (
      <Badge key={i} variant="outline" className="flex items-center gap-1 px-3 py-1.5">
        {item}
        <button onClick={() => removeItem(i)} className="ml-1 hover:text-destructive">
          <X className="h-3 w-3" />
        </button>
      </Badge>
    ))}
  </div>
  <div className="flex gap-2">
    <Input
      value={newItem}
      onChange={(e) => setNewItem(e.target.value)}
      placeholder="Novo item..."
      onKeyDown={(e) => e.key === 'Enter' && addItem()}
    />
    <Button variant="outline" onClick={addItem}>
      <Plus className="h-4 w-4 mr-1" />
      Adicionar
    </Button>
  </div>
</div>
```

### Exibicao de Intervalos com Conversao
Mostre o valor em ms e a conversao para segundos/minutos:

```tsx
<div className="space-y-2">
  <Label>Buffer Emit Interval</Label>
  <Input
    type="number"
    value={intervalMs}
    onChange={(e) => setIntervalMs(Number(e.target.value))}
  />
  <p className="text-xs text-muted-foreground">
    {intervalMs >= 60000
      ? `${(intervalMs / 60000).toFixed(0)}min`
      : `${(intervalMs / 1000).toFixed(1)}s`
    }
  </p>
</div>
```

## 23. Padroes de Paginas de Dados (Stoppages, Events, OEE)

### Estrutura Padrao
Todas as paginas de dados seguem esta estrutura:

```tsx
export default function DataPage() {
  // 1. Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DataType[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selection, setSelection] = useState<DataType | null>(null);

  // 2. Fetch com useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await http.get('/endpoint');
      setData(asArrayFromPayload<DataType>(res.data));
    } catch {
      setError('Falha ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. useEffect para fetch inicial
  useEffect(() => { fetchData(); }, [fetchData]);

  // 4. Memos para opcoes de filtro e dados filtrados
  const options = useMemo(() => ({
    field1: uniq(data.map(d => d.field1)),
    field2: uniq(data.map(d => d.field2)),
  }), [data]);

  const filtered = useMemo(() => {
    return data.filter(matches).sort(byDate);
  }, [data, filters]);

  // 5. Stats calculadas
  const stats = useMemo(() => ({
    total: filtered.length,
    // ...
  }), [filtered]);

  return (
    <div className="space-y-6">
      {/* Header com titulo e botao refresh */}
      {/* Stats Cards */}
      {/* Filtros Card */}
      {/* DataTable Card */}
      {/* DetailsDrawer */}
    </div>
  );
}
```

### Filtros com Datas
```tsx
// Inputs datetime-local
<Input
  type="datetime-local"
  value={filters.startFrom}
  onChange={(e) => setFilters(p => ({ ...p, startFrom: e.target.value }))}
/>

// Parsing com helper
import { parseDateTimeLocal } from '@/src/utils/date';

const startFrom = parseDateTimeLocal(filters.startFrom); // number | null
if (startFrom !== null && timestamp < startFrom) return false;
```

### DataTable com Row Click
```tsx
<DataTable
  data={filtered}
  columns={columns}
  pageSize={20}
  onRowClick={(row) => setSelection(row as DataType)}
  emptyMessage="Nenhum item encontrado"
/>
```

### Componentes data-display

#### StatsCard
Card para exibir metricas com icone e subtitulo:

```tsx
import { StatsCard } from '@/src/components/data-display';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';

<StatsCard
  title="Total de Paradas"
  value={stats.total}
  subtitle="paradas filtradas"
  icon={AlertTriangle}
  iconColor="var(--color-warning)"
/>

<StatsCard
  title="Duracao Total"
  value={`${totalMinutes} min`}
  subtitle="tempo parado"
  icon={Clock}
  iconColor="var(--color-info)"
/>
```

#### StatusBadge
Badge semantico para status:

```tsx
import { StatusBadge, EventTypeBadge } from '@/src/components/data-display';

// Para status gerais
<StatusBadge
  status="success"  // 'success' | 'warning' | 'error' | 'info' | 'pending'
  label="Online"
/>

// Para tipos de evento
<EventTypeBadge type="CAR_ENTERED" />
```

#### DataTable
Tabela com sort, paginacao e row click:

```tsx
import { DataTable, PaginationInfo } from '@/src/components/data-display';

const columns = [
  { key: 'name', header: 'Nome', sortable: true },
  { key: 'status', header: 'Status', sortable: true,
    render: (value) => <StatusBadge status={value} label={value} />
  },
  { key: 'date', header: 'Data', sortable: true,
    render: (value) => formatEpochMs(value)
  },
];

// Client-side pagination (paginacao local)
<DataTable
  data={filteredData}
  columns={columns}
  pageSize={20}
  onRowClick={(row) => setSelection(row)}
  emptyMessage="Nenhum item encontrado"
/>

// Server-side pagination (paginacao no servidor)
<DataTable
  data={pageData}  // Dados da pagina atual apenas
  columns={columns}
  pageSize={20}
  serverPagination={pagination}  // PaginationInfo do servidor
  onPageChange={setPage}
  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
  onRowClick={(row) => setSelection(row)}
/>
```

#### PaginationInfo Interface
Interface retornada pelo servidor para paginacao:

```typescript
export interface PaginationInfo {
  page: number;        // Pagina atual (1-based)
  limit: number;       // Itens por pagina
  total: number;       // Total de registros
  totalPages: number;  // Total de paginas
  hasNext: boolean;    // Tem proxima pagina
  hasPrevious: boolean; // Tem pagina anterior
}
```

## 24. Testes e Validacao

### Manual
- Use DevTools (device toolbar) para testar responsividade
- Lighthouse para performance e acessibilidade

### Automatizado
- Jest + React Testing Library para unit/integration tests
- Storybook para desenvolvimento isolado de componentes
- Testes de regressao visual (Percy, Chromatic)

## 25. Utilitarios e Helpers

### Safe Array Handling
```typescript
import { asArrayFromPayload, uniqStrings } from '@/src/utils/safe';

// Garante que o resultado seja um array (mesmo se API retornar objeto)
const data = asArrayFromPayload<T>(response.data);

// Remove duplicatas e valores nulos/undefined de arrays de strings
const uniqueValues = uniqStrings(data.map(d => d.field));
```

### Time Formatting
```typescript
import { formatEpochMs } from '@/src/utils/timeFormat';

// Formata timestamp em epoch ms para string legivel
const formatted = formatEpochMs(1704067200000); // "01/01/2024 00:00"
```

### Date Parsing
```typescript
import { parseDateTimeLocal } from '@/src/utils/date';

// Converte string datetime-local para timestamp ms ou null
const timestamp = parseDateTimeLocal('2024-01-15T14:30'); // number | null
```

## 26. Boas Praticas Adicionais

### Codigo
- Use TypeScript para type safety.
- Use ESLint e Prettier para code quality e formatting.
- Documente todos os componentes e APIs.
- Use environment variables para configuracao.
- Secure todos os endpoints e sanitize user input.
- Regularmente atualize dependencias.

### UX/UI
- Sempre fornecer feedback visual para acoes do usuario
- Usar Skeleton durante loading inicial, Spinner para atualizacoes
- Exibir mensagens de erro claras com acao de retry
- Manter consistencia visual entre paginas
- Usar cores semanticas (success, warning, error, info)
- Animacoes devem ser suaves e nao distrair

### Performance
- Usar `React.memo` para componentes puros frequentemente re-renderizados
- Usar `useMemo` para calculos pesados
- Usar `useCallback` para funcoes passadas como props
- Lazy load paginas e componentes grandes
- Evitar re-renders desnecessarios

## 27. Performance Avançada - Regras Obrigatórias

Esta seção define os padrões de performance que DEVEM ser seguidos em toda a aplicação.

### 27.1 React Query - Data Fetching Padrão

**REGRA:** Todas as requisições REST devem usar React Query, NUNCA fetch/axios direto em useEffect.

#### Configuração Global
```typescript
// app/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30s - dados considerados frescos
      gcTime: 5 * 60 * 1000,       // 5min - garbage collection
      retry: 3,                     // 3 tentativas em falha
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: false,  // Evita refetch ao focar janela
    },
  },
});
```

#### Hooks de Dados Padrão
```typescript
// app/src/hooks/useStopsQuery.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import http from '@/src/utils/http';

// Query simples
export function useStops(filters: StopFilters) {
  return useQuery({
    queryKey: ['stops', filters],
    queryFn: async () => {
      const res = await http.get('/stops', { params: filters });
      return asArrayFromPayload<Stop>(res.data);
    },
    staleTime: 60 * 1000, // Sobrescreve staleTime se necessário
  });
}

// Query infinita para paginação
export function useInfiniteStops(filters: StopFilters) {
  return useInfiniteQuery({
    queryKey: ['stops', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await http.get('/stops', {
        params: { ...filters, page: pageParam, limit: 50 }
      });
      return res.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}
```

#### Hooks para Server-Side Pagination
```typescript
// app/src/hooks/useStopsQuery.ts
export interface PaginatedStopsResult {
  data: StopRecord[];
  pagination: PaginationInfo;
}

export function usePaginatedStops(
  filters: StopFilters = {},
  page: number = 1,
  limit: number = 20,
  options?: Omit<UseQueryOptions<PaginatedStopsResult, Error>, 'queryKey' | 'queryFn'>
);

export function usePaginatedStopsByDate(
  date: string | null,
  page: number = 1,
  limit: number = 20,
  additionalFilters: Omit<StopFilters, 'start_time' | 'end_time'> = {},
  options?: Omit<UseQueryOptions<PaginatedStopsResult, Error>, 'queryKey' | 'queryFn'>
);

// app/src/hooks/useEventsQuery.ts
export interface PaginatedEventsResult {
  data: EventRecord[];
  pagination: PaginationInfo;
}

export function usePaginatedEvents(
  filters: EventFilters = {},
  page: number = 1,
  limit: number = 20,
  options?: Omit<UseQueryOptions<PaginatedEventsResult, Error>, 'queryKey' | 'queryFn'>
);
```

#### Uso em Páginas
```tsx
// ERRADO - Nunca fazer isso
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  http.get('/stops').then(res => setData(res.data));
}, []);

// CORRETO - Sempre usar React Query
const { data = [], isLoading, isError, error, refetch, isFetching } = useStops(filters);
```

#### Uso com Server-Side Pagination
```tsx
// Estado de paginacao local
const [page, setPage] = React.useState(1);
const [pageSize, setPageSize] = React.useState(20);

// Filtros convertidos para formato da API
const apiFilters: StopFilters = React.useMemo(() => {
  const f: StopFilters = {};
  if (filters.shop) f.shop = filters.shop;
  if (filters.line) f.line = filters.line;
  // ... outros filtros
  return f;
}, [filters]);

// Query com paginacao server-side
const {
  data: paginatedResult,
  isLoading,
  isError,
  error,
  refetch,
  isFetching,
} = usePaginatedStops(apiFilters, page, pageSize);

// Extrair dados e paginacao
const stops = paginatedResult?.data ?? [];
const pagination = paginatedResult?.pagination;

// Reset page quando filtros mudam
React.useEffect(() => {
  setPage(1);
}, [apiFilters]);

// Render com DataTable
<DataTable
  data={stops}
  columns={columns}
  pageSize={pageSize}
  serverPagination={pagination}
  onPageChange={setPage}
  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
/>
```

### 27.2 Socket/WebSocket - Throttling Universal

**REGRA:** Todos os canais WebSocket DEVEM ter throttling configurado para evitar re-renders excessivos.

#### Configuração de Throttling
```typescript
// app/src/utils/socket.ts
import { throttle } from 'lodash-es';

// Configuração de throttling por canal (ms)
const THROTTLE_CONFIG: Record<string, number> = {
  plantstate: 100,   // Alta frequência - precisa ser rápido
  stops: 500,        // Média frequência
  buffers: 500,      // Média frequência
  health: 3000,      // Baixa frequência - dados de health
  cars: 1000,        // Média-baixa frequência
  oee: 2000,         // Baixa frequência - métricas consolidadas
  mttr_mtbf: 5000,   // Muito baixa - calculado por turno
};

// Criar handlers throttled
function createThrottledHandler(channel: string, setter: (data: unknown) => void) {
  const delay = THROTTLE_CONFIG[channel] ?? 500;
  return throttle((payload: unknown) => {
    setter(payload);
  }, delay, { leading: true, trailing: true });
}
```

#### Uso de Canais
```typescript
// Sempre usar throttled handlers
socket.on('stops', throttledHandlers.stops);
socket.on('oee', throttledHandlers.oee);

// NUNCA fazer atualizações diretas sem throttle
socket.on('data', (payload) => store.setData(payload)); // ERRADO
```

### 27.3 HTTP Client - Interceptors e Retry

**REGRA:** O cliente HTTP deve ter interceptors para deduplicação de requests e retry automático.

```typescript
// app/src/utils/http.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const pendingRequests = new Map<string, Promise<unknown>>();

function getRequestKey(config: InternalAxiosRequestConfig): string {
  return `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
}

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

// Request interceptor - deduplicação
http.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const key = getRequestKey(config);
    const pending = pendingRequests.get(key);
    if (pending) {
      // Retorna promise em cache para evitar request duplicado
      config.adapter = () => pending as Promise<never>;
    }
  }
  return config;
});

// Response interceptor - retry com exponential backoff
http.interceptors.response.use(
  (response) => {
    const key = getRequestKey(response.config);
    pendingRequests.delete(key);
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config;
    if (!config) throw error;

    const key = getRequestKey(config);
    pendingRequests.delete(key);

    // Retry para erros de rede ou 5xx
    const retryCount = (config as any).__retryCount || 0;
    if (retryCount < 3 && (!error.response || error.response.status >= 500)) {
      (config as any).__retryCount = retryCount + 1;
      const delay = Math.min(1000 * 2 ** retryCount, 10000);
      await new Promise(r => setTimeout(r, delay));
      return http.request(config);
    }

    throw error;
  }
);
```

### 27.4 Listas Virtualizadas

**REGRA:** Listas com mais de 50 itens DEVEM usar virtualização com react-window.

```typescript
// app/src/components/data-display/VirtualizedDataTable.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedDataTableProps<T> {
  data: T[];
  columns: Column[];
  rowHeight?: number;
  height?: number;
}

export function VirtualizedDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 48,
  height = 400,
}: VirtualizedDataTableProps<T>) {
  return (
    <List
      height={height}
      itemCount={data.length}
      itemSize={rowHeight}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style} className="flex items-center border-b">
          {columns.map((col) => (
            <div key={col.key} className="px-3">
              {col.render ? col.render(data[index][col.key], data[index]) : String(data[index][col.key])}
            </div>
          ))}
        </div>
      )}
    </List>
  );
}
```

#### Quando Usar
- DataTable com > 50 linhas
- Listas de cards (StationCards, BufferCards)
- Qualquer renderização de array grande

### 27.5 useMemo em Camadas

**REGRA:** Evitar múltiplos useMemo com as mesmas dependências. Usar padrão de camadas.

```typescript
// ERRADO - 4 useMemo com mesmas 7 dependências
const currentOee = useMemo(() => {...}, [isToday, hasWebSocket, oeeState, oeeApi, filterShop, filterLine, fallback]);
const jphReal = useMemo(() => {...}, [isToday, hasWebSocket, oeeState, oeeApi, filterShop, filterLine, fallback]);
const carsProduced = useMemo(() => {...}, [isToday, hasWebSocket, oeeState, oeeApi, filterShop, filterLine, fallback]);
const difftime = useMemo(() => {...}, [isToday, hasWebSocket, oeeState, oeeApi, filterShop, filterLine, fallback]);

// CORRETO - Padrão em camadas
// Camada 1: Seleção da fonte de dados
const oeeSource = useMemo(() => {
  if (isToday && hasWebSocket) return oeeState;
  return oeeApi ?? fallback;
}, [isToday, hasWebSocket, oeeState, oeeApi, fallback]);

// Camada 2: Filtragem
const filteredOee = useMemo(() => {
  return oeeSource.filter((r) => {
    if (filterShop && r.shop !== filterShop) return false;
    if (filterLine && r.line !== filterLine) return false;
    return true;
  });
}, [oeeSource, filterShop, filterLine]);

// Camada 3: Cálculos derivados (único memo para múltiplos valores)
const { currentOee, jphReal, carsProduced, difftime } = useMemo(() => {
  if (filteredOee.length === 0) {
    return { currentOee: 0, jphReal: 0, carsProduced: 0, difftime: 0 };
  }
  // Cálculos...
  return { currentOee, jphReal, carsProduced, difftime };
}, [filteredOee]);
```

### 27.6 useReducer para Estado Complexo

**REGRA:** Páginas com 5+ useState relacionados DEVEM usar useReducer.

```typescript
// app/(dashboard)/settings/useSettingsReducer.ts
import * as React from 'react';

// Estado tipado
interface SettingsState {
  global: {
    MIX_ITEMS_PER_LINE: number;
    targetJPH: number;
    // ...
  };
  ui: {
    activeTab: string;
    expandedSections: Set<string>;
  };
  inputs: {
    newColor: string;
    newModel: string;
  };
}

// Actions tipadas
type SettingsAction =
  | { type: 'UPDATE_GLOBAL'; key: string; value: unknown }
  | { type: 'SET_ACTIVE_TAB'; tab: string }
  | { type: 'ADD_COLOR'; color: string }
  | { type: 'REMOVE_COLOR'; index: number }
  | { type: 'RESET' };

// Reducer
function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'UPDATE_GLOBAL':
      return { ...state, global: { ...state.global, [action.key]: action.value } };
    case 'SET_ACTIVE_TAB':
      return { ...state, ui: { ...state.ui, activeTab: action.tab } };
    // ...
    default:
      return state;
  }
}

// Hook exportado
export function useSettingsReducer() {
  const [state, dispatch] = React.useReducer(settingsReducer, initialState);

  // Action creators memoizados para referências estáveis
  const actions = React.useMemo(() => ({
    updateGlobal: (key: string, value: unknown) =>
      dispatch({ type: 'UPDATE_GLOBAL', key, value }),
    setActiveTab: (tab: string) =>
      dispatch({ type: 'SET_ACTIVE_TAB', tab }),
    addColor: (color: string) =>
      dispatch({ type: 'ADD_COLOR', color }),
    // ...
  }), []);

  return { state, dispatch, actions };
}
```

### 27.7 Animações Performáticas

**REGRA:** Animações devem usar apenas transform e opacity. NUNCA animar height, width, top, left.

#### Keys Estáveis
```tsx
// ERRADO - index como key causa re-animações
{items.map((item, index) => (
  <motion.div key={index} transition={{ delay: index * 0.05 }}>

// CORRETO - ID estável como key
<AnimatePresence mode="popLayout">
  {items.map((item) => (
    <motion.div
      key={item.id}  // ID único e estável
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
```

#### Transform-only
```tsx
// ERRADO - causa layout thrashing
animate={{ height: isExpanded ? 'auto' : 100 }}

// CORRETO - usa transform
animate={{
  scaleY: isExpanded ? 1 : 0,
  opacity: isExpanded ? 1 : 0
}}
style={{ transformOrigin: 'top' }}

// OU usar CSS max-height com overflow: hidden
```

#### will-change Hint
```tsx
<motion.div
  style={{ willChange: 'transform, opacity' }}
  whileHover={{ y: -3, scale: 1.02 }}
>
```

#### Reduced Motion
```tsx
import { useReducedMotion } from 'framer-motion';

const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
>
```

### 27.8 Evitar Chamadas Impuras no Render

**REGRA:** Nunca chamar Date.now(), Math.random(), ou outras funções impuras diretamente no render.

```tsx
// ERRADO - Date.now() é impuro
const simNowMs = mounted ? (healthSimMs ?? Date.now()) : null;

// CORRETO - Capturar valor uma vez
const initialNowRef = React.useRef<number | null>(null);

if (mounted && initialNowRef.current === null) {
  initialNowRef.current = Date.now();
}

const simNowMs = mounted ? (healthSimMs ?? initialNowRef.current) : null;
```

### 27.9 Callbacks Estáveis

**REGRA:** Callbacks passados para componentes filhos devem ser estáveis (useCallback).

```tsx
// ERRADO - Nova função a cada render
onValueChange={(v) => setFilters((prev) => ({ ...prev, [field.key]: v }))}

// CORRETO - Callback estável
const updateFilter = React.useCallback((key: string, value: string) => {
  setFilters((prev) => ({ ...prev, [key]: value }));
}, []);

// No JSX:
onValueChange={(v) => updateFilter(field.key, v)}
```

### 27.10 Estrutura de Hooks por Domínio

```
app/src/hooks/
├── useEventsQuery.ts      # React Query hooks para eventos
│   ├── useEvents()              - Query simples com paginacao client-side
│   ├── useAllEvents()           - Fetch todos os eventos (legacy)
│   ├── useInfiniteEvents()      - Scroll infinito
│   └── usePaginatedEvents()     - Server-side pagination
├── useStopsQuery.ts       # React Query hooks para paradas
│   ├── useStops()               - Query simples
│   ├── useStopsByDate()         - Stops por data (para OEE/MTTR)
│   ├── useActiveStops()         - Stops em andamento
│   ├── usePaginatedStops()      - Server-side pagination
│   └── usePaginatedStopsByDate() - Server-side pagination por data
├── useOEEQuery.ts         # React Query hooks para OEE
├── useMTTRMTBFQuery.ts    # React Query hooks para MTTR/MTBF
├── useHealthQuery.ts      # React Query hooks para health
├── useSimulatorStore.ts   # Selector do Zustand (realtime)
└── useSocketChannel.ts    # Subscription dinâmica de socket
```

**Nota sobre Server-Side Pagination:**
- Páginas de listagem (Stoppages, Events) usam `usePaginated*` hooks
- Páginas de cálculo (OEE, MTTR-MTBF) usam hooks não-paginados pois precisam de todos os dados para calculos

### 27.11 Checklist de Performance por Página

Antes de cada página ser considerada completa:

- [ ] **Data Fetching**: Usa React Query (não fetch/axios em useEffect)
- [ ] **Socket**: Canais com throttling configurado
- [ ] **Listas**: Virtualização para > 50 itens
- [ ] **useMemo**: Padrão em camadas (não deps duplicadas)
- [ ] **useState**: < 5 estados ou useReducer
- [ ] **Animações**: Apenas transform/opacity
- [ ] **Keys**: IDs estáveis (não index)
- [ ] **Callbacks**: Estáveis com useCallback
- [ ] **Render puro**: Sem Date.now(), Math.random() direto

### 27.12 Core Web Vitals - LCP e INP

Esta seção documenta padrões obrigatórios para manter boas métricas de Core Web Vitals.

#### Métricas Alvo
| Métrica | Bom | Precisa Melhorar | Ruim |
|---------|-----|------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5s - 4s | > 4s |
| **INP** (Interaction to Next Paint) | < 200ms | 200ms - 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |

#### 27.12.1 Otimização de LCP

**REGRA:** O elemento LCP (geralmente H1 ou imagem principal) NUNCA deve ter animação.

```tsx
// ERRADO - Animação no H1 bloqueia LCP
<motion.h1
  key={pathname}
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  className="text-xl font-semibold"
>
  {pageTitle}
</motion.h1>

// CORRETO - H1 estático, renderiza imediatamente
<h1 className="text-xl font-semibold">{pageTitle}</h1>
```

**REGRA:** PageTransition NUNCA deve usar `mode="wait"` - isso bloqueia a renderização.

```tsx
// ERRADO - mode="wait" bloqueia até animação anterior terminar
<AnimatePresence mode="wait" initial={false}>
  <motion.div key={pathname} transition={{ duration: 0.3 }}>
    {children}
  </motion.div>
</AnimatePresence>

// CORRETO - Sem mode="wait", duração reduzida, GPU acceleration
<AnimatePresence initial={false}>
  <motion.div
    key={pathname}
    variants={{ initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } }}
    transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
    style={{ willChange: 'opacity' }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

#### 27.12.2 Otimização de INP

**REGRA:** Selectors de store DEVEM ser estáveis para evitar re-subscriptions.

```tsx
// ERRADO - selector como dependência causa re-subscription a cada render
const getSnapshot = React.useCallback(() => {
  return selector(store.getSnapshot());
}, [selector]); // selector muda a cada render se for inline

// CORRETO - Usar ref para estabilizar o selector
export function useSimulatorSelector<T>(selector: (state: SimulatorState) => T): T {
  const selectorRef = React.useRef(selector);
  selectorRef.current = selector; // Atualiza ref sem causar re-subscription

  const getSnapshot = React.useCallback(() => {
    const currentState = simulatorStore.getSnapshot();
    return selectorRef.current(currentState);
  }, []); // Sem dependências

  return React.useSyncExternalStore(
    simulatorStore.subscribe,
    getSnapshot,
    getSnapshot
  );
}
```

**REGRA:** Callbacks com dados de store como dependência devem ler do store diretamente.

```tsx
// ERRADO - stopsState como dependência recria callback frequentemente
const handleStationClick = React.useCallback(
  (station: NormalizedStation) => {
    const matchedStop = stopForStationByStartTime(stopsState, stationKey);
    // ...
  },
  [currentShopName, currentLine?.name, stopsState] // stopsState muda frequentemente
);

// CORRETO - Ler do store dentro do callback
const handleStationClick = React.useCallback(
  (station: NormalizedStation) => {
    const currentStops = simulatorStore.getSnapshot().stopsState; // Leitura direta
    const matchedStop = stopForStationByStartTime(currentStops, stationKey);
    // ...
  },
  [currentShopName, currentLine?.name] // Dependências estáveis
);
```

**REGRA:** Animações infinitas (animate-pulse, animate-spin) NUNCA devem ser usadas em listas.

```tsx
// ERRADO - animate-pulse em cada item de lista (100+ elementos)
{stations.map((station) => (
  <StationCard key={station.id}>
    {isOccupied && <Wrench className="h-4 w-4 animate-pulse" />}
  </StationCard>
))}

// CORRETO - Indicador estático ou condicional sem animação infinita
{stations.map((station) => (
  <StationCard key={station.id}>
    {isOccupied && <Wrench className="h-4 w-4 text-warning" />}
  </StationCard>
))}
```

**REGRA:** layoutId do Framer Motion causa layout thrashing - evitar em loops.

```tsx
// ERRADO - layoutId recalcula layout a cada mudança
{navItems.map((item) => (
  <Link key={item.href}>
    {isActive && (
      <motion.div layoutId="activeIndicator" className="..." />
    )}
  </Link>
))}

// CORRETO - Indicador estático com CSS
{navItems.map((item) => (
  <Link key={item.href}>
    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
  </Link>
))}
```

#### 27.12.3 Memoização de Constantes

**REGRA:** Arrays e objetos constantes usados em JSX devem ser definidos FORA do componente.

```tsx
// ERRADO - filterFields recriado a cada render
export default function StoppagesPage() {
  const filterFields = [
    { key: 'shop', label: 'Shop', icon: Factory },
    { key: 'line', label: 'Linha', icon: GitBranch },
  ];

  return filterFields.map(field => ...);
}

// CORRETO - Definido fora do componente
const filterFields = [
  { key: 'shop', label: 'Shop', icon: Factory },
  { key: 'line', label: 'Linha', icon: GitBranch },
] as const;

export default function StoppagesPage() {
  return filterFields.map(field => ...);
}
```

**REGRA:** Columns de tabela com render functions devem usar useMemo.

```tsx
// ERRADO - columns recriado a cada render
const columns = [
  { key: 'status', render: (v) => <StatusBadge status={v} /> },
];

// CORRETO - Memoizado
const columns = React.useMemo(() => [
  { key: 'status', render: (v: unknown) => <StatusBadge status={String(v)} /> },
], []);
```

#### 27.12.4 Diagnóstico de Performance

Use Chrome DevTools para medir Core Web Vitals:

1. **Lighthouse** (DevTools > Lighthouse > Performance)
   - Mede LCP, CLS, e sugere melhorias
   - Execute em modo Incognito para resultados limpos

2. **Performance Tab** (DevTools > Performance)
   - Grave interações para medir INP
   - Identifique Long Tasks (> 50ms)

3. **React DevTools Profiler**
   - Ative "Highlight updates when components render"
   - Identifique re-renders desnecessários

4. **Web Vitals Extension**
   - Mostra LCP, INP, CLS em tempo real
   - Identifica elementos específicos causando problemas

#### 27.12.5 Checklist de Core Web Vitals

Antes de considerar uma página otimizada:

- [ ] **LCP < 2.5s**: Elemento LCP sem animação
- [ ] **INP < 200ms**: Interações respondem rapidamente
- [ ] **PageTransition**: Sem `mode="wait"`, duração ≤ 0.15s
- [ ] **Selectors estáveis**: useRef para inline selectors
- [ ] **Callbacks estáveis**: Dados de store lidos dentro do callback
- [ ] **Sem animate-pulse/spin em listas**: Usar indicadores estáticos
- [ ] **Sem layoutId em loops**: Usar CSS para indicadores
- [ ] **Constantes fora do componente**: filterFields, navItems, etc.
- [ ] **Columns memoizados**: useMemo para arrays com render functions

---

## 28. Checklist de Desenvolvimento

### Novo Componente
- [ ] Segue Single Responsibility Principle
- [ ] Props tipadas com TypeScript
- [ ] Acessivel (keyboard, screen readers)
- [ ] Responsivo (mobile-first)
- [ ] Usa CSS Variables/Tailwind para cores
- [ ] Estados hover/active/disabled estilizados
- [ ] Animacoes com Framer Motion (se aplicavel)
- [ ] Documentado com exemplos

### Nova Pagina de Dados
- [ ] Loading state com Skeleton
- [ ] Error state com EmptyState type="error"
- [ ] Empty state com EmptyState type="no-data" ou "search"
- [ ] Filtros com Select usando padrao `__all__`
- [ ] DataTable com sort e paginacao
- [ ] **Server-side pagination**: Usar `usePaginated*` hooks para listas grandes
- [ ] **Client-side pagination**: Apenas para paginas que precisam de todos os dados (OEE, MTTR)
- [ ] Stats cards no topo
- [ ] DetailsDrawer para detalhes
- [ ] Botao refresh no header
- [ ] Reset page para 1 quando filtros mudam

### Nova Feature
- [ ] Planejada com UX em mente
- [ ] Feedback visual para todas acoes
- [ ] Estados de loading e erro
- [ ] Animacoes suaves
- [ ] Toast para confirmacoes
- [ ] Testes escritos
- [ ] Documentacao atualizada

### Antes de Commit
- [ ] Build passa sem erros
- [ ] Sem erros de TypeScript
- [ ] Sem warnings de ESLint
- [ ] Testado em diferentes tamanhos de tela
- [ ] Cores seguem tema semantico

---

This guide is intended for AI agents to understand, maintain, and extend React/Next.js applications using FLUX architecture with shadcn/ui, Tailwind CSS, and modern best practices for scalability, maintainability, and performance.
