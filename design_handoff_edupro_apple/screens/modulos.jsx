/* ─── Notas & Módulos ─── */

function Modulos({ role }) {
  const isStudent = role === "STUDENT";
  if (isStudent) return <ModulosAluno/>;
  return <ModulosProfessor/>;
}

function ModulosAluno() {
  const bySubject = {};
  MODULES.forEach(m => {
    bySubject[m.sub] = bySubject[m.sub] || [];
    bySubject[m.sub].push(m);
  });

  const subColors = {
    "Programação": "var(--tint-indigo)",
    "Matemática": "var(--tint-pink)",
    "Sist. Operativos": "var(--tint-teal)",
    "Redes": "var(--tint-cyan)",
    "Inglês": "var(--tint-orange)",
    "Português": "var(--tint-red)",
  };

  const approved = MODULES.filter(m => m.status === "APPROVED").length;
  const grades = MODULES.filter(m => m.grade != null).map(m => m.grade);
  const avg = (grades.reduce((a,b)=>a+b, 0) / grades.length).toFixed(1);

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow" style={{color: "var(--tint-pink)"}}>Notas &amp; Módulos</div>
        <h1 className="page-title">A minha progressão</h1>
        <p className="page-subtitle">12.º TGPSI · A · 9 módulos no plano</p>
      </div>

      <div className="stat-grid">
        <Stat label="Média" value={avg} icon="trending" tint="var(--tint-pink)" delta="+0,3" deltaDir="up"/>
        <Stat label="Aprovados" value={`${approved}`} icon="check" tint="var(--tint-green)" hint={`de ${MODULES.length} módulos`}/>
        <Stat label="Em curso" value="2" icon="play" tint="var(--tint-blue)"/>
        <Stat label="Em recurso" value="1" icon="alert" tint="var(--tint-yellow)"/>
      </div>

      <div className="stack">
        {Object.entries(bySubject).map(([sub, mods]) => {
          const subApproved = mods.filter(m => m.status === "APPROVED").length;
          const color = subColors[sub] || "var(--tint-gray)";
          return (
            <div key={sub} className="card">
              <div className="card-header" style={{padding: "14px 18px"}}>
                <div className="row-flex" style={{gap: 10, flex: 1}}>
                  <span className="nav-icon-tile" style={{background: color, width: 28, height: 28, borderRadius: 7}}>
                    <Icon name="book" size={14} color="white" strokeWidth={2}/>
                  </span>
                  <div>
                    <div style={{fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em"}}>{sub}</div>
                    <div className="small muted">{subApproved} de {mods.length} módulos aprovados</div>
                  </div>
                </div>
                <div className="row-flex" style={{gap: 12}}>
                  <ProgressRing value={Math.round((subApproved/mods.length)*100)} size={40} stroke={4} color={color}/>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{width: 70}}>Módulo</th>
                    <th>Designação</th>
                    <th style={{width: 130}}>Estado</th>
                    <th style={{width: 80, textAlign: "right"}}>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {mods.map((m, i) => {
                    const st = MODULE_STATUS[m.status];
                    return (
                      <tr key={i}>
                        <td className="mono muted">M{m.num}</td>
                        <td style={{fontWeight: 500}}>{m.name}</td>
                        <td><span className={`badge ${st.color}`}>{st.label}</span></td>
                        <td className="mono" style={{textAlign: "right", fontWeight: 600, fontSize: 14}}>
                          {m.grade != null ? `${m.grade}` : <span className="muted">—</span>}
                          {m.grade != null && <span className="muted" style={{fontWeight: 400}}>/20</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ModulosProfessor() {
  const TURMA = [
    { num: 1, name: "Ana Beatriz Soares", initials: "AB", color: "var(--tint-pink)",
      mods: [17, 15, null, 14, null, 11, 16, 13, null] },
    { num: 2, name: "Bruno Carvalho", initials: "BC", color: "var(--tint-blue)",
      mods: [14, 12, null, 13, null, 9, 13, 14, null] },
    { num: 3, name: "Catarina Dias", initials: "CD", color: "var(--tint-purple)",
      mods: [18, 17, null, 18, null, 14, 17, 16, null] },
    { num: 4, name: "Diogo Esteves", initials: "DE", color: "var(--tint-orange)",
      mods: [13, 14, null, 11, null, 10, 12, 13, null] },
    { num: 5, name: "Eduarda Fernandes", initials: "EF", color: "var(--tint-green)",
      mods: [16, 15, null, 16, null, 13, 15, 14, null] },
    { num: 6, name: "Filipe Gomes", initials: "FG", color: "var(--tint-teal)",
      mods: [12, 13, null, 12, null, 8, 12, 12, null] },
    { num: 7, name: "Gabriela Henriques", initials: "GH", color: "var(--tint-red)",
      mods: [19, 18, null, 17, null, 15, 18, 17, null] },
    { num: 8, name: "Hugo Inácio", initials: "HI", color: "var(--tint-indigo)",
      mods: [15, 14, null, 13, null, 12, 14, 13, null] },
  ];

  const colorFor = (g) => {
    if (g == null) return "var(--label-tertiary)";
    if (g < 10) return "var(--tint-red)";
    if (g < 14) return "var(--tint-orange)";
    if (g < 17) return "var(--tint-blue)";
    return "var(--tint-green)";
  };

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow" style={{color: "var(--tint-pink)"}}>Notas &amp; Módulos · Professor</div>
        <h1 className="page-title">Programação · 12.º TGPSI A</h1>
        <p className="page-subtitle">15 alunos · 9 módulos · média da turma 14,2</p>
      </div>

      <div className="row-flex" style={{marginBottom: 16}}>
        <button className="btn"><Icon name="book" size={12}/> Disciplina</button>
        <button className="btn"><Icon name="graduation" size={12}/> Turma</button>
        <div style={{flex: 1}}/>
        <button className="btn"><Icon name="filter" size={12}/> Filtrar</button>
        <button className="btn primary"><Icon name="plus" size={12}/> Lançar notas</button>
      </div>

      <div className="card" style={{overflow: "auto"}}>
        <table className="table">
          <thead>
            <tr>
              <th style={{width: 220}}>Aluno</th>
              {MODULES.slice(0, 9).map((m, i) => (
                <th key={i} className="mono" style={{textAlign: "center", width: 56}} title={m.name}>M{i+1}</th>
              ))}
              <th className="mono" style={{textAlign: "right", width: 70}}>Média</th>
            </tr>
          </thead>
          <tbody>
            {TURMA.map(s => {
              const got = s.mods.filter(x => x != null);
              const avg = got.length ? (got.reduce((a,b)=>a+b,0)/got.length).toFixed(1) : "—";
              return (
                <tr key={s.num}>
                  <td>
                    <div className="row-flex" style={{gap: 10}}>
                      <span className="att-num">{String(s.num).padStart(2,"0")}</span>
                      <div className="avatar" style={{background: s.color, width: 26, height: 26, fontSize: 10}}>{s.initials}</div>
                      <span style={{fontWeight: 500}}>{s.name}</span>
                    </div>
                  </td>
                  {s.mods.map((g, i) => (
                    <td key={i} className="mono" style={{textAlign: "center", color: colorFor(g), fontWeight: 600}}>
                      {g != null ? g : <span style={{color: "var(--label-quaternary)"}}>·</span>}
                    </td>
                  ))}
                  <td className="mono" style={{textAlign: "right", fontWeight: 700, fontSize: 14}}>{avg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid-3" style={{marginTop: 24}}>
        <Stat label="Média da turma" value="14,2" icon="trending" tint="var(--tint-pink)" delta="+0,3" deltaDir="up"/>
        <Stat label="Taxa de aprovação" value="86%" icon="check" tint="var(--tint-green)" hint="módulos concluídos"/>
        <Stat label="Alunos em risco" value="2" icon="alert" tint="var(--tint-orange)" hint="média < 10"/>
      </div>
    </>
  );
}

window.Modulos = Modulos;
