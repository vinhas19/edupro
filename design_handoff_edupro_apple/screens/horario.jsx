/* ─── Horário (timetable) ─── */

function Horario({ role, cardStyle }) {
  const cardCls = `card ${cardStyle}`;
  const N_SLOTS = TIME_SLOTS.length;
  // Build a grid: row 0 = header (days), col 0 = hours.
  // For each subject block, place at (slot+1, day+2)
  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow" style={{color: "var(--tint-red)"}}>Horário</div>
        <h1 className="page-title">Semana de 12 – 16 maio</h1>
        <p className="page-subtitle">12.º TGPSI · A · ano letivo 2025/2026</p>
      </div>

      <div className="row-flex" style={{marginBottom: 16}}>
        <button className="btn"><Icon name="chevron-left" size={12}/></button>
        <button className="btn">Esta semana</button>
        <button className="btn"><Icon name="chevron-right" size={12}/></button>
        <div style={{flex: 1}}/>
        <button className="btn"><Icon name="filter" size={12}/> Filtrar</button>
        <button className="btn primary"><Icon name="plus" size={12}/> Aula</button>
      </div>

      <div className={cardCls} style={{padding: 0}}>
        <div className={`schedule ${cardStyle === "flat" ? "flat" : ""}`} style={{
          boxShadow: "none", borderRadius: "var(--card-radius)",
          gridAutoRows: "56px",
        }}>
          {/* header row */}
          <div style={{gridColumn: 1, gridRow: 1}}/>
          {DAYS.map((d, i) => {
            const dates = ["12", "13", "14", "15", "16"];
            const isToday = i === 3;
            return (
              <div key={d} className="schedule-head" style={{
                gridColumn: i + 2, gridRow: 1,
                color: isToday ? "var(--accent)" : undefined,
              }}>
                <div>{d}</div>
                <div style={{fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2}}>{dates[i]}</div>
              </div>
            );
          })}

          {/* hour labels */}
          {TIME_SLOTS.map((t, slotIdx) => (
            <div key={"h"+t} className="schedule-hour" style={{gridColumn: 1, gridRow: slotIdx + 2}}>{t}</div>
          ))}

          {/* empty cell placeholders for visual rhythm */}
          {TIME_SLOTS.map((_, slotIdx) =>
            DAYS.map((__, dayIdx) => (
              <div key={`bg-${slotIdx}-${dayIdx}`}
                className="schedule-cell"
                style={{
                  gridColumn: dayIdx + 2,
                  gridRow: slotIdx + 2,
                  background: "var(--bg-fill)",
                  opacity: 0.35,
                }}/>
            ))
          )}

          {/* class blocks */}
          {SCHEDULE.map((block, i) => (
            <div
              key={"b"+i}
              className="schedule-slot"
              style={{
                gridColumn: block.day + 2,
                gridRow: `${block.start + 2} / span ${block.dur}`,
                background: block.color,
                boxShadow: "inset 0 -16px 24px -16px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{fontWeight: 600, fontSize: 12, letterSpacing: "-0.005em"}}>{block.sub}</div>
              <div className="slot-sub">{block.teacher}</div>
              <div className="slot-sub" style={{marginTop: "auto"}}>Sala {block.room}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-3" style={{marginTop: 24}}>
        <Stat label="Aulas semana" value="22" icon="calendar" tint="var(--tint-red)" hint="33 h totais"/>
        <Stat label="Disciplinas" value="7" icon="book" tint="var(--tint-purple)" hint="8 professores"/>
        <Stat label="Próxima alteração" value="16 mai" icon="user-x" tint="var(--tint-yellow)" hint="substituição na Matemática"/>
      </div>
    </>
  );
}

window.Horario = Horario;
