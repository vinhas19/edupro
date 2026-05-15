/* ─── EduPro · main app ─── */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "accent": "#007aff",
  "cardStyle": "elevated",
  "sidebarStyle": "labeled",
  "density": "balanced"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = [
  "#007aff", // blue
  "#5856d6", // indigo
  "#34c759", // green
  "#af52de", // purple
  "#ff2d55", // pink
  "#ff9500", // orange
];

function App() {
  const [role, setRole] = React.useState(() => localStorage.getItem("edupro:role") || "STUDENT");
  const [screen, setScreen] = React.useState(() => localStorage.getItem("edupro:screen") || "painel");
  const [t, setTweak] = (typeof useTweaks === "function") ? useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, ()=>{}];

  React.useEffect(() => { localStorage.setItem("edupro:role", role); }, [role]);
  React.useEffect(() => { localStorage.setItem("edupro:screen", screen); }, [screen]);

  // Apply tweaks
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", !!t.dark);

    const root = document.documentElement;
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-soft", hexToSoft(t.accent));

    // density
    document.body.classList.remove("density-spacious", "density-balanced", "density-dense");
    document.body.classList.add(`density-${t.density}`);

    // sidebar width
    const w = t.sidebarStyle === "icons" ? 56 : t.sidebarStyle === "floating" ? 252 : 240;
    root.style.setProperty("--sidebar-w", `${w}px`);
  }, [t]);

  // Default screen per role
  React.useEffect(() => {
    // If on a teacher-only screen and we switch to STUDENT, fall back
    const item = NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === screen);
    if (item && !item.roles.includes(role)) setScreen("painel");
  }, [role]);

  // Screen title
  const item = NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === screen);
  const title = item?.label || "Painel";

  function renderScreen() {
    const cardStyle = t.cardStyle;
    switch (screen) {
      case "painel": return <Painel role={role} onNav={setScreen}/>;
      case "horario": return <Horario role={role} cardStyle={cardStyle}/>;
      case "assiduidade": return <Assiduidade role={role}/>;
      case "sumarios": return <Sumarios role={role}/>;
      case "modulos": return <Modulos role={role}/>;
      default: return <Placeholder id={screen} role={role}/>;
    }
  }

  // Apply card style globally via class on .content wrapper
  return (
    <div className="app" data-card-style={t.cardStyle}>
      <Sidebar
        activeId={screen}
        onNav={setScreen}
        role={role}
        sidebarStyle={t.sidebarStyle}
      />
      <main className="main">
        <Topbar title={title} role={role} onRole={setRole}
          onBack={screen !== "painel" ? () => setScreen("painel") : null}
          actions={
            <button className="btn ghost" title="Aspeto"
              onClick={() => setTweak("dark", !t.dark)}>
              <Icon name={t.dark ? "sun" : "circle"} size={14}/>
            </button>
          }/>
        <div className={`content card-style-${t.cardStyle}`}>
          {renderScreen()}
        </div>
      </main>
      {typeof TweaksPanel !== "undefined" && (
        <TweaksPanel title="Tweaks">
          <TweakSection label="Aparência">
            <TweakToggle label="Modo escuro" value={!!t.dark}
              onChange={v => setTweak("dark", v)}/>
            <TweakColor label="Cor de destaque" value={t.accent}
              options={ACCENT_OPTIONS}
              onChange={v => setTweak("accent", v)}/>
          </TweakSection>
          <TweakSection label="Layout">
            <TweakRadio label="Cartões"
              value={t.cardStyle}
              options={[
                {value: "flat", label: "Plano"},
                {value: "elevated", label: "Elevado"},
                {value: "glass", label: "Vidro"},
              ]}
              onChange={v => setTweak("cardStyle", v)}/>
            <TweakRadio label="Barra lateral"
              value={t.sidebarStyle}
              options={[
                {value: "icons", label: "Ícones"},
                {value: "labeled", label: "Etiquetas"},
                {value: "floating", label: "Flutuante"},
              ]}
              onChange={v => setTweak("sidebarStyle", v)}/>
            <TweakRadio label="Densidade"
              value={t.density}
              options={[
                {value: "spacious", label: "Espaçosa"},
                {value: "balanced", label: "Equilibrada"},
                {value: "dense", label: "Densa"},
              ]}
              onChange={v => setTweak("density", v)}/>
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
}

function hexToSoft(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.14)`;
}

// Apply card style to all .card elements by class on .content
const styleEl = document.createElement("style");
styleEl.textContent = `
  .content.card-style-flat .card,
  .content.card-style-flat .stat,
  .content.card-style-flat .schedule { box-shadow: var(--card-shadow-flat); background: var(--card-bg); }
  .content.card-style-glass .card,
  .content.card-style-glass .stat,
  .content.card-style-glass .schedule {
    background: color-mix(in oklab, var(--card-bg) 80%, transparent);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    box-shadow: var(--card-shadow-glass);
  }
  .content.card-style-glass {
    background:
      radial-gradient(800px 400px at 10% -10%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%),
      radial-gradient(700px 500px at 110% 110%, color-mix(in oklab, var(--tint-pink) 18%, transparent), transparent 60%),
      var(--bg-window);
  }
`;
document.head.appendChild(styleEl);

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
