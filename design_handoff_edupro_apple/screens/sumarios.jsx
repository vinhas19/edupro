/* ─── Sumários ─── */

function Sumarios({ role }) {
  const [selected, setSelected] = React.useState(0);
  const isTeacher = role !== "STUDENT";

  const LIST = [
    { date: "13 mai", weekday: "Ter", sub: "Programação", turma: "12.º TGPSI A", hours: "08:30 – 10:00", room: "B12",
      summary: "Estruturas de controlo: revisão dos ciclos for, while e do-while. Exercícios práticos de implementação em pseudocódigo e Python. Introdução ao tratamento de listas.",
      status: "registado", presencas: "14/15", color: "var(--tint-indigo)" },
    { date: "13 mai", weekday: "Ter", sub: "Matemática", turma: "12.º TGPSI A", hours: "10:15 – 11:45", room: "B07",
      summary: "Cálculo integral: primitivação por partes. Demonstração e exercícios de aplicação.",
      status: "registado", presencas: "15/15", color: "var(--tint-pink)" },
    { date: "12 mai", weekday: "Seg", sub: "Sist. Operativos", turma: "11.º TGPSI B", hours: "13:30 – 15:00", room: "L01",
      summary: "Gestão de processos e threads em Linux. Comandos ps, top, kill.",
      status: "registado", presencas: "16/18", color: "var(--tint-teal)" },
    { date: "12 mai", weekday: "Seg", sub: "Programação", turma: "12.º TGPSI A", hours: "15:15 – 16:45", room: "B12",
      summary: "",
      status: "por-registar", presencas: "—", color: "var(--tint-indigo)" },
    { date: "10 mai", weekday: "Sex", sub: "Redes Comun.", turma: "11.º TGPSI B", hours: "08:30 – 10:00", room: "L02",
      summary: "Configuração de VLANs e protocolo STP. Práticas com Packet Tracer.",
      status: "registado", presencas: "17/18", color: "var(--tint-cyan)" },
    { date: "10 mai", weekday: "Sex", sub: "Inglês", turma: "12.º TGPSI A", hours: "10:15 – 11:45", room: "A04",
      summary: "Reading comprehension: technology and society. Speaking in pairs.",
      status: "registado", presencas: "14/15", color: "var(--tint-orange)" },
    { date: "09 mai", weekday: "Qui", sub: "Programação", turma: "12.º TGPSI A", hours: "08:30 – 11:00", room: "B12",
      summary: "POO: classes, instâncias, métodos. Exercício prático — Conta Bancária.",
      status: "registado", presencas: "15/15", color: "var(--tint-indigo)" },
  ];

  const cur = LIST[selected];

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow" style={{color: "var(--tint-indigo)"}}>Sumários</div>
        <h1 className="page-title">{isTeacher ? "Sumários registados" : "Sumários das aulas"}</h1>
        <p className="page-subtitle">Maio 2026 · {LIST.length} aulas · {LIST.filter(l => l.status === "registado").length} registadas</p>
      </div>

      <div className="row-flex" style={{marginBottom: 16}}>
        <div className="role-switch">
          <button className="active">Todos</button>
          <button>Por registar</button>
          <button>Registados</button>
        </div>
        <div style={{flex: 1}}/>
        <button className="btn"><Icon name="filter" size={12}/> Turma · Disciplina</button>
        {isTeacher && <button className="btn primary"><Icon name="plus" size={12}/> Novo sumário</button>}
      </div>

      <div style={{display: "grid", gridTemplateColumns: "360px 1fr", gap: 16}}>
        <div className="card" style={{maxHeight: "calc(100vh - 280px)", overflowY: "auto"}}>
          {LIST.map((l, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                background: selected === i ? "var(--accent-soft)" : "transparent",
                border: "none",
                borderBottom: "0.5px solid var(--separator)",
                cursor: "pointer",
              }}
            >
              <div className="between" style={{marginBottom: 4}}>
                <div className="row-flex" style={{gap: 8}}>
                  <div style={{width: 4, height: 14, borderRadius: 2, background: l.color}}/>
                  <span style={{fontSize: 13, fontWeight: 600}}>{l.sub}</span>
                </div>
                {l.status === "registado"
                  ? <Icon name="check" size={12} color="var(--tint-green)" strokeWidth={2.2}/>
                  : <span className="badge orange">Pendente</span>}
              </div>
              <div className="small muted">{l.turma} · {l.hours}</div>
              <div className="small muted mono" style={{marginTop: 4}}>{l.weekday} · {l.date}</div>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-header" style={{padding: "16px 20px", borderBottom: "0.5px solid var(--separator)"}}>
            <div style={{flex: 1}}>
              <div className="row-flex" style={{gap: 8, marginBottom: 4}}>
                <div style={{width: 6, height: 18, borderRadius: 3, background: cur.color}}/>
                <h3 style={{fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: "-0.01em"}}>{cur.sub}</h3>
              </div>
              <div className="small muted">{cur.turma} · {cur.weekday}, {cur.date} · {cur.hours} · Sala {cur.room}</div>
            </div>
            {isTeacher && cur.status === "registado" && <button className="btn">Editar</button>}
            {isTeacher && cur.status === "por-registar" && <button className="btn primary">Registar agora</button>}
          </div>

          <div style={{padding: 20}}>
            <div className="small muted" style={{textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 8}}>Sumário</div>
            {cur.summary ? (
              <p style={{fontSize: 14, lineHeight: 1.55, margin: 0, color: "var(--label)"}}>{cur.summary}</p>
            ) : (
              <div style={{
                padding: 16,
                background: "var(--bg-fill)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--label-secondary)",
                fontStyle: "italic",
                textAlign: "center",
              }}>Sem sumário registado. Esta aula está pendente.</div>
            )}

            <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 24}}>
              <div>
                <div className="small muted" style={{textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em"}}>Presenças</div>
                <div className="mono" style={{fontSize: 20, fontWeight: 700, marginTop: 2, letterSpacing: "-0.02em"}}>{cur.presencas}</div>
              </div>
              <div>
                <div className="small muted" style={{textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em"}}>Lições</div>
                <div className="mono" style={{fontSize: 20, fontWeight: 700, marginTop: 2, letterSpacing: "-0.02em"}}>57 – 58</div>
              </div>
              <div>
                <div className="small muted" style={{textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em"}}>Módulo</div>
                <div style={{fontSize: 14, fontWeight: 600, marginTop: 2}}>M8 · BD</div>
              </div>
              <div>
                <div className="small muted" style={{textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em"}}>Estado</div>
                <div style={{marginTop: 2}}>
                  {cur.status === "registado"
                    ? <span className="badge green">Registado</span>
                    : <span className="badge orange">Por registar</span>}
                </div>
              </div>
            </div>

            <div style={{marginTop: 24}}>
              <div className="small muted" style={{textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 8}}>Anexos · 2</div>
              <div className="row-flex" style={{gap: 8, flexWrap: "wrap"}}>
                {["enunciado-ciclos.pdf", "exemplo-codigo.py"].map((f, i) => (
                  <div key={i} className="row-flex" style={{
                    gap: 8,
                    padding: "6px 10px",
                    background: "var(--bg-fill)",
                    borderRadius: 7,
                    fontSize: 12,
                  }}>
                    <Icon name="folder" size={12} color="var(--label-secondary)"/>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.Sumarios = Sumarios;
