/* ─── Sidebar + Topbar shells ─── */

function Sidebar({ activeId, onNav, role, sidebarStyle }) {
  const sections = NAV_SECTIONS.map(sec => ({
    ...sec,
    items: sec.items.filter(it => it.roles.includes(role)),
  })).filter(s => s.items.length > 0);

  const user = USERS[role];
  const styleClass = sidebarStyle === "icons" ? "icons-only" : sidebarStyle === "floating" ? "style-floating" : "";

  return (
    <aside className={`sidebar ${styleClass}`}>
      <div className="sidebar-traffic">
        <span className="traffic-light red"></span>
        <span className="traffic-light yellow"></span>
        <span className="traffic-light green"></span>
      </div>

      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <Icon name="graduation" size={16} color="white" strokeWidth={1.8} />
        </div>
        <div style={{minWidth: 0}}>
          <div className="sidebar-brand-name">EduPro</div>
          <div className="sidebar-brand-school">Esc. Prof. Lisboa</div>
        </div>
      </div>

      {sidebarStyle !== "icons" && (
        <div className="sidebar-search">
          <Icon name="search" size={12} color="var(--label-tertiary)" />
          <input placeholder="Procurar…" />
        </div>
      )}

      <nav className="sidebar-nav">
        {sections.map(sec => (
          <div key={sec.label}>
            <div className="sidebar-section-label">{sec.label}</div>
            {sec.items.map(it => (
              <button
                key={it.id}
                onClick={() => onNav(it.id)}
                className={`nav-item ${activeId === it.id ? "active" : ""}`}
                title={it.label}
              >
                <span className="nav-icon-tile" style={{background: it.tint}}>
                  <Icon name={it.icon} size={11} color="white" strokeWidth={2} />
                </span>
                <span className="nav-label">{it.label}</span>
                {it.badge ? <span className="nav-badge">{it.badge}</span> : null}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar" style={{background: user.color}}>{user.initials}</div>
          {sidebarStyle !== "icons" && (
            <div style={{minWidth: 0, flex: 1}}>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          )}
          {sidebarStyle !== "icons" && (
            <Icon name="chevron-right" size={12} color="var(--label-tertiary)" />
          )}
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, role, onRole, onBack, actions }) {
  return (
    <div className="topbar">
      {onBack && (
        <button className="topbar-back" onClick={onBack} title="Anterior">
          <Icon name="chevron-left" size={16} />
        </button>
      )}
      <div className="topbar-title">{title}</div>
      <div className="topbar-spacer" />

      <div className="role-switch" title="Trocar perfil (demo)">
        {["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"].map(r => (
          <button
            key={r}
            className={role === r ? "active" : ""}
            onClick={() => onRole(r)}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {actions}
    </div>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
