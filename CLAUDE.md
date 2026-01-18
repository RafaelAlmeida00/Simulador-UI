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
- Configure o endpoint via `NEXT_PRIVATE_API_BASE_URL` quando aplicavel.

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
    socket = io(process.env.NEXT_PRIVATE_SOCKET_URL || 'http://localhost:3001');
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
  baseURL: process.env.NEXT_PRIVATE_API_BASE_URL,
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

## 29. Seguranca - Security Hardening

Esta secao documenta as medidas de seguranca implementadas no frontend.

### 29.1 Arquivos de Seguranca

```
app/
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts  # NextAuth com lockout e revocation
│   │   ├── login/route.ts          # Login com timing protection
│   │   ├── csrf/route.ts           # CSRF token endpoint
│   │   └── session/route.ts        # Session validation
│   └── cors.ts                     # CORS helper module
├── src/lib/
│   ├── auth.ts                     # Auth functions + lockout helpers
│   └── token-revocation.ts         # Token revocation module
└── middleware.ts                   # Security headers (CSP)
```

### 29.2 Prevencao de User Enumeration

**REGRA:** NUNCA usar mensagens de erro especificas que revelem se um usuario existe.

```typescript
// ERRADO - Revela que usuario existe
if (!user) throw new Error('Usuario nao encontrado');
if (!passwordMatch) throw new Error('Senha incorreta');

// CORRETO - Mensagem generica para todos os casos
const GENERIC_AUTH_ERROR = 'Credenciais invalidas';

// Mesmo erro para: usuario nao existe, senha errada, conta bloqueada
throw new Error(GENERIC_AUTH_ERROR);
```

### 29.3 Protecao Contra Timing Attacks

**REGRA:** Sempre executar bcrypt.compare mesmo quando usuario nao existe.

```typescript
// app/src/lib/auth.ts
const DUMMY_PASSWORD_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqV/mHvHLKi';

export async function verifyPasswordSecure(
  password: string,
  hashedPassword: string | null
): Promise<boolean> {
  // Usa hash dummy se usuario nao existe - tempo de resposta igual
  const hashToCompare = hashedPassword || DUMMY_PASSWORD_HASH;
  return compare(password, hashToCompare);
}

// Garantir tempo minimo de resposta
export async function ensureMinResponseTime(startTime: number): Promise<void> {
  const elapsed = Date.now() - startTime;
  const remainingDelay = Math.max(0, MIN_RESPONSE_TIME_MS - elapsed);
  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }
}
```

### 29.4 Account Lockout (Brute Force Protection)

**Configuracao:**
- `MAX_FAILED_ATTEMPTS = 5` - Tentativas antes de bloquear
- `LOCKOUT_DURATION_MINUTES = 15` - Duracao do bloqueio

**Campos no D1:**
```sql
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until INTEGER DEFAULT NULL;
ALTER TABLE users ADD COLUMN last_login_at INTEGER DEFAULT NULL;
```

**Funcoes:**
```typescript
// Verificar se conta esta bloqueada
export async function isAccountLocked(userId: string, lockedUntil: number | null): Promise<boolean>;

// Incrementar tentativas falhas (bloqueia apos 5)
export async function incrementFailedAttempts(userId: string, currentAttempts: number): Promise<void>;

// Resetar tentativas apos login bem-sucedido
export async function resetFailedAttempts(userId: string): Promise<void>;
```

### 29.5 Security Headers (CSP)

**Implementado em:** `middleware.ts`

```typescript
function generateCSP(): string {
  const directives = [
    "default-src 'self'",
    process.env.NODE_ENV === 'production'
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' wss: ws: https:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "base-uri 'self'",
  ];
  return directives.join('; ');
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', generateCSP());
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
}
```

### 29.6 CORS Configuration

**Arquivo:** `app/api/cors.ts`

```typescript
import { withCors, handleOptionsRequest } from '../cors';

// Wrapper para API routes
async function handler(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ data: 'example' });
}

export const GET = withCors(handler);
export const OPTIONS = handleOptionsRequest;
```

**Funcoes disponiveis:**
- `getAllowedOrigins()` - Lista de origins permitidos por ambiente
- `isOriginAllowed(origin)` - Verifica se origin e permitido
- `corsHeaders(request)` - Gera headers CORS
- `withCors(handler)` - Wrapper para adicionar CORS a handlers
- `handleOptionsRequest(request)` - Handler para preflight OPTIONS

### 29.7 Token Revocation

**Arquivo:** `app/src/lib/token-revocation.ts`

**Funcoes:**
```typescript
// Revogar token especifico
export async function revokeToken(
  jti: string,
  options?: { userId?: string; reason?: string; expiresAt?: Date }
): Promise<void>;

// Verificar se token foi revogado
export async function isTokenRevoked(jti: string): Promise<boolean>;

// Revogar todos os tokens de um usuario (force logout)
export async function revokeAllUserTokens(userId: string, reason?: string): Promise<number>;
```

**Integracao com NextAuth:**
```typescript
// Em [...nextauth]/route.ts

// JWT callback - adiciona JTI ao token
async jwt({ token, user }) {
  if (user) {
    token.jti = crypto.randomUUID();
  }
  return token;
}

// Session callback - verifica revogacao
async session({ session, token }) {
  if (token.jti && await isTokenRevoked(token.jti as string)) {
    return { expires: new Date(0).toISOString() } as typeof session;
  }
  return session;
}

// Event - revoga token no logout
events: {
  async signOut(message) {
    const token = 'token' in message ? message.token : null;
    if (token?.jti) {
      await revokeToken(token.jti as string, { userId: token.id, reason: 'logout' });
    }
  }
}
```

### 29.8 Mascaramento de Dados Sensiveis

**REGRA:** Nunca logar emails completos ou IDs completos.

```typescript
// Mascarar email para logs
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length > 2 ? local.substring(0, 2) + '***' : '***';
  return `${maskedLocal}@${domain}`;
}

// Uso
console.log(`[AUTH] Login attempt: ${maskEmail(email)}`);
// Output: "[AUTH] Login attempt: ra***@gmail.com"

// Para IDs
console.log(`[AUTH] Token revoked: ${jti.substring(0, 8)}...`);
// Output: "[AUTH] Token revoked: a1b2c3d4..."
```

### 29.9 Checklist de Seguranca

#### Antes de Deploy
- [ ] Mensagens de erro genericas (sem user enumeration)
- [ ] Timing attack prevention ativo
- [ ] Account lockout configurado
- [ ] Security headers (CSP, X-Frame-Options, etc.)
- [ ] CORS configurado para producao
- [ ] Token revocation integrado
- [ ] Dados sensiveis mascarados em logs
- [ ] HTTPS enforced (HSTS em producao)

#### Variaveis de Ambiente Obrigatorias
```env
NEXTAUTH_SECRET=<random-secret-32-chars>
NEXTAUTH_URL=https://yourdomain.com
CLOUDFLARE_ACCOUNT_ID=<account-id>
CLOUDFLARE_D1_UUID=<database-uuid>
CLOUDFLARE_D1_TOKEN=<api-token>
```

#### Testes de Seguranca
```bash
# User enumeration (deve retornar mesmo erro)
curl -X POST /api/auth/login -d '{"email":"fake@test.com","password":"x"}'
curl -X POST /api/auth/login -d '{"email":"real@test.com","password":"wrong"}'

# Security headers
curl -I https://yourapp.com | grep -E "(X-Frame|Content-Security|X-Content-Type)"

# Account lockout (5 tentativas = bloqueio)
for i in {1..6}; do curl -X POST /api/auth/login -d '{"email":"test@test.com","password":"wrong"}'; done
```

---

## 30. Global Search / Command Palette

Sistema de busca global estilo Command Palette acionado por `Ctrl+K` / `Cmd+K`.

### 30.1 Arquitetura

```
app/src/
├── components/domain/GlobalSearch/
│   ├── index.tsx              # Componente principal
│   ├── useGlobalSearch.ts     # Hook de estado e indexacao
│   ├── SearchResultItem.tsx   # Item da lista de resultados
│   └── SearchResultCard.tsx   # Card de detalhe com navegacao
├── types/search.ts            # Tipos TypeScript
├── utils/searchUtils.ts       # Funcoes de indexacao e score
└── hooks/useKeyboardShortcut.ts # Hook de atalhos de teclado
```

### 30.2 Uso do Componente

```tsx
import { GlobalSearch } from '@/src/components/domain';

// No Header ou layout
<GlobalSearch />
```

O componente:
- Renderiza botao com atalho `Ctrl+K`
- Abre Dialog modal centralizado
- Indexa dados do simulatorStore ao abrir (snapshot)
- Filtra em tempo real conforme digitacao
- Exibe Card de detalhe ao selecionar resultado

### 30.3 Categorias de Busca (8 categorias)

| Categoria | Fonte de Dados | Campos Buscaveis | Rota |
|-----------|----------------|------------------|------|
| `shop` | plantState.shops | name | `/` |
| `line` | plantState.shops[].lines | name, shop, taktMn | `/` |
| `station` | plantState.shops[].lines[].stations | name, shop, line | `/` |
| `buffer` | buffersState | id, from, to, type, status | `/buffers` |
| `car` | carsById | id, sequenceNumber, model, color | `/` |
| `oee` | oeeState | shop, line, oee, jph | `/oee` |
| `stop` | stopsState | shop, line, station, reason | `/stoppages` |
| `mttr` | mttrMtbfState | shop, line, station | `/mttr-mtbf` |

### 30.4 Algoritmo de Scoring

```typescript
// searchUtils.ts
export function calculateScore(value: string, searchTerm: string): number {
  const normalized = normalizeSearchTerm(value);
  const term = normalizeSearchTerm(searchTerm);

  if (normalized === term) return 100;     // Exact match
  if (normalized.startsWith(term)) return 80;  // Prefix match
  if (normalized.includes(term)) return 50;    // Contains match
  return 0;
}
```

Resultados sao ordenados por score decrescente.

### 30.5 Hook useKeyboardShortcut

```typescript
import { useKeyboardShortcut } from '@/src/hooks/useKeyboardShortcut';

// Ctrl+K ou Cmd+K para abrir busca
useKeyboardShortcut('k', () => setOpen(true), { ctrl: true, meta: true });

// Shift+Escape para outra acao
useKeyboardShortcut('Escape', closeModal, { shift: true });
```

**Modifiers disponiveis:**
- `ctrl`: Windows/Linux Ctrl
- `meta`: Mac Cmd
- `shift`: Shift
- `alt`: Alt/Option

### 30.6 Tipos TypeScript

```typescript
// types/search.ts
export type SearchCategory =
  | 'shop' | 'line' | 'station' | 'buffer'
  | 'car' | 'oee' | 'stop' | 'mttr';

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  data: unknown;
  matchedFields: string[];
  route: string;
  score: number;
}

export interface SearchIndex {
  shops: SearchResult[];
  lines: SearchResult[];
  stations: SearchResult[];
  buffers: SearchResult[];
  cars: SearchResult[];
  oee: SearchResult[];
  stops: SearchResult[];
  mttr: SearchResult[];
}

// Constantes
export const CATEGORY_LABELS: Record<SearchCategory, string>;
export const CATEGORY_ROUTES: Record<SearchCategory, string>;
export const CATEGORY_ORDER: SearchCategory[];
```

### 30.7 Exemplo de Extensao (adicionar nova categoria)

```typescript
// 1. types/search.ts - Adicionar tipo
export type SearchCategory = ... | 'novacategoria';

// 2. types/search.ts - Adicionar labels e rotas
export const CATEGORY_LABELS = { ..., novacategoria: 'Nova Categoria' };
export const CATEGORY_ROUTES = { ..., novacategoria: '/nova-rota' };
export const CATEGORY_ORDER = [..., 'novacategoria'];

// 3. searchUtils.ts - Adicionar no buildSearchIndex
state.novosDados.forEach((item) => {
  index.novacategoria.push({
    id: item.id,
    category: 'novacategoria',
    title: item.nome,
    // ...
  });
});
```

---

## 31. Sistema de Notificacoes

Sistema de alertas baseado em socket data com Zustand store e regras configuraveis.

### 31.1 Arquitetura

```
app/src/
├── stores/notificationStore.ts       # Zustand store com persistence
├── hooks/useNotificationEngine.ts    # Hook de regras e geracao
└── components/layout/NotificationCenter.tsx  # UI Popover
```

### 31.2 Notification Store (Zustand)

```typescript
// stores/notificationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationSeverity = 'info' | 'warning' | 'critical';
export type NotificationCategory = 'STOP' | 'BUFFER' | 'OEE' | 'SYSTEM';

export interface Notification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  metadata?: Record<string, unknown>;
}

// Store com persistence
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      add: (notification) => { /* ... */ },
      markAsRead: (id) => { /* ... */ },
      markAllAsRead: () => { /* ... */ },
      dismiss: (id) => { /* ... */ },
      clear: () => set({ notifications: [] }),
    }),
    {
      name: 'simulator-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 20), // Persist apenas 20
      }),
    }
  )
);

// Selectors
export const selectUnreadCount = (state: NotificationState) =>
  state.notifications.filter((n) => !n.read).length;
```

**Limites:**
- `MAX_NOTIFICATIONS = 50` em memoria
- `PERSIST_LIMIT = 20` no localStorage

### 31.3 Notification Engine (Regras)

```typescript
// hooks/useNotificationEngine.ts
const CONFIG = {
  BUFFER_HIGH_THRESHOLD: 0.90,     // 90% - warning
  BUFFER_CRITICAL_THRESHOLD: 0.95, // 95% - critical
  BUFFER_LOW_THRESHOLD: 0.10,      // 10% - starving warning
  OEE_TARGET: 85,                  // Target 85%
  OEE_WARNING_DIFF: 5,             // 5% below = warning
  OEE_CRITICAL_DIFF: 15,           // 15% below = critical
  DEBOUNCE_MS: 30000,              // 30s entre notificacoes similares
};
```

**4 Regras Implementadas:**

| Regra | Trigger | Severity |
|-------|---------|----------|
| Stop HIGH | Nova parada severidade HIGH | `critical` |
| Stop MEDIUM | Nova parada severidade MEDIUM | `warning` |
| Buffer >= 95% | Capacidade critica | `critical` |
| Buffer >= 90% | Capacidade alta | `warning` |
| Buffer <= 10% | Buffer esvaziando | `warning` |
| OEE 15%+ abaixo target | OEE muito baixo | `critical` |
| OEE 5%+ abaixo target | OEE abaixo target | `warning` |
| Simulator status change | running/paused/stopped | `info`/`warning` |

### 31.4 Ativacao do Engine

```tsx
// app/(dashboard)/layout.tsx
import { useNotificationEngine } from '@/src/hooks/useNotificationEngine';

export default function DashboardLayout({ children }) {
  // Ativar engine de notificacoes
  useNotificationEngine();

  return ( /* ... */ );
}
```

### 31.5 NotificationCenter UI

```tsx
import { NotificationCenter } from '@/src/components/layout';

// No Header
<NotificationCenter />
```

**Funcionalidades:**
- Badge com contagem de nao-lidas (9+ se > 9)
- Icones por categoria (AlertTriangle, AlertCircle, Info)
- Cores por severidade (destructive, warning, info)
- Tempo relativo sem date-fns ("agora mesmo", "ha 5 min", "ha 2 dias")
- Acoes: Marcar como lida, Remover, Marcar todas, Limpar todas
- Animacoes com Framer Motion AnimatePresence

### 31.6 Adicionar Nova Regra

```typescript
// useNotificationEngine.ts
React.useEffect(() => {
  // Sua logica de deteccao
  for (const item of customState) {
    const key = `custom-${item.id}`;
    if (shouldNotify(key)) {
      addNotification({
        category: 'SYSTEM', // ou nova categoria
        severity: 'warning',
        title: 'Titulo da Notificacao',
        message: 'Mensagem detalhada',
        metadata: { itemId: item.id },
      });
      markNotified(key);
    }
  }
}, [customState, addNotification]);
```

---

## 32. Menu do Usuario

Dropdown menu com gerenciamento de perfil e logout.

### 32.1 Componente UserMenu

```tsx
import { UserMenu } from '@/src/components/layout';

// No Header
<UserMenu />
```

**Funcionalidades:**
- Avatar com iniciais como fallback
- Exibicao de nome e email
- Alterar foto de perfil (URL)
- Alterar nome de exibicao
- Logout com redirect

### 32.2 Estrutura do Componente

```tsx
// components/layout/UserMenu.tsx
export function UserMenu({ className }: UserMenuProps) {
  const { data: session, update: updateSession } = useSession();
  const [nameModalOpen, setNameModalOpen] = React.useState(false);
  const [photoModalOpen, setPhotoModalOpen] = React.useState(false);
  const [modalState, setModalState] = React.useState<ModalState>('idle');

  // Estados do modal: 'idle' | 'loading' | 'success' | 'error'
}
```

### 32.3 API de Perfil

```typescript
// PUT /api/user/profile
const response = await fetch('/api/user/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Novo Nome',    // opcional
    image: 'https://...'  // opcional, null para remover
  }),
});

// Apos sucesso, atualizar sessao
await updateSession({
  ...session,
  user: { ...session?.user, name: newName },
});
```

### 32.4 Estados de Modal Animados

```tsx
<AnimatePresence mode="wait">
  {modalState === 'loading' && (
    <motion.div key="loading">
      <Loader2 className="animate-spin" />
      <p>Atualizando...</p>
    </motion.div>
  )}
  {modalState === 'success' && (
    <motion.div key="success">
      <CheckCircle2 className="text-success" />
      <p>Atualizado com sucesso!</p>
    </motion.div>
  )}
  {modalState === 'error' && (
    <motion.div key="error">
      <XCircle className="text-destructive" />
      <p>{errorMessage}</p>
      <Button onClick={() => setModalState('idle')}>Tentar novamente</Button>
    </motion.div>
  )}
  {modalState === 'idle' && (
    <motion.div key="form">
      {/* Formulario */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 33. Sistema de Tema (Light/Dark)

Sistema de tema com suporte a dark, light e system preference.

### 33.1 ThemeProvider

```tsx
// components/layout/ThemeProvider.tsx
type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;          // default: 'dark'
  storageKey?: string;           // default: 'simulador-ui-theme'
}

export function ThemeProvider({ children, defaultTheme, storageKey }) {
  // Persiste no localStorage
  // Aplica classe no document.documentElement
  // Detecta system preference via matchMedia
}

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void }
```

### 33.2 Configuracao no Root Layout

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/src/components/layout';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="dark" storageKey="simulador-ui-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 33.3 Toggle no Header

```tsx
import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <motion.div animate={{ rotate: theme === 'dark' ? 0 : 180 }}>
        {theme === 'dark' ? <Moon /> : <Sun />}
      </motion.div>
    </Button>
  );
}
```

### 33.4 CSS Variables por Tema

```css
/* globals.css */
@layer base {
  :root {
    /* Light theme variables */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 0 84% 60%;
    /* ... */
  }

  .dark {
    /* Dark theme variables */
    --background: 216 28% 7%;
    --foreground: 210 40% 98%;
    --primary: 0 84% 60%;
    /* ... */
  }
}
```

### 33.5 Cores Disponiveis

| Cor | Uso | Light | Dark |
|-----|-----|-------|------|
| `primary` | Botoes principais, links | Vermelho | Vermelho |
| `success` | Status OK, confirmacao | Teal | Teal |
| `warning` | Alertas, atencao | Amarelo | Amarelo |
| `info` | Informacoes neutras | Azul | Azul |
| `destructive` | Erros, acoes destrutivas | Vermelho escuro | Vermelho |
| `muted` | Texto secundario | Cinza claro | Cinza escuro |

---

## 34. Componentes de Layout Exportados

### 34.1 Barrel Export

```typescript
// components/layout/index.ts
export * from './ThemeProvider';      // ThemeProvider, useTheme
export * from './PageTransition';     // Animacao de transicao de paginas
export * from './Sidebar';            // Navegacao lateral
export * from './Header';             // Cabecalho com controles
export * from './UserMenu';           // Menu do usuario
export * from './NotificationCenter'; // Centro de notificacoes
```

### 34.2 Uso nos Layouts

```tsx
import {
  Sidebar,
  Header,
  PageTransition,
  ThemeProvider,
  NotificationCenter,
  UserMenu,
} from '@/src/components/layout';
```

---

## 35. Hooks Exportados

### 35.1 Barrel Export

```typescript
// hooks/index.ts
// Simulator Store (realtime)
export * from './useSimulatorStore';

// React Query Hooks (REST API)
export * from './useEventsQuery';
export * from './useStopsQuery';
export * from './useOEEQuery';
export * from './useSessionsQuery';    // Session CRUD + control

// Session Hooks
export * from './useSessionGuard';      // Dashboard validation
export * from './useSessionSocket';     // Socket session:join/leave

// Notification Engine
export * from './useNotificationEngine';

// Keyboard Shortcuts (usado pelo GlobalSearch)
export * from './useKeyboardShortcut';
```

### 35.2 Providers Export

```typescript
// components/providers/index.ts
export * from './SessionProvider';
export * from './SessionChannelProvider';
export * from './QueryProvider';
```

### 35.3 Adicionar Novo Hook

```typescript
// 1. Criar hook em hooks/useNewHook.ts
export function useNewHook() { /* ... */ }

// 2. Adicionar export em hooks/index.ts
export * from './useNewHook';
```

---

## 36. Sistema de Sessoes (Session Management)

Sistema completo de gerenciamento de sessoes de simulacao, permitindo multiplas sessoes por usuario com controle de estado, recovery e limites.

### 36.1 Arquitetura

```
app/
├── sessions/                    # Pagina de gerenciamento (fora do dashboard)
│   ├── layout.tsx               # Layout simples sem sidebar
│   └── page.tsx                 # Tela principal de sessoes
└── src/
    ├── stores/
    │   ├── sessionStore.ts      # Zustand store com persist + cookie
    │   └── simulatorStore.ts    # Store de dados do simulador (com reset())
    ├── hooks/
    │   ├── useSessionGuard.ts   # Validacao de sessao no dashboard
    │   ├── useSessionSocket.ts  # Socket session:join/leave + status
    │   └── useSessionsQuery.ts  # React Query hooks para API (inclui useSessionControl)
    ├── components/
    │   ├── providers/
    │   │   └── SessionChannelProvider.tsx  # WebSocket session-scoped channels
    │   └── domain/
    │       ├── SessionCard.tsx      # Card de sessao com status e acoes
    │       └── CreateSessionDialog.tsx # Modal de criacao
    └── types/
        └── session.ts           # Types TypeScript (SessionControlPayload)
```

### 36.2 Fluxo de Navegacao

```
Login → /sessions (selecao) → Dashboard (com sessao)
                ↑
         "Trocar Sessao" (UserMenu)
```

**Middleware Protection:**
- Rotas do dashboard requerem auth + cookie `current-session-id`
- Rota `/sessions` requer apenas auth
- Sem cookie de sessao → redirect para `/sessions`

### 36.3 Session Store (Zustand)

```typescript
// stores/sessionStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cookie sync para middleware
const COOKIE_NAME = 'current-session-id';

export interface SessionMetadata {
  id: string;
  name: string | null;
  status: SessionStatus;
}

interface SessionState {
  currentSessionId: string | null;
  sessionMetadata: SessionMetadata | null;
  socketConnected: boolean;
  isHydrated: boolean;
}

interface SessionActions {
  setSession: (session: Session) => void;
  clearSession: () => void;
  updateSessionStatus: (status: SessionStatus) => void;
  setSocketConnected: (connected: boolean) => void;
  setHydrated: () => void;
}

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      currentSessionId: null,
      sessionMetadata: null,
      socketConnected: false,
      isHydrated: false,

      setSession: (session) => {
        // Set cookie for middleware
        document.cookie = `${COOKIE_NAME}=${session.id}; path=/; max-age=31536000; SameSite=Lax`;
        set({
          currentSessionId: session.id,
          sessionMetadata: {
            id: session.id,
            name: session.name,
            status: session.status,
          },
        });
      },

      clearSession: () => {
        // Remove cookie
        document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
        set({ currentSessionId: null, sessionMetadata: null });
      },

      updateSessionStatus: (status) =>
        set((state) => ({
          sessionMetadata: state.sessionMetadata
            ? { ...state.sessionMetadata, status }
            : null,
        })),

      setSocketConnected: (connected) => set({ socketConnected: connected }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'session-store',
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        sessionMetadata: state.sessionMetadata,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync cookie on rehydrate
        if (state?.currentSessionId) {
          document.cookie = `${COOKIE_NAME}=${state.currentSessionId}; path=/; max-age=31536000; SameSite=Lax`;
        }
        state?.setHydrated();
      },
    }
  )
);

// Selectors para performance
export const selectCurrentSessionId = (s: SessionState) => s.currentSessionId;
export const selectSessionMetadata = (s: SessionState) => s.sessionMetadata;
export const selectIsHydrated = (s: SessionState) => s.isHydrated;
```

### 36.4 Types

```typescript
// types/session.ts
export type SessionStatus =
  | 'idle'        // Criada, nao iniciada
  | 'running'     // Em execucao
  | 'paused'      // Pausada pelo usuario
  | 'stopped'     // Parada definitiva
  | 'expired'     // Tempo esgotado
  | 'interrupted'; // Interrompida (reconexao possivel)

export interface Session {
  id: string;
  name: string | null;
  status: SessionStatus;
  durationDays: number;
  speedFactor: number;
  createdAt: string;
  startedAt: string | null;
  expiresAt: string | null;
  interruptedAt: string | null;  // Para calculo de recovery time
}

export interface SessionLimits {
  maxPerUser: number;
  maxGlobal: number;
  currentUser: number;
  currentGlobal: number;
}

export interface CreateSessionPayload {
  name?: string;
  configId?: string;          // ID da config de planta
  durationDays: number;
  speedFactor?: number;
}

export interface SessionControlPayload {
  action: 'start' | 'pause' | 'resume' | 'stop';
}

export interface SessionStatusUpdate {
  sessionId: string;
  status: SessionStatus;
  reason?: string;
}
```

### 36.5 Hooks

#### useSessionGuard

Valida sessao selecionada no dashboard layout. Redireciona se invalida.

```typescript
// hooks/useSessionGuard.ts
export function useSessionGuard(): {
  sessionValid: boolean;
  validating: boolean;
} {
  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const sessionMetadata = useSessionStore(selectSessionMetadata);
  const isHydrated = useSessionStore(selectIsHydrated);
  const router = useRouter();

  // Aguarda hydration
  if (!isHydrated) return { sessionValid: false, validating: true };

  // Sem sessao selecionada
  if (!currentSessionId) {
    router.replace('/sessions');
    return { sessionValid: false, validating: true };
  }

  // Sessao precisa de recovery
  if (sessionMetadata?.status === 'interrupted') {
    router.replace('/sessions');
    return { sessionValid: false, validating: true };
  }

  // Sessao invalida (expired, stopped)
  if (['expired', 'stopped'].includes(sessionMetadata?.status ?? '')) {
    router.replace('/sessions');
    return { sessionValid: false, validating: true };
  }

  return { sessionValid: true, validating: false };
}
```

#### useSessionSocket

Gerencia conexao socket para sessao atual.

```typescript
// hooks/useSessionSocket.ts
export function useSessionSocket() {
  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const isHydrated = useSessionStore(selectIsHydrated);
  const setSocketConnected = useSessionStore((s) => s.setSocketConnected);
  const updateSessionStatus = useSessionStore((s) => s.updateSessionStatus);

  React.useEffect(() => {
    if (!isHydrated || !currentSessionId) return;

    const socket = getSocket();

    // Entrar na sala da sessao
    socket.emit('session:join', currentSessionId);
    setSocketConnected(true);

    // Ouvir mudancas de status
    socket.on('session:status', (data: SessionStatusUpdate) => {
      if (data.sessionId === currentSessionId) {
        updateSessionStatus(data.status);
      }
    });

    return () => {
      socket.emit('session:leave', currentSessionId);
      socket.off('session:status');
      setSocketConnected(false);
    };
  }, [currentSessionId, isHydrated]);
}
```

#### useSessionsQuery (React Query)

```typescript
// hooks/useSessionsQuery.ts
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
};

// Listar sessoes do usuario
export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.lists(),
    queryFn: async () => {
      const res = await http.get<SessionsResponse>('/sessions');
      return res.data;
    },
  });
}

// Criar sessao
export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) =>
      http.post<Session>('/sessions', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.lists() }),
  });
}

// Controlar sessao (start/pause/resume)
export function useSessionControl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, action }: { sessionId: string; action: string }) =>
      http.post(`/sessions/${sessionId}/control`, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.lists() }),
  });
}

// Recuperar sessao interrompida
export function useRecoverSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      http.post(`/sessions/${sessionId}/recover`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.lists() }),
  });
}

// Descartar sessao interrompida
export function useDiscardSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      http.post(`/sessions/${sessionId}/discard`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.lists() }),
  });
}

// Deletar sessao
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      http.delete(`/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.lists() }),
  });
}
```

### 36.6 SessionCard Component

```typescript
// components/domain/SessionCard.tsx
interface SessionCardProps {
  session: Session;
  onOpen: () => void;
  onControl: (action: 'start' | 'pause' | 'resume') => void;
  onDelete: () => void;
  onRecover: () => void;
  onDiscard: () => void;
}

const statusConfig: Record<SessionStatus, { label: string; variant: string }> = {
  idle: { label: 'Aguardando', variant: 'secondary' },
  running: { label: 'Executando', variant: 'success' },
  paused: { label: 'Pausada', variant: 'warning' },
  stopped: { label: 'Parada', variant: 'destructive' },
  expired: { label: 'Expirada', variant: 'destructive' },
  interrupted: { label: 'Interrompida', variant: 'warning' },
};
```

**Visual por Status:**
- `idle`: Borda normal, botao "Iniciar"
- `running`: Fundo verde sutil, botao "Pausar" + "Abrir"
- `paused`: Fundo amarelo sutil, botao "Continuar" + "Abrir"
- `stopped/expired`: Borda vermelha, apenas "Deletar"
- `interrupted`: Borda amarela, area de alerta com tempo restante, botoes "Retomar" + "Descartar"

**Tempo para Recovery:**
```typescript
const getTimeToRecover = () => {
  if (!session.interruptedAt) return null;
  const deadline = new Date(session.interruptedAt).getTime() + 24 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  if (remaining <= 0) return 'Expirado';
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${minutes}min`;
};
```

### 36.7 Middleware Integration

```typescript
// middleware.ts
const SESSION_COOKIE_NAME = 'current-session-id';

// Rotas que requerem sessao selecionada
const dashboardRoutes = ['/', '/oee', '/mttr-mtbf', '/stoppages', '/events', '/buffers', '/settings'];

// Rotas que requerem apenas auth (sem sessao)
const authOnlyRoutes = ['/sessions'];

// Verificar cookie de sessao para rotas do dashboard
if (dashboardRoutes.includes(pathname)) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/sessions', request.url));
  }
}
```

### 36.8 API Endpoints

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/sessions` | Lista sessoes do usuario + limites |
| POST | `/api/sessions` | Cria nova sessao |
| GET | `/api/sessions/:id` | Detalhes de uma sessao |
| DELETE | `/api/sessions/:id` | Deleta sessao |
| POST | `/api/sessions/:id/control` | Controla sessao (start/pause/resume/stop) |
| POST | `/api/sessions/:id/recover` | Recupera sessao interrompida |
| POST | `/api/sessions/:id/discard` | Descarta sessao interrompida |

**Response de GET /sessions:**
```typescript
interface SessionsResponse {
  sessions: Session[];
  limits: SessionLimits;
}
```

### 36.9 UserMenu - Trocar Sessao

```typescript
// components/layout/UserMenu.tsx
import { ArrowLeftRight } from 'lucide-react';
import { useSessionStore } from '@/src/stores/sessionStore';

const { clearSession, sessionMetadata } = useSessionStore();

const handleSwitchSession = () => {
  clearSession();
  router.push('/sessions');
};

// No JSX (apos outras opcoes):
{sessionMetadata && (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleSwitchSession}>
      <ArrowLeftRight className="mr-2 h-4 w-4" />
      <span>Trocar Sessao</span>
    </DropdownMenuItem>
  </>
)}
```

### 36.10 Dashboard Layout Integration

O layout do dashboard usa um padrao de split em dois componentes para garantir que React Query hooks sejam usados dentro do QueryProvider.

```typescript
// app/(dashboard)/layout.tsx
'use client';

import { useSessionGuard } from '@/src/hooks/useSessionGuard';
import { useSessionSocket } from '@/src/hooks/useSessionSocket';
import { useSessionControl } from '@/src/hooks/useSessionsQuery';
import { SessionChannelProvider } from '@/src/components/providers/SessionChannelProvider';
import {
  useSessionStore,
  selectCurrentSessionId,
  selectSessionStatus,
} from '@/src/stores/sessionStore';

// ─────────────────────────────────────────────────────────────
// Inner Dashboard Content (uses React Query hooks)
// ─────────────────────────────────────────────────────────────
function DashboardContent({ children }: { children: React.ReactNode }) {
  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const sessionStatus = useSessionStore(selectSessionStatus);
  const { mutate: controlSession, isPending: controlPending } = useSessionControl();

  const simHealth = useSimulatorSelector((s) => s.health);
  const simConnect = useSimulatorSelector((s) => s.connected);

  // Handle simulator control actions via REST API
  const handleSimulatorControl = React.useCallback(
    (action: 'start' | 'pause' | 'stop') => {
      if (!currentSessionId) return;

      // Map 'start' when paused to 'resume' for API compatibility
      let apiAction: SessionControlPayload['action'] = action;
      if (action === 'start' && sessionStatus === 'paused') {
        apiAction = 'resume';
      }

      controlSession({ sessionId: currentSessionId, action: apiAction });
    },
    [currentSessionId, sessionStatus, controlSession]
  );

  // Derive display status from session or health
  const displayStatus = React.useMemo(() => {
    if (sessionStatus && sessionStatus !== 'idle') {
      return sessionStatus as 'running' | 'paused' | 'stopped';
    }
    return simHealth?.data?.simulatorStatus ?? 'stopped';
  }, [sessionStatus, simHealth?.data?.simulatorStatus]);

  return (
    <SessionChannelProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            connected={simConnect}
            simulatorTime={simHealth?.data?.simulatorTimestamp}
            simulatorStatus={displayStatus}
            onSimulatorControl={handleSimulatorControl}
            controlPending={controlPending}
          />
          <main className="flex-1 overflow-auto">
            <PageTransition>
              <div className="p-6">{children}</div>
            </PageTransition>
          </main>
        </div>
      </div>
    </SessionChannelProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Layout Component (provides QueryProvider context)
// ─────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Session validation - MUST be called first, before other hooks
  const { validating, sessionValid } = useSessionGuard();

  // Session socket connection - only active when session is valid
  useSessionSocket();

  // Show skeleton while validating session
  if (validating || !sessionValid) {
    return <DashboardSkeleton />;
  }

  // IMPORTANT: QueryProvider must wrap DashboardContent
  // because useSessionControl() uses React Query
  return (
    <QueryProvider>
      <TooltipProvider>
        <DashboardContent>{children}</DashboardContent>
      </TooltipProvider>
    </QueryProvider>
  );
}
```

### 36.11 Fluxo de Recovery

```
1. Servidor detecta desconexao → status = 'interrupted' + interruptedAt = now()
2. Usuario tem 24h para recuperar
3. Na tela /sessions:
   - Card mostra borda warning + area de alerta
   - Exibe tempo restante: "Xh Ymin para retomar"
   - Botoes: [Retomar] [Descartar]
4. Retomar → POST /recover → status = 'running' → abre dashboard
5. Descartar → POST /discard → status = 'stopped'
6. Apos 24h automaticamente → status = 'expired'
```

### 36.12 Checklist de Implementacao

#### Store
- [x] sessionStore com persist
- [x] Cookie sync para middleware
- [x] Selectors otimizados
- [x] Actions: setSession, clearSession, updateSessionStatus

#### Hooks
- [x] useSessionGuard - validacao no dashboard
- [x] useSessionSocket - conexao socket
- [x] useSessionsQuery - React Query para CRUD

#### Componentes
- [x] SessionCard com todos os status
- [x] CreateSessionDialog com config selector
- [x] Dialogs de confirmacao (delete, discard)
- [x] LoadingModal para acoes

#### Integracao
- [x] Middleware com cookie check
- [x] Dashboard layout com guard + socket
- [x] UserMenu com "Trocar Sessao"
- [x] Sessions page fora do dashboard
- [x] SessionChannelProvider para WebSocket session-scoped

### 36.13 SessionChannelProvider

Provider que gerencia subscricoes WebSocket session-scoped. Substitui as subscricoes globais por canais no formato `session:{sessionId}:{channel}`.

```typescript
// app/src/components/providers/SessionChannelProvider.tsx
'use client';

import * as React from 'react';
import { throttle } from 'lodash-es';
import { getSocket } from '@/src/utils/socket';
import { simulatorStore } from '@/src/stores/simulatorStore';
import {
  useSessionStore,
  selectCurrentSessionId,
  selectIsHydrated,
} from '@/src/stores/sessionStore';

// Throttle config por canal (ms)
const THROTTLE_CONFIG: Record<string, number> = {
  plantstate: 100,
  stops: 500,
  buffers: 500,
  health: 3000,
  cars: 1000,
  oee: 2000,
  mttr_mtbf: 5000,
};

const SESSION_CHANNELS = [
  'plantstate', 'stops', 'buffers', 'health', 'cars', 'oee', 'mttr_mtbf'
] as const;

export function SessionChannelProvider({ children }: { children: React.ReactNode }) {
  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const isHydrated = useSessionStore(selectIsHydrated);
  const prevSessionIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isHydrated || !currentSessionId) return;

    // Clear data on session change
    if (prevSessionIdRef.current && prevSessionIdRef.current !== currentSessionId) {
      simulatorStore.reset();
    }
    prevSessionIdRef.current = currentSessionId;

    const socket = getSocket();
    const handlers: Record<string, ReturnType<typeof throttle>> = {};

    // Subscribe to session-scoped channels
    SESSION_CHANNELS.forEach((channel) => {
      const sessionChannel = `session:${currentSessionId}:${channel}`;
      const throttleMs = THROTTLE_CONFIG[channel] ?? 500;

      handlers[channel] = throttle((payload: unknown) => {
        switch (channel) {
          case 'plantstate':
            simulatorStore.setPlantState(payload as Parameters<typeof simulatorStore.setPlantState>[0]);
            break;
          case 'health':
            simulatorStore.setHealth(payload as Parameters<typeof simulatorStore.setHealth>[0]);
            break;
          // ... outros canais
        }
      }, throttleMs, { leading: true, trailing: true });

      socket.on(sessionChannel, handlers[channel]);
      console.log(`[SessionChannel] Subscribed to ${sessionChannel}`);
    });

    return () => {
      SESSION_CHANNELS.forEach((channel) => {
        const sessionChannel = `session:${currentSessionId}:${channel}`;
        if (handlers[channel]) {
          handlers[channel].cancel();
          socket.off(sessionChannel, handlers[channel]);
        }
      });
    };
  }, [currentSessionId, isHydrated]);

  return <>{children}</>;
}
```

**Responsabilidades:**
- Subscribes to `session:{sessionId}:{channel}` on mount
- Throttles updates per channel (reuses THROTTLE_CONFIG)
- Dispatches data to simulatorStore
- Cleanup on session change/unmount
- Calls `simulatorStore.reset()` on session switch to avoid stale data

### 36.14 Header Component Props

O Header recebe props do layout para exibir controles da simulacao:

```typescript
// app/src/components/layout/Header.tsx
interface HeaderProps {
  connected?: boolean;
  simulatorTime?: number | null;
  simulatorStatus?: 'running' | 'paused' | 'stopped' | 'idle';
  onSimulatorControl?: (action: 'start' | 'pause' | 'stop') => void;
  controlPending?: boolean;
}
```

**Comportamento dos Botoes:**
- **Iniciar (Play)**: Visivel quando `idle`, `stopped`, ou `paused`
  - Quando `paused`, exibe "Continuar" e usa variant `success`
  - Quando `idle/stopped`, exibe "Iniciar" e usa variant `ghost`
- **Pausar (Pause)**: Visivel apenas quando `running`, variant `warning`
- **Parar (Square)**: Visivel quando `running` ou `paused`, hover vermelho
- **Loading**: Indicador `Loader2` animado quando `controlPending=true`

**Mapping de Actions:**
O layout mapeia 'start' para 'resume' quando o status atual e 'paused':
```typescript
let apiAction = action;
if (action === 'start' && sessionStatus === 'paused') {
  apiAction = 'resume';
}
```

### 36.15 simulatorStore.reset()

Funcao para limpar todos os dados do simulador ao trocar de sessao:

```typescript
// app/src/stores/simulatorStore.ts
reset() {
  cachedNormalizedPlant = null;
  lastPlantStateRef = null;
  state = {
    ...state,
    health: null,
    plantState: null,
    buffers: null,
    buffersState: [],
    stops: null,
    stopsState: [],
    cars: null,
    carsById: {},
    oee: null,
    oeeState: [],
    mttrMtbf: null,
    mttrMtbfState: [],
  };
  emitChange();
}
```

**Quando e chamada:**
- Automaticamente pelo `SessionChannelProvider` quando `currentSessionId` muda
- Evita que dados da sessao anterior sejam exibidos na nova sessao

### 36.16 Fluxo de Controle da Simulacao

```
User clicks "Iniciar" no Header
  → Header calls onSimulatorControl('start')
  → DashboardContent: handleSimulatorControl('start')
  → Maps to 'resume' if paused, else 'start'
  → useSessionControl.mutate({ sessionId, action })
  → POST /api/sessions/:id/control { action: 'start' }
  → Backend starts session → emits to session:abc123:plantstate, etc.
  → SessionChannelProvider receives → dispatches to simulatorStore
  → useSimulatorSelector hooks → components re-render
```

---

This guide is intended for AI agents to understand, maintain, and extend React/Next.js applications using FLUX architecture with shadcn/ui, Tailwind CSS, and modern best practices for scalability, maintainability, and performance.
