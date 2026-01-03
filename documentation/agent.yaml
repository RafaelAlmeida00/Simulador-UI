# Agent Guide: React FLUX Architecture & Best Practices

## 1. FLUX Architecture Overview

FLUX is a pattern for managing unidirectional data flow in React applications. It consists of:
- **Actions**: Payloads of information that send data from the app to the dispatcher.
- **Dispatcher**: Central hub that manages all data flow.
- **Stores**: Containers for application state & logic.
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
│   ├── components/        # Reusable UI components
│   ├── containers/        # Smart components (connected to stores)
│   ├── stores/            # FLUX stores
│   ├── actions/           # FLUX actions
│   ├── dispatcher/        # FLUX dispatcher
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── styles/            # CSS/SCSS modules
│   └── pages/             # Next.js pages
├── public/                # Static assets
├── documentation/         # Project documentation
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
1. **Consistência**: Manter padrões visuais e funcionais em toda a interface.
2. **Atalhos para usuários experientes**: Permitir aceleração de tarefas para usuários avançados.
3. **Feedback informativo**: O sistema deve fornecer feedback claro e imediato para cada ação do usuário.
4. **Fechar o diálogo**: Informar claramente o início, meio e fim de processos, com mensagens de conclusão.
5. **Prevenção de erros**: Projetar para evitar erros antes que ocorram.
6. **Desfazer/refazer**: Permitir desfazer e refazer ações facilmente.
7. **Controle do usuário**: Usuários devem sentir-se no controle, podendo cancelar ou sair de operações.
8. **Redução da carga de memória**: Minimizar a necessidade de lembrar informações entre etapas.

#### Golden Rules (Regras de Ouro) para Desenvolvimento
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

## 9. Basic Color Schemes (Dark & Light)

```yaml
colorSchemes:
  light:
    background: '#FFFFFF'
    text: '#222222'
    primary: '#1976D2'
    secondary: '#FFC107'
    success: '#4CAF50'
    error: '#F44336'
    warning: '#FF9800'
    info: '#2196F3'
  dark:
    background: '#181818'
    text: '#FAFAFA'
    primary: '#90CAF9'
    secondary: '#FFD54F'
    success: '#81C784'
    error: '#E57373'
    warning: '#FFB74D'
    info: '#64B5F6'
```

## 10. Visual Theory: Color Usage

- **Confirmation**: Use green (`success`) for positive actions.
- **Negation/Error**: Use red (`error`) for destructive/negative actions.
- **Warning**: Use orange/yellow (`warning`) for caution.
- **Information**: Use blue (`info`) for neutral/informational messages.
- **Accessibility**: Ensure color contrast meets WCAG AA/AAA.
- **Consistent UI**: Use the same color for the same meaning everywhere.

## 11. Additional Recommendations

- Use TypeScript for type safety.
- Use ESLint and Prettier for code quality and formatting.
- Write unit and integration tests (Jest, React Testing Library).
- Use Storybook for UI component development.
- Document all APIs and components.
- Use environment variables for configuration.
- Secure all endpoints and sanitize user input.
- Regularly update dependencies.

## 11.1 HTTP Requests (Padrão)

- Utilize **Axios** como biblioteca padrão para requisições HTTP no front-end.
- Padronize o uso através do helper `app/utils/http.ts` (instância única `http`).
- Configure o endpoint via `NEXT_PUBLIC_API_BASE_URL` quando aplicável.

## 12. UI Frameworks and Iconography (Padrão)

- Utilize **MUI (Material-UI)** como biblioteca principal de componentes React para garantir consistência visual, acessibilidade e produtividade.
- Utilize **Tailwind CSS** para utilidades de estilização rápida, responsiva e customização de temas.
- Utilize **Material Icons** como padrão para ícones, garantindo padronização visual e fácil integração com MUI.

**Exemplo de uso combinado:**

```tsx
import Button from '@mui/material/Button';
import { styled } from '@mui/system';
import 'tailwindcss/tailwind.css';
import Icon from '@mui/material/Icon';

<Button className="bg-primary text-white" startIcon={<Icon>check_circle</Icon>}>
  Confirmar
</Button>
```

> Sempre priorize componentes MUI para formulários, navegação, diálogos e elementos interativos. Use Tailwind para ajustes rápidos de layout, espaçamento e responsividade. Para ícones, utilize Material Icons nativos do MUI.

## 14. Animações: Motion & React Spring

- **Frameworks padrão:** Utilize **Framer Motion** (`framer-motion`) e **react-spring** (`@react-spring/web`) como bibliotecas padrão para animações em componentes React. Ambas oferecem APIs declarativas, integração com hooks e excelente performance.

### Exemplos de uso

- **Framer Motion:**
  ```tsx
  import { motion } from 'framer-motion';
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    Conteúdo animado
  </motion.div>
  ```
- **react-spring:**
  ```tsx
  import { useSpring, animated } from '@react-spring/web';
  const styles = useSpring({ opacity: 1, from: { opacity: 0 } });
  <animated.div style={styles}>Conteúdo animado</animated.div>
  ```

### Boas práticas de animação
- Use animações para reforçar feedback, transições e hierarquia visual, nunca como distração.
- Prefira animações suaves e rápidas (duração entre 150ms e 400ms).
- Sempre respeite as preferências de acessibilidade do usuário (`prefers-reduced-motion`).
- Evite animar propriedades que causam reflow/layout (prefira `opacity`, `transform`).
- Sincronize animações com mudanças de estado e navegação.
- Use animações para guiar o foco e indicar mudanças importantes.
- Documente animações complexas e seus propósitos.

### Padrões de Ouro para Animações
1. **Consistência:** Use padrões de animação iguais para interações semelhantes (ex: fade para entrada/saída, slide para navegação).
2. **Acessibilidade:** Sempre respeite `prefers-reduced-motion` e forneça alternativas sem animação.
3. **Performance:** Prefira `transform` e `opacity` para animações; evite animar `width`, `height`, `top`, `left`.
4. **Feedback Imediato:** Use animações para indicar carregamento, sucesso, erro ou mudanças de estado.
5. **Simplicidade:** Não exagere na complexidade; animações devem ser discretas e funcionais.
6. **Composição:** Componha animações reutilizáveis como hooks ou componentes animados.
7. **Integração com UI:** Sincronize animações com eventos de UI (ex: abrir/fechar modal, hover, transições de página).
8. **Testabilidade:** Teste animações críticas (ex: presença/ausência de elementos, transições de estado) usando testes automatizados ou Storybook.
9. **Documentação:** Documente padrões e tokens de animação (duração, easing, delays) em um local central.
10. **Fallbacks:** Garanta que a UI funcione corretamente mesmo sem animação.

> Sempre priorize Framer Motion para animações de presença, transições de página e microinterações. Use react-spring para animações físicas, gestos e casos avançados de interpolação.


## 13. Responsividade com Tailwind CSS e MUI

Este tópico reúne práticas recomendadas e exemplos práticos para construir UIs responsivas combinando Tailwind CSS (utilitários) com MUI (componentes e sistema de breakpoints). A abordagem é mobile-first, com atenção a acessibilidade, performance e testes.

- **Princípios gerais:**
  - **Mobile-first:** escreva estilos para dispositivos pequenos primeiro, depois acrescente modificações com prefixos responsivos (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) ou breakpoints do MUI.
  - **Progressive enhancement:** gradualmente aumente a complexidade para telas maiores.
  - **Consistência de breakpoints:** alinhe os breakpoints do Tailwind com os do MUI quando possível (ou documente as diferenças).

- **Mapeamento padrão (Tailwind ↔ MUI):**
  - Tailwind: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px)
  - MUI (padrão): `xs` (0), `sm` (600), `md` (900), `lg` (1200), `xl` (1536)
  - Observação: ajustar `tailwind.config.js` ou `createTheme()` do MUI se você quiser unificar exatamente os pontos de quebra.

- **Tailwind — práticas e exemplos:**
  - Use classes responsivas para espaçamento e layout: `p-4 sm:p-6 md:p-8 lg:p-10`.
  - Layouts flexíveis: `flex flex-col md:flex-row gap-4 md:gap-6` para alternar entre coluna/linha conforme o breakpoint.
  - Grid responsivo: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.
  - Tipografia: `text-sm md:text-base lg:text-lg` ou usar plugins de tipografia fluida.
  - Visibilidade condicional: `hidden md:block` para mostrar/ocultar elementos por breakpoint.
  - Imagens responsivas: combine `object-cover w-full h-auto` com o componente `next/image` para otimização.
  - Exemplo curto:

```tsx
<div className="p-4 sm:p-6 md:p-8 lg:p-10">
  <header className="flex items-center justify-between">
    <h1 className="text-lg md:text-2xl">Título responsivo</h1>
    <nav className="hidden md:flex gap-4">{/* Links */}</nav>
  </header>
  <main className="grid grid-cols-1 md:grid-cols-3 gap-4">{/* Cards */}</main>
</div>
```

- **MUI — práticas e exemplos:**
  - Use o sistema `sx` e objetos responsivos: `sx={{ p: { xs: 2, sm: 3, md: 4 } }}`.
  - `useMediaQuery` para lógica condicional no render: `const isMd = useMediaQuery(theme.breakpoints.up('md'))`.
  - `Grid` e `Stack` para layout: `Grid` com `xs`, `sm`, `md` props e `Stack` para empilhar com `direction={{ xs: 'column', md: 'row' }}`.
  - Diálogos e drawers responsivos: `fullScreen={useMediaQuery(theme.breakpoints.down('sm'))}` para transformar componentes em tela cheia em mobile.
  - Tipografia responsiva: usar `responsiveFontSizes(theme)` e `variant="h5"` com `sx` para ajustes por breakpoint.
  - Exemplo curto:

```tsx
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const Component = () => {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        {/* Conteúdo */}
      </Box>
    </Box>
  );
};
```

- **Combinar Tailwind e MUI (boas práticas):**
  - Prefira MUI para componentes ricos (forms, dialogs, data-grid) e use `sx`/props responsivos do MUI.
  - Use Tailwind para utilitários rápidos de layout, espaçamento e classes utilitárias que não conflitam com MUI.
  - Evite misturar responsabilidades: não duplique estilos (ex.: não use `p-4` e `sx={{ p: 2 }}` no mesmo elemento sem motivo).
  - Harmonize tokens: alinhe cores, espaçamentos e tipografia entre `tailwind.config.js` e o `theme` do MUI quando possível.

- **Exemplos de integrações úteis:**
  - Componente MUI com classes Tailwind:

```tsx
<Button className="bg-primary text-white" sx={{ px: { xs: 2, md: 4 } }}>
  Confirmar
</Button>
```

  - Usar valores responsivos do MUI quando lógica de layout fizer parte do componente MUI.

- **Formulários e UX responsiva:**
  - Inputs: largura `w-full` no mobile; usar `Grid` ou `Stack` para múltiplas colunas em telas maiores.
  - Botões primários e ações secundárias devem manter hierarquia visual consistente em todos os breakpoints.

- **Acessibilidade (a11y) e responsividade:**
  - Garanta foco visível em todos os estados e breakpoints.
  - Verifique contraste de cores em cada breakpoint (textos maiores podem reduzir contraste exigido, mas não dependa disso).
  - Para controles que viram menus/Drawers, mantenha ordem DOM consistente para leitura por leitores de tela.

- **Performance e imagens:**
  - Use `next/image` para carregamento responsivo e otimizado de imagens.
  - Evite carregar recursos pesados em mobile; use lazy-loading e placeholders.

- **Testes e validação:**
  - Manual: use DevTools (device toolbar) e ferramentas como Lighthouse em vários tamanhos.
  - Storybook: defina viewports personalizados e teste componentes isolados por breakpoint.
  - Unit / Integration: no `jest`/`react-testing-library` emular redimensionamento de janela (`window.innerWidth` / `window.resizeTo`) para testar comportamento condicionado a breakpoints.

- **Recomendações práticas finais:**
  - Documente decisões de breakpoint e quando usar Tailwind vs MUI em componentes compartilhados.
  - Configure tokens compartilhados (cores, espaçamentos, tipografia) para coerência visual.
  - Prefira layout fluido (percentuais, `min/max-width`) em vez de valores fixos onde possível.
  - Automatize testes de regressão visual (Percy, Chromatic) para detectar mudanças de layout por breakpoint.

---

This guide is intended for AI agents to understand, maintain, and extend React/Next.js applications using FLUX architecture, following best practices for scalability, maintainability, and performance.
