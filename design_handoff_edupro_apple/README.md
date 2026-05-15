# Handoff — EduPro: Redesign macOS Sonoma

## Visão geral
Redesign completo do EduPro com linguagem visual macOS Sonoma — barra lateral com ícones em mosaicos tingidos por secção (estilo *System Settings*), tipografia SF Pro, cartões suavemente elevados, hairlines de 0.5px e paleta cinzenta neutra (Apple system gray). Aplicação **toda em Português de Portugal**.

> O design cobre 5 áreas centrais (Painel, Horário, Assiduidade, Sumários, Notas & Módulos) e a navegação completa, incluindo 4 perfis (Aluno, Professor, Diretor de Turma, Administrador).

## Sobre os ficheiros incluídos
Os ficheiros nesta pasta (`index.html`, `styles.css`, `app.jsx`, etc.) são **referências de design criadas em HTML/React inline** — protótipos que mostram a intenção visual e comportamental. **Não copiar diretamente** para a aplicação Next.js. O objetivo é **recriar este design no codebase existente** (Next.js 15 + shadcn/ui + Tailwind v4 + Prisma) usando os padrões já estabelecidos:

- React Server Components em `src/app/dashboard/*/page.tsx`
- Componentes em `src/components/`
- shadcn/ui primitives em `src/components/ui/`
- Tailwind v4 com tokens em `src/app/globals.css`
- Ícones lucide-react (já em uso)

## Fidelidade
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamento, sombras e estados estão pixel-perfect. Reproduzir fielmente, adaptando-os à stack do EduPro.

---

## Design Tokens

Substituir o bloco `:root` em `src/app/globals.css` por estes valores. **Manter o sistema de variáveis CSS existente** (`--background`, `--foreground`, etc.) e adicionar os novos tokens.

### Cinzentos Apple system
```css
:root {
  --gray-1:  #ffffff;
  --gray-2:  #fbfbfd;
  --gray-3:  #f5f5f7;  /* bg-window */
  --gray-4:  #ececef;
  --gray-5:  #e3e3e7;
  --gray-6:  #d2d2d7;  /* hairline forte */
  --gray-7:  #b0b0b6;
  --gray-8:  #86868b;  /* label-tertiary */
  --gray-9:  #6e6e73;  /* label-secondary */
  --gray-10: #424245;
  --gray-11: #1d1d1f;  /* label */
}
```

### Tokens semânticos (light)
```css
--background:        oklch(0.97 0 0);    /* #f5f5f7 */
--foreground:        oklch(0.16 0 0);    /* #1d1d1f */
--card:              #ffffff;
--card-foreground:   #1d1d1f;
--muted:             rgba(120, 120, 128, 0.08);
--muted-foreground:  #6e6e73;
--border:            rgba(60, 60, 67, 0.12);  /* hairline */
--separator:         rgba(60, 60, 67, 0.12);
--ring:              #007aff;
--primary:           #007aff;             /* Apple system blue */
--primary-foreground:#ffffff;
--radius:            0.625rem;            /* 10px base */
```

### Tokens semânticos (dark)
```css
.dark {
  --background:       #1c1c1e;
  --foreground:       #f5f5f7;
  --card:             #2c2c2e;
  --card-foreground:  #f5f5f7;
  --muted:            rgba(120, 120, 128, 0.24);
  --muted-foreground: #aeaeb2;
  --border:           rgba(120, 120, 128, 0.36);
  --separator:        rgba(120, 120, 128, 0.36);
}
```

### Acentos por secção (System Settings palette)
Cada secção da navegação tem o seu *tint*. Adicionar como variáveis CSS:
```css
--tint-blue:   #007aff;
--tint-indigo: #5856d6;
--tint-purple: #af52de;
--tint-pink:   #ff2d55;
--tint-red:    #ff3b30;
--tint-orange: #ff9500;
--tint-yellow: #ffcc00;
--tint-green:  #34c759;
--tint-mint:   #00c7be;
--tint-teal:   #30b0c7;
--tint-cyan:   #32ade6;
--tint-brown:  #a2845e;
--tint-gray:   #8e8e93;
```

### Mapeamento secção → tint
| Item de navegação    | Tint           |
|----------------------|----------------|
| Painel               | `--tint-blue`    |
| Horário              | `--tint-red`     |
| Calendário           | `--tint-orange`  |
| Mensagens            | `--tint-green`   |
| Comunicações         | `--tint-yellow`  |
| Sumários             | `--tint-indigo`  |
| Assiduidade          | `--tint-green`   |
| Notas & Módulos      | `--tint-pink`    |
| Disciplinas          | `--tint-purple`  |
| Cursos & Turmas      | `--tint-orange`  |
| FCT                  | `--tint-teal`    |
| PAP                  | `--tint-brown`   |
| Documentos           | `--tint-gray`    |
| Substituições        | `--tint-yellow`  |
| Utilizadores         | `--tint-cyan`    |
| Definições           | `--tint-gray`    |

### Tipografia
```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
             "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Mono", monospace;
```

Substituir Geist por SF stack. Remover `next/font` se for o caso, ou deixar Geist como fallback secundário.

**Escala (Apple HIG):**
| Token              | Tamanho | Uso                           |
|--------------------|---------|-------------------------------|
| `text-largetitle`  | 34px    | Headers gigantes              |
| `text-title1`      | 28px    | `<h1>` de página              |
| `text-title2`      | 22px    | Subtítulos                    |
| `text-title3`      | 20px    | H3                            |
| `text-headline`    | 17px    | Headlines                     |
| `text-body`        | 15px    | Corpo (default)               |
| `text-callout`     | 14px    | Callouts, subtítulos          |
| `text-subhead`     | 13px    | Linhas de cartão, nav items   |
| `text-footnote`    | 12px    | Pequenos detalhes             |
| `text-caption`     | 11px    | Labels uppercase              |

**Letter-spacing:** `-0.022em` em títulos grandes, `-0.005em` em texto normal. NUNCA tracking positivo.

### Espaçamento
Usar a escala Tailwind padrão. Padding de conteúdo principal: **28px** (`px-7`), reduzido para **20px** em densidade densa.

### Border radius
- **6px** — botões, badges, toggles
- **7px** — search inputs, segmented controls
- **10px** — atalhos (quick actions)
- **12px** — cartões (`--card-radius`)
- **14px** — sidebar flutuante

### Sombras (cartões)
```css
--card-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.04),
               0 1px 2px rgba(0, 0, 0, 0.04),
               0 8px 24px -8px rgba(0, 0, 0, 0.06);

--card-shadow-flat: 0 0 0 1px var(--separator);
```

---

## Estrutura de aplicação

A app mantém o layout `[sidebar 240px | main]`. Adaptar `src/app/dashboard/layout.tsx`:

```
┌────────────┬─────────────────────────────────────┐
│  Sidebar   │  Topbar (52px, solid bg-content)    │
│  (240px)   ├─────────────────────────────────────┤
│            │                                     │
│  - Geral   │  Content (padding 28px,             │
│  - Ensino  │   overflow-y auto)                  │
│  - Profis. │                                     │
│  - Admin.  │                                     │
│            │                                     │
│  Utilizador│                                     │
└────────────┴─────────────────────────────────────┘
```

### Sidebar (`src/components/layout/sidebar.tsx`)

Estrutura:
1. **Traffic lights** (decorativos, 12px, vermelho/amarelo/verde) — topo
2. **Brand**: mosaico 28×28 com gradient `linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 70%, #000))` + ícone GraduationCap + nome da escola + "EduPro" pequeno
3. **Search**: pílula com `--muted` bg, padding 5px 8px, font 13px
4. **Nav agrupado** em 4 secções: Geral / Ensino / Profissional / Administração. Cada label da secção:
   ```css
   font-size: 11px;
   font-weight: 600;
   text-transform: uppercase;
   letter-spacing: 0.04em;
   color: var(--label-tertiary);
   padding: 12px 20px 4px;
   ```
5. **Nav item**:
   - height ~30px, border-radius 6px, padding 5px 8px
   - **Mosaico tingido 20×20**, border-radius 5px, com ícone branco 11px e tint da secção (ver tabela acima)
   - Label 13px, peso 500
   - Badge opcional (contagem de mensagens / comunicações não lidas)
   - **Active state**: fundo `var(--primary)`, texto branco, mosaico mantém tint
6. **User footer**: avatar 28px circular + nome + role, no fundo, separador acima

Filtrar items por role usando `hasRole(userRole, item.minRole)` (já existe em `lib/permissions.ts`).

### Topbar (52px)

```tsx
<div className="h-[52px] flex items-center gap-3 px-7 border-b border-separator bg-card">
  {showBack && <BackButton />}
  <h2 className="text-sm font-semibold">{title}</h2>
  <div className="flex-1" />
  <RoleSwitch /> {/* dev/demo apenas */}
  <DarkModeToggle />
</div>
```

> ⚠ **Não usar `backdrop-filter` nem `color-mix(... transparent)` no topbar** — provoca problemas de renderização com Chrome. Manter `background: var(--card)` sólido.

### Content area
- `flex-1`, `overflow-y-auto`, padding `var(--content-pad)` (28px default)
- Background **transparente** (`background: transparent`) — deixa o body bg passar.
- `.main` container também transparente. Apenas `body` define `--background`.

---

## Detalhe por ecrã

### 1. Painel (`/dashboard`)

Header de página:
```tsx
<div className="mb-6">
  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--tint-blue)] mb-1">
    Painel · {ROLE_LABELS[role]}
  </div>
  <h1 className="text-[28px] font-bold tracking-tight">Olá, {firstName}</h1>
  <p className="text-[14px] text-muted-foreground">
    {formattedDate} · {className}
  </p>
</div>
```

**Variar conteúdo por role:**

**ALUNO:**
- Stat grid: Módulos (6/9) · Média (15,3) · Faltas (3) · FCT (62%)
- Card "Próximas aulas" (lista de 4)
- Card "Progresso do curso" — anel de progresso (SVG) + barras por disciplina
- Card "Atalhos" — 4 botões: Ver horário, Justificar falta, Notas, Mensagens
- Card "Comunicações" — 4 notificações com mosaico tingido

**PROFESSOR / DIRETOR DE TURMA:**
- Stat grid: Alunos (142) · Sumários (2) · Presenças (93%) · Justificações (4)
- Card "Hoje" — aulas do dia com horas, sala, estado (Registado / Por registar / Próxima)
- Card "Pendentes" — lista de coisas por fazer
- Card "Atalhos" — Registar sumário / Marcar presenças / Ver horário / Lançar notas
- Card "Últimos sumários" — 4 registos recentes

**ADMINISTRADOR:**
- Stat grid: Alunos (412) · Professores (64) · Turmas (38) · Assiduidade (91%)
- Card "Atividade desta semana" — gráfico de barras (7 barras gradient azul) + 3 KPI
- Card "Cursos · resultados" — lista de cursos com média/20
- Card "Atalhos administrativos"
- Card "Alertas"

**StatCard atualizado** (substituir `src/components/ui/stat-card.tsx`):
```tsx
<div className="bg-card rounded-[12px] p-4 shadow-[var(--card-shadow)] flex flex-col gap-1 min-h-[96px]">
  <div className="flex items-center gap-2.5">
    <span className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white"
          style={{background: tint}}>
      <Icon className="w-3.5 h-3.5" />
    </span>
    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  </div>
  <div className="text-[28px] font-bold tracking-[-0.025em] tabular-nums leading-none">
    {value}
  </div>
  {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
  {delta && <DeltaRow value={delta} dir={dir} />}
</div>
```

### 2. Horário (`/dashboard/schedule`)

Grelha CSS:
```css
display: grid;
grid-template-columns: 60px repeat(5, 1fr);  /* hora + 5 dias */
grid-auto-rows: 56px;
gap: 4px;
```

- Linha 1: cabeçalho com SEG/TER/QUA/QUI/SEX + data. Dia atual a `var(--primary)`.
- Coluna 1: rótulos de hora (08:30, 09:30… 16:30) em font 11px tabular-nums.
- Cada bloco de aula: `grid-column: <day+2>; grid-row: <slot+2> / span <dur>`
- **Bloco**: bg sólido com a cor da disciplina + `box-shadow: inset 0 -16px 24px -16px rgba(0,0,0,0.2)` para profundidade. Padding 6/8, border-radius 7px, color white. Conteúdo: subject (12px bold) + teacher (10px 0.9 opacity) + sala (10px, marginTop auto).
- **NÃO usar `linear-gradient` com `color-mix(in oklab, ...)`** — provoca falhas no renderer. Usar bg sólido + inset shadow.

Toolbar: navegação semana (chevron-left, "Esta semana", chevron-right) + Filtrar + "+ Aula".

3 StatCards em baixo: Aulas semana / Disciplinas / Próxima alteração.

### 3. Assiduidade (`/dashboard/attendance`)

**Versão Professor (marcação):**
- Header: "Marcar presenças" + subtítulo com disciplina, turma, horário, sala
- Toolbar: navegação por dia + "Marcar todos presentes" + "Concluir aula" (primary)
- 2 cards em grid: **Resumo da aula** (4 KPI coloridos: Presentes verde / Faltas vermelho / Atrasos laranja / Justificadas azul + barra de progresso) e **Sumário** (textarea + "Anexar" + "Gerar com IA")
- Lista de alunos: grid `minmax(72px, auto) 1fr auto`:
  - **Coluna 1**: número (mono, 11px) + avatar 26px circular tingido com iniciais
  - **Coluna 2**: nome (13px, weight 500, ellipsis)
  - **Coluna 3**: segmented control 4 botões (Presente/Falta/Atraso/Justif.) com tint verde/vermelho/laranja/azul quando ativo

**Versão Aluno (visualização):**
- 4 StatCards: Presenças % / Faltas / Atrasos / Justificadas
- Card "Registo recente" — tabela com data, hora, disciplina, badge de estado, botão "Justificar" se falta sem justif.
- Card "Faltas por disciplina" — barras por disciplina (val / limite) com tint da disciplina

### 4. Sumários (`/dashboard/lessons`)

Layout master-detail:
```css
display: grid;
grid-template-columns: 360px 1fr;
gap: 16px;
```

**Master (esquerda):**
Lista scrollável, cada item:
```tsx
<button className="block w-full text-left px-3.5 py-3 border-b border-separator
                   bg-transparent hover:bg-muted
                   data-[selected]:bg-[var(--accent-soft)]">
  <div className="flex items-center justify-between mb-1">
    <div className="flex items-center gap-2">
      <span className="w-1 h-3.5 rounded-sm" style={{background: lesson.color}} />
      <span className="text-[13px] font-semibold">{lesson.subject}</span>
    </div>
    {lesson.status === "registado"
      ? <Check className="w-3 h-3 text-[var(--tint-green)]" />
      : <Badge tint="orange">Pendente</Badge>}
  </div>
  <div className="text-xs text-muted-foreground">{lesson.class} · {lesson.hours}</div>
  <div className="text-xs text-muted-foreground font-mono mt-1">
    {lesson.weekday} · {lesson.date}
  </div>
</button>
```

**Detail (direita):**
- Header com bar colorida 6px + título 16px + meta info + botão Editar/Registar
- Corpo: label "SUMÁRIO" (uppercase 11px, weight 600) + texto 14px line-height 1.55
- Grid 4 colunas com: Presenças / Lições / Módulo / Estado
- Anexos: chips com bg muted, padding 6/10, border-radius 7

Toolbar superior: segmented control (Todos / Por registar / Registados) + filtros + "+ Novo sumário".

### 5. Notas & Módulos (`/dashboard/modules`)

**Versão Aluno:**
- 4 StatCards: Média / Aprovados / Em curso / Em recurso
- Para cada disciplina, um card:
  - Header com mosaico tingido + nome + "X de Y módulos aprovados" + **anel de progresso 40×40**
  - Tabela: Módulo (M1/M2…) · Designação · Estado (badge colorido) · Nota (mono, 14px, weight 700, colorida por nível: vermelho <10 / laranja 10-13 / azul 14-16 / verde 17+)

**Versão Professor:**
- Header com disciplina + turma + meta
- Tabela larga (`overflow-x: auto`): Aluno (avatar + nome) · M1 · M2 … M9 · Média
  - Notas com cor por nível
- 3 StatCards em baixo: Média turma / Taxa de aprovação / Alunos em risco

### Anel de progresso (componente reutilizável)
```tsx
function ProgressRing({ value, size = 56, stroke = 6, color }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{width: size, height: size}}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke="var(--muted)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke={color || "var(--primary)"} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center
                      text-[13px] font-bold tabular-nums">
        {value}%
      </div>
    </div>
  );
}
```

---

## Estados e variantes

### Badge
| Variante | Background                    | Color       | Uso                       |
|----------|-------------------------------|-------------|---------------------------|
| green    | `rgba(52, 199, 89, 0.16)`     | `#1d8a3a`   | Aprovado / Registado      |
| blue     | `rgba(0, 122, 255, 0.16)`     | `#0064d2`   | Em curso / Justificada    |
| orange   | `rgba(255, 149, 0, 0.18)`     | `#b86b00`   | Pendente / Recurso        |
| red      | `rgba(255, 59, 48, 0.16)`     | `#c41a13`   | Falta / Reprovado         |
| yellow   | `rgba(255, 204, 0, 0.22)`     | `#8a6500`   | Recurso                   |
| purple   | `rgba(175, 82, 222, 0.16)`    | `#8a3bb9`   | (livre)                   |
| gray     | `var(--muted)`                | `var(--muted-foreground)` | Neutro       |

Padding `2px 8px`, font 11px weight 600, border-radius 6px.

### Botão primary
- bg: `var(--primary)`
- color: white
- `box-shadow: 0 0 0 0.5px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.1)`
- hover: `filter: brightness(1.05)`

### Botão default (ghost)
- bg: `var(--muted)`
- hover: bg `var(--muted)` mais escuro (rgba 0.12)

### Hover de linhas/cartões
Subtle: `background: var(--muted)` no hover.

### Focus ring
`outline: 2px solid var(--ring); outline-offset: 2px;` — Apple-style.

---

## Interações e comportamento

- **Sidebar nav item**: clica → navega via `next/link`. Active state derivado de `usePathname()`.
- **Topbar role switch**: APENAS para demo. Em produção, o role vem da sessão. Remover este controlo no commit final.
- **Dark mode toggle**: alterna `.dark` na `<html>`. Persistir em `localStorage` chave `edupro:theme`. Default = system preference via `prefers-color-scheme`.
- **Marcação de presenças**: atualização otimista do estado local + POST para `/api/attendance`. Erros revertem.
- **Master-detail dos sumários**: seleção mantida em URL (`?lessonId=`) para shareable. Carregar detalhes via Server Component ou client fetch.
- **Notas em risco**: alunos com média <10 destacados a vermelho.

---

## Animações
Manter discretas (estilo Apple):
- Transições de bg em hover: `transition: background 80ms ease;`
- Toggle de tema: `transition: background-color 200ms ease, color 200ms ease;`
- Anel de progresso: `transition: width 200ms ease;` no fill

---

## Avisos importantes para o developer

1. **Não usar `backdrop-filter` em elementos com bg `color-mix(... transparent)`** — Chrome falha a renderizar em certos contextos (encontrámo-lo no topbar). Manter bg sólidos por agora.
2. **Não usar `linear-gradient` com `color-mix(in oklab, ...)`** dentro de cells de CSS grid — o renderer pode silenciar a cor. Usar bg sólido + `box-shadow: inset` para profundidade.
3. **A `<main>` wrapper deve ser `background: transparent`** — se tiver bg próprio, sobrepõe-se ao topbar. Definir o bg do app só em `body` ou na `<div class="app">`.
4. **Manter Portuguese de Portugal em TODO o copy** — não usar PT-BR. "Definições" (não Configurações), "Início de sessão", "Palavra-passe", "Ficheiro" (não Arquivo), "Apagar" (não Excluir), "Utilizador" (não Usuário), "Ecrã" (não Tela).
5. **Tabular nums em números** — usar `tabular-nums` (Tailwind) ou `font-variant-numeric: tabular-nums` em qualquer número (notas, horas, contagens).
6. **Hairlines de 0.5px** — usar `border-width: 0.5px` (suportado nativamente em telas Retina). Em fallback, 1px com cor mais clara.

---

## Ficheiros nesta pasta

| Ficheiro              | Conteúdo                                                    |
|-----------------------|-------------------------------------------------------------|
| `index.html`          | Shell do protótipo (entry point)                            |
| `styles.css`          | Todos os tokens + estilos do design system                  |
| `app.jsx`             | Root + routing + tweaks integration                         |
| `shell.jsx`           | Sidebar + Topbar                                            |
| `icons.jsx`           | Conjunto de ícones SVG inline (em produção, usar lucide-react) |
| `data.jsx`            | Mock data (substituir por dados Prisma reais)               |
| `screens/painel.jsx`  | Painel (3 variantes por role)                               |
| `screens/horario.jsx` | Grelha do horário                                           |
| `screens/assiduidade.jsx` | Marcação + visualização de assiduidade                  |
| `screens/sumarios.jsx`| Master-detail de sumários                                   |
| `screens/modulos.jsx` | Notas & Módulos (aluno + professor)                         |
| `screens/placeholder.jsx` | Página genérica para áreas ainda não desenhadas         |

> **Nota:** o painel "Tweaks" do protótipo (canto inferior direito) é apenas uma ferramenta de prototipagem — controla dark mode, accent, estilo de cartões, estilo de sidebar e densidade em tempo real. **Não incluído neste handoff** e **não deve ser portado** para produção. Em produção, dark mode e accent vivem nas Definições do utilizador.

Abrir `index.html` num browser para ver o protótipo a funcionar. Recomenda-se navegar pelos 5 ecrãs em cada um dos 4 perfis (Aluno / Professor / Diretor / Administrador) antes de começar a implementar.

---

## Plano de implementação sugerido

1. **Tokens primeiro** — atualizar `src/app/globals.css` com os novos tokens. Verificar que a app antiga não rebenta.
2. **Sidebar** — refazer `src/components/layout/sidebar.tsx` com mosaicos tingidos e secções agrupadas.
3. **Topbar** — substituir `src/components/layout/topbar.tsx` por versão com título dinâmico + dark mode toggle.
4. **StatCard** — atualizar `src/components/ui/stat-card.tsx` com mosaico tingido + escala tipográfica nova.
5. **Painel** — `src/app/dashboard/page.tsx`: dividir em 3 sub-componentes (`<PainelAluno/>`, `<PainelProfessor/>`, `<PainelAdmin/>`) e renderizar com base no role.
6. **Horário** — `src/app/dashboard/schedule/page.tsx`: grelha CSS conforme acima.
7. **Assiduidade** — refazer `attendance-form.tsx` com o segmented control 4-estados.
8. **Sumários** — `src/app/dashboard/lessons/page.tsx`: layout master-detail.
9. **Notas** — `src/app/dashboard/modules/page.tsx`: aluno (cards por disciplina) + professor (tabela cruzada).
10. **Polish** — dark mode, focus rings, transições de hover, tabular-nums em todos os números.

Boa sorte! 🍀
