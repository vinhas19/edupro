/* ─── Painel (Dashboard) ─── */

function ProgressRing({ value, size = 56, stroke = 6, color }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="progress-ring" style={{width: size, height: size}}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-fill)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color || "var(--accent)"} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"/>
      </svg>
      <div className="ring-text">{value}%</div>
    </div>
  );
}

function Stat({ label, value, icon, tint, delta, deltaDir, hint }) {
  return (
    <div className="stat">
      <div className="stat-row">
        <span className="stat-icon" style={{background: tint}}>
          <Icon name={icon} size={14} color="white" strokeWidth={2}/>
        </span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {delta != null && (
        <div className={`stat-delta ${deltaDir || ""}`}>
          {deltaDir === "up" && <Icon name="arrow-up" size={11}/>}
          {deltaDir === "down" && <Icon name="arrow-down" size={11}/>}
          <span>{delta}</span>
        </div>
      )}
      {hint && <div className="stat-delta">{hint}</div>}
    </div>
  );
}

function PainelAluno({ onNav }) {
  const completed = 6, total = 9, pct = Math.round((completed/total)*100);
  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Painel · Aluno</div>
        <h1 className="page-title">Olá, Mariana</h1>
        <p className="page-subtitle">Quinta-feira, 15 de maio · 12.º TGPSI · A</p>
      </div>

      <div className="stat-grid">
        <Stat label="Módulos" value={`${completed}/${total}`} icon="chart" tint="var(--tint-pink)" hint="aprovados" />
        <Stat label="Média" value="15,3" icon="trending" tint="var(--tint-blue)" delta="+0,4" deltaDir="up" />
        <Stat label="Faltas" value="3" icon="alert" tint="var(--tint-orange)" hint="últimas 30 aulas" />
        <Stat label="FCT" value="62%" icon="briefcase" tint="var(--tint-teal)" hint="220 / 360 h" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Próximas aulas</h3>
            <button className="card-action" onClick={() => onNav("horario")}>Ver horário</button>
          </div>
          <div className="card-list">
            {[
              { sub: "Programação", room: "B12", time: "08:30 – 10:00", color: "var(--tint-indigo)", state: "agora" },
              { sub: "Matemática", room: "B07", time: "10:15 – 11:45", color: "var(--tint-pink)", state: "a seguir" },
              { sub: "Sist. Operativos", room: "L01", time: "13:30 – 15:00", color: "var(--tint-teal)" },
              { sub: "Inglês", room: "A04", time: "15:15 – 16:45", color: "var(--tint-orange)" },
            ].map((a, i) => (
              <div key={i} className="row">
                <div style={{width: 4, height: 32, borderRadius: 2, background: a.color}}/>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 13, fontWeight: 600}}>{a.sub}</div>
                  <div className="small muted">Sala {a.room} · {a.time}</div>
                </div>
                {a.state === "agora" && <span className="badge green">A decorrer</span>}
                {a.state === "a seguir" && <span className="badge blue">A seguir</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Progresso do curso</h3>
            <button className="card-action" onClick={() => onNav("modulos")}>Ver módulos</button>
          </div>
          <div className="card-body">
            <div style={{display: "flex", alignItems: "center", gap: 16, marginBottom: 16}}>
              <ProgressRing value={pct} color="var(--tint-pink)"/>
              <div>
                <div style={{fontSize: 13, fontWeight: 600}}>{completed} de {total} módulos aprovados</div>
                <div className="small muted">3 módulos a decorrer · média 15,3 / 20</div>
              </div>
            </div>
            {[
              { name: "Programação", val: 75, color: "var(--tint-indigo)" },
              { name: "Matemática", val: 60, color: "var(--tint-pink)" },
              { name: "Sist. Operativos", val: 80, color: "var(--tint-teal)" },
              { name: "Redes Comun.", val: 50, color: "var(--tint-cyan)" },
            ].map((p, i) => (
              <div key={i} style={{marginBottom: 10}}>
                <div className="between" style={{marginBottom: 4}}>
                  <span style={{fontSize: 12, fontWeight: 500}}>{p.name}</span>
                  <span className="small mono muted">{p.val}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{width: `${p.val}%`, background: p.color}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Atalhos</h3>
          </div>
          <div className="quick-grid">
            {QUICK_ACTIONS_STUDENT.map((q, i) => (
              <button key={i} className="quick-action" onClick={() => onNav(q.screen)}>
                <span className="nav-icon-tile" style={{background: q.tint, width: 28, height: 28, borderRadius: 7}}>
                  <Icon name={q.icon} size={14} color="white" strokeWidth={2}/>
                </span>
                <span className="quick-action-label">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Comunicações</h3>
            <button className="card-action">Ver todas</button>
          </div>
          <div className="card-list">
            {NOTIFICATIONS.map((n, i) => (
              <div key={i} className="row" style={{alignItems: "flex-start"}}>
                <span className="nav-icon-tile" style={{background: n.tint, marginTop: 2}}>
                  <Icon name="bell" size={11} color="white" strokeWidth={2}/>
                </span>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 13, fontWeight: 600}}>{n.title}</div>
                  <div className="small muted" style={{marginTop: 2}}>{n.body}</div>
                </div>
                <div className="small muted" style={{whiteSpace: "nowrap"}}>{n.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function PainelProfessor({ onNav, role }) {
  const user = USERS[role];
  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Painel · {user.role}</div>
        <h1 className="page-title">Bem-vinda, {user.name.split(" ").slice(-1)[0]}</h1>
        <p className="page-subtitle">Quinta-feira, 15 de maio · 4 aulas hoje · 2 sumários por registar</p>
      </div>

      <div className="stat-grid">
        <Stat label="Alunos" value="142" icon="users" tint="var(--tint-cyan)" hint="em 6 turmas" />
        <Stat label="Sumários" value="2" icon="clipboard" tint="var(--tint-indigo)" hint="por registar hoje" />
        <Stat label="Presenças" value="93%" icon="check" tint="var(--tint-green)" delta="+1,2 pp" deltaDir="up" />
        <Stat label="Justificações" value="4" icon="alert" tint="var(--tint-orange)" hint="pendentes" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Hoje · 15 maio</h3>
            <button className="card-action" onClick={() => onNav("horario")}>Ver horário</button>
          </div>
          <div className="card-list">
            {[
              { sub: "Programação", t: "12.º TGPSI A", room: "B12", time: "08:30", color: "var(--tint-indigo)", done: true },
              { sub: "Matemática", t: "12.º TGPSI A", room: "B07", time: "10:15", color: "var(--tint-pink)", done: true },
              { sub: "Programação", t: "11.º TGPSI B", room: "L02", time: "13:30", color: "var(--tint-indigo)", done: false, status: "por registar" },
              { sub: "Matemática", t: "11.º TGPSI B", room: "B07", time: "15:15", color: "var(--tint-pink)", done: false, status: "futura" },
            ].map((a, i) => (
              <div key={i} className="row">
                <div style={{width: 4, height: 36, borderRadius: 2, background: a.color}}/>
                <div className="mono" style={{fontSize: 13, fontWeight: 600, width: 54}}>{a.time}</div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 13, fontWeight: 600}}>{a.sub}</div>
                  <div className="small muted">{a.t} · Sala {a.room}</div>
                </div>
                {a.done ? <span className="badge green">Registado</span> :
                  a.status === "por registar" ? <span className="badge orange">Por registar</span> :
                  <span className="badge gray">Próxima</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pendentes</h3>
            <button className="card-action">Resolver tudo</button>
          </div>
          <div className="card-list">
            {[
              { t: "Justificação de falta — Bruno Carvalho", sub: "Programação · 13 mai", color: "var(--tint-orange)", icon: "alert" },
              { t: "Justificação de falta — Inês Jorge", sub: "Matemática · 12 mai", color: "var(--tint-orange)", icon: "alert" },
              { t: "Sumário por registar", sub: "Programação · 11.º TGPSI B · 13:30", color: "var(--tint-indigo)", icon: "clipboard" },
              { t: "Notas em falta — Módulo 6", sub: "Programação · 12.º TGPSI A", color: "var(--tint-pink)", icon: "chart" },
            ].map((p, i) => (
              <div key={i} className="row">
                <span className="nav-icon-tile" style={{background: p.color}}>
                  <Icon name={p.icon} size={11} color="white" strokeWidth={2}/>
                </span>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 13, fontWeight: 600}}>{p.t}</div>
                  <div className="small muted">{p.sub}</div>
                </div>
                <Icon name="chevron-right" size={12} color="var(--label-tertiary)"/>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Atalhos</h3>
          </div>
          <div className="quick-grid">
            {QUICK_ACTIONS_TEACHER.map((q, i) => (
              <button key={i} className="quick-action" onClick={() => onNav(q.screen)}>
                <span className="nav-icon-tile" style={{background: q.tint, width: 28, height: 28, borderRadius: 7}}>
                  <Icon name={q.icon} size={14} color="white" strokeWidth={2}/>
                </span>
                <span className="quick-action-label">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Últimos sumários</h3>
            <button className="card-action" onClick={() => onNav("sumarios")}>Ver tudo</button>
          </div>
          <div className="card-list">
            {LESSONS.slice(0, 4).map((l, i) => (
              <div key={i} className="row" style={{alignItems: "flex-start"}}>
                <div className="mono small muted" style={{width: 48, marginTop: 2}}>{l.date}</div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 13, fontWeight: 600}}>{l.sub} <span className="muted" style={{fontWeight: 400}}>· {l.turma}</span></div>
                  <div className="small muted" style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{l.summary || "—"}</div>
                </div>
                {l.status === "registado"
                  ? <span className="badge green">Registado</span>
                  : <span className="badge orange">Pendente</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function PainelAdmin({ onNav }) {
  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Painel · Administrador</div>
        <h1 className="page-title">Escola Profissional Lisboa</h1>
        <p className="page-subtitle">Ano letivo 2025 / 2026 · 14 cursos ativos · 38 turmas</p>
      </div>

      <div className="stat-grid">
        <Stat label="Alunos" value="412" icon="users" tint="var(--tint-cyan)" delta="+18 vs. ano anterior" deltaDir="up"/>
        <Stat label="Professores" value="64" icon="graduation" tint="var(--tint-orange)"/>
        <Stat label="Turmas" value="38" icon="book" tint="var(--tint-purple)"/>
        <Stat label="Assiduidade" value="91%" icon="check" tint="var(--tint-green)" delta="-0,4 pp" deltaDir="down"/>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Atividade desta semana</h3>
          </div>
          <div className="card-body">
            <div style={{display: "flex", alignItems: "flex-end", gap: 8, height: 140, padding: "8px 0"}}>
              {[62, 78, 84, 70, 88, 40, 12].map((v, i) => (
                <div key={i} style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6}}>
                  <div style={{
                    width: "100%",
                    height: `${v}%`,
                    background: `linear-gradient(180deg, var(--tint-blue), color-mix(in oklab, var(--tint-blue) 70%, white))`,
                    borderRadius: 4,
                  }}/>
                  <div className="small muted">{["S","T","Q","Q","S","S","D"][i]}</div>
                </div>
              ))}
            </div>
            <div className="between" style={{marginTop: 8, paddingTop: 12, borderTop: "0.5px solid var(--separator)"}}>
              <div>
                <div className="small muted">Sumários registados</div>
                <div style={{fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em"}}>284</div>
              </div>
              <div>
                <div className="small muted">Aulas dadas</div>
                <div style={{fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em"}}>312</div>
              </div>
              <div>
                <div className="small muted">Faltas</div>
                <div style={{fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em"}}>196</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cursos · resultados</h3>
            <button className="card-action" onClick={() => onNav("cursos")}>Detalhes</button>
          </div>
          <div className="card-list">
            {[
              { name: "TGPSI", subtitle: "Gestão e Prog. Sist. Inform.", avg: 14.8, color: "var(--tint-indigo)" },
              { name: "TAS", subtitle: "Apoio Social", avg: 15.2, color: "var(--tint-green)" },
              { name: "TGD", subtitle: "Gestão Desportiva", avg: 13.9, color: "var(--tint-red)" },
              { name: "TCV", subtitle: "Comércio Vendas", avg: 14.1, color: "var(--tint-orange)" },
              { name: "TET", subtitle: "Eletrotecnia", avg: 13.4, color: "var(--tint-yellow)" },
            ].map((c, i) => (
              <div key={i} className="row">
                <div style={{width: 4, height: 28, borderRadius: 2, background: c.color}}/>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 13, fontWeight: 600}}>{c.name}</div>
                  <div className="small muted">{c.subtitle}</div>
                </div>
                <div className="mono" style={{fontSize: 14, fontWeight: 600}}>{c.avg.toFixed(1)}</div>
                <div className="small muted">/20</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Atalhos administrativos</h3>
          </div>
          <div className="quick-grid">
            {[
              { label: "Novo utilizador", icon: "plus", tint: "var(--tint-cyan)", screen: "utilizadores" },
              { label: "Definições", icon: "settings", tint: "var(--tint-gray)", screen: "definicoes" },
              { label: "Substituições", icon: "user-x", tint: "var(--tint-yellow)", screen: "substituicoes" },
              { label: "Relatórios", icon: "chart", tint: "var(--tint-pink)", screen: "modulos" },
            ].map((q, i) => (
              <button key={i} className="quick-action" onClick={() => onNav(q.screen)}>
                <span className="nav-icon-tile" style={{background: q.tint, width: 28, height: 28, borderRadius: 7}}>
                  <Icon name={q.icon} size={14} color="white" strokeWidth={2}/>
                </span>
                <span className="quick-action-label">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Alertas</h3>
          </div>
          <div className="card-list">
            {[
              { t: "3 sumários por registar há +48h", sub: "Programação, Inglês, Português", tint: "var(--tint-orange)", icon: "alert" },
              { t: "Substituição por confirmar", sub: "Prof. R. Cruz · 16 mai · 13:30", tint: "var(--tint-yellow)", icon: "user-x" },
              { t: "12 PAP em fase final", sub: "Entregas até 30 de maio", tint: "var(--tint-brown)", icon: "award" },
              { t: "Backup concluído", sub: "Hoje às 03:00 · 4,2 GB", tint: "var(--tint-green)", icon: "check" },
            ].map((a, i) => (
              <div key={i} className="row">
                <span className="nav-icon-tile" style={{background: a.tint}}>
                  <Icon name={a.icon} size={11} color="white" strokeWidth={2}/>
                </span>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 13, fontWeight: 600}}>{a.t}</div>
                  <div className="small muted">{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Painel({ role, onNav }) {
  if (role === "STUDENT") return <PainelAluno onNav={onNav}/>;
  if (role === "SCHOOL_ADMIN") return <PainelAdmin onNav={onNav}/>;
  return <PainelProfessor role={role} onNav={onNav}/>;
}

window.Painel = Painel;
window.ProgressRing = ProgressRing;
window.Stat = Stat;
