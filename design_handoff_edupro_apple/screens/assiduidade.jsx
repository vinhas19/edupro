/* ─── Assiduidade (attendance marking) ─── */

function Assiduidade({ role }) {
  const isStudent = role === "STUDENT";
  if (isStudent) return <AssiduidadeAluno/>;
  return <AssiduidadeProfessor/>;
}

function AssiduidadeProfessor() {
  const [marks, setMarks] = React.useState(() => {
    const m = {};
    STUDENTS.forEach((s, i) => {
      // pre-fill some
      if (i === 1) m[s.num] = "A";
      else if (i === 5) m[s.num] = "L";
      else if (i === 11) m[s.num] = "J";
      else m[s.num] = "P";
    });
    return m;
  });

  const counts = { P: 0, A: 0, L: 0, J: 0 };
  Object.values(marks).forEach(v => counts[v] = (counts[v] || 0) + 1);
  const total = STUDENTS.length;
  const presencePct = Math.round((counts.P / total) * 100);

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow" style={{color: "var(--tint-green)"}}>Assiduidade · Professor</div>
        <h1 className="page-title">Marcar presenças</h1>
        <p className="page-subtitle">Programação · 12.º TGPSI A · Hoje, 08:30 – 10:00 · Sala B12</p>
      </div>

      <div className="row-flex" style={{marginBottom: 16}}>
        <button className="btn"><Icon name="chevron-left" size={12}/></button>
        <button className="btn"><Icon name="calendar" size={12}/> 15 maio</button>
        <button className="btn"><Icon name="chevron-right" size={12}/></button>
        <div style={{flex: 1}}/>
        <button className="btn" onClick={() => {
          const all = {};
          STUDENTS.forEach(s => all[s.num] = "P");
          setMarks(all);
        }}>Marcar todos presentes</button>
        <button className="btn primary"><Icon name="check" size={12}/> Concluir aula</button>
      </div>

      <div className="grid-2" style={{marginBottom: 16}}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Resumo da aula</h3>
            <span className="badge gray mono">{counts.P + counts.J} / {total}</span>
          </div>
          <div className="card-body">
            <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12}}>
              <div>
                <div className="small muted">Presentes</div>
                <div style={{fontSize: 24, fontWeight: 700, color: "var(--tint-green)", letterSpacing: "-0.02em"}}>{counts.P}</div>
              </div>
              <div>
                <div className="small muted">Faltas</div>
                <div style={{fontSize: 24, fontWeight: 700, color: "var(--tint-red)", letterSpacing: "-0.02em"}}>{counts.A}</div>
              </div>
              <div>
                <div className="small muted">Atrasos</div>
                <div style={{fontSize: 24, fontWeight: 700, color: "var(--tint-orange)", letterSpacing: "-0.02em"}}>{counts.L}</div>
              </div>
              <div>
                <div className="small muted">Justificadas</div>
                <div style={{fontSize: 24, fontWeight: 700, color: "var(--tint-blue)", letterSpacing: "-0.02em"}}>{counts.J}</div>
              </div>
            </div>
            <div className="progress-track" style={{marginTop: 12}}>
              <div className="progress-fill" style={{width: `${presencePct}%`, background: "var(--tint-green)"}}/>
            </div>
            <div className="small muted" style={{marginTop: 6}}>{presencePct}% de presenças efetivas</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sumário</h3>
            <button className="card-action">Modelos</button>
          </div>
          <div className="card-body">
            <textarea
              defaultValue="Estruturas de controlo: revisão dos ciclos for, while e do-while. Exercícios práticos de implementação em pseudocódigo e Python."
              style={{
                width: "100%",
                minHeight: 88,
                background: "var(--bg-fill)",
                border: "none",
                outline: "none",
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
                resize: "vertical",
                fontFamily: "inherit",
                color: "var(--label)",
                lineHeight: 1.45,
              }}
            />
            <div className="row-flex" style={{marginTop: 8}}>
              <button className="btn"><Icon name="plus" size={12}/> Anexar</button>
              <button className="btn"><Icon name="sparkle" size={12}/> Gerar com IA</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Alunos · {total}</h3>
          <div className="row-flex">
            <span className="badge gray">12.º TGPSI A</span>
          </div>
        </div>
        <div style={{padding: "0 4px 8px"}}>
          {STUDENTS.map(s => (
            <div key={s.num} className="att-row">
              <div className="row-flex" style={{gap: 10, minWidth: 0}}>
                <div className="att-num" style={{minWidth: 18}}>{s.num}</div>
                <div className="avatar" style={{background: s.color, width: 26, height: 26, fontSize: 10}}>{s.initials}</div>
              </div>
              <div className="att-name" style={{minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{s.name}</div>
              <div className="att-toggles">
                {[
                  ["P", "Presente", "p"],
                  ["A", "Falta", "a"],
                  ["L", "Atraso", "l"],
                  ["J", "Justif.", "j"],
                ].map(([k, lbl, cls]) => (
                  <button
                    key={k}
                    className={`${marks[s.num] === k ? `active ${cls}` : ""}`}
                    onClick={() => setMarks({...marks, [s.num]: k})}
                    title={lbl}
                  >{lbl}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AssiduidadeAluno() {
  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow" style={{color: "var(--tint-green)"}}>Assiduidade · Aluno</div>
        <h1 className="page-title">A minha assiduidade</h1>
        <p className="page-subtitle">Período letivo atual · até 15 de maio</p>
      </div>

      <div className="stat-grid">
        <Stat label="Presenças" value="96%" icon="check" tint="var(--tint-green)" delta="+0,8 pp" deltaDir="up"/>
        <Stat label="Faltas" value="3" icon="alert" tint="var(--tint-red)" hint="2 por justificar"/>
        <Stat label="Atrasos" value="2" icon="circle" tint="var(--tint-orange)"/>
        <Stat label="Justificadas" value="1" icon="check" tint="var(--tint-blue)"/>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Registo recente</h3>
            <button className="card-action">Ver tudo</button>
          </div>
          <div className="card-list">
            {[
              { date: "13 mai", sub: "Programação", time: "08:30", status: "P" },
              { date: "13 mai", sub: "Matemática", time: "10:15", status: "P" },
              { date: "12 mai", sub: "Sist. Operativos", time: "13:30", status: "A", warn: true },
              { date: "12 mai", sub: "Programação", time: "15:15", status: "P" },
              { date: "10 mai", sub: "Redes", time: "08:30", status: "L" },
              { date: "08 mai", sub: "Inglês", time: "10:15", status: "J" },
            ].map((r, i) => (
              <div key={i} className="row">
                <div className="mono small muted" style={{width: 48}}>{r.date}</div>
                <div className="mono small muted" style={{width: 44}}>{r.time}</div>
                <div style={{flex: 1, fontSize: 13, fontWeight: 500}}>{r.sub}</div>
                {r.status === "P" && <span className="badge green">Presente</span>}
                {r.status === "A" && <span className="badge red">Falta</span>}
                {r.status === "L" && <span className="badge orange">Atraso</span>}
                {r.status === "J" && <span className="badge blue">Justificada</span>}
                {r.warn && <button className="btn">Justificar</button>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Faltas por disciplina</h3>
          </div>
          <div className="card-body">
            {[
              { sub: "Programação", val: 1, lim: 18, color: "var(--tint-indigo)" },
              { sub: "Matemática", val: 0, lim: 12, color: "var(--tint-pink)" },
              { sub: "Sist. Operativos", val: 2, lim: 12, color: "var(--tint-teal)" },
              { sub: "Redes Comun.", val: 0, lim: 10, color: "var(--tint-cyan)" },
              { sub: "Inglês", val: 1, lim: 8, color: "var(--tint-orange)" },
              { sub: "Português", val: 1, lim: 6, color: "var(--tint-red)" },
              { sub: "Ed. Física", val: 0, lim: 6, color: "var(--tint-green)" },
            ].map((d, i) => {
              const pct = Math.min((d.val / d.lim) * 100, 100);
              return (
                <div key={i} style={{marginBottom: 10}}>
                  <div className="between" style={{marginBottom: 4}}>
                    <span style={{fontSize: 12, fontWeight: 500}}>{d.sub}</span>
                    <span className="small mono muted">{d.val} / {d.lim}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{width: `${pct}%`, background: d.color}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

window.Assiduidade = Assiduidade;
