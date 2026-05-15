/* ─── Placeholder for un-built screens (still feels designed) ─── */

function Placeholder({ id, role }) {
  const item = NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === id) || {};
  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow" style={{color: item.tint}}>{item.label || "Página"}</div>
        <h1 className="page-title">{item.label}</h1>
        <p className="page-subtitle">Esta área está em pré-visualização. As 5 áreas principais — Painel, Horário, Assiduidade, Sumários e Notas — estão totalmente desenhadas.</p>
      </div>

      <div className="card" style={{padding: 48, textAlign: "center"}}>
        <div className="nav-icon-tile" style={{
          background: item.tint || "var(--tint-gray)",
          width: 56, height: 56, borderRadius: 14,
          margin: "0 auto 16px",
        }}>
          <Icon name={item.icon || "dot"} size={28} color="white" strokeWidth={1.8}/>
        </div>
        <h2 style={{fontSize: 20, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 6px"}}>{item.label}</h2>
        <p className="muted" style={{fontSize: 14, margin: "0 0 16px", maxWidth: 380, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5}}>
          {DESCRIPTIONS[id] || "Esta secção segue a mesma linguagem visual do resto do produto."}
        </p>
        <div className="row-flex" style={{justifyContent: "center"}}>
          <button className="btn primary"><Icon name="plus" size={12}/> Começar</button>
          <button className="btn">Saber mais</button>
        </div>
      </div>
    </>
  );
}

const DESCRIPTIONS = {
  calendario: "Calendário escolar: feriados, períodos letivos, interrupções e eventos pedagógicos.",
  mensagens: "Conversas diretas e em grupo entre alunos, professores e encarregados de educação.",
  comunicacoes: "Comunicados institucionais da escola, do diretor de turma e do conselho pedagógico.",
  disciplinas: "Gestão das disciplinas, planos curriculares e atribuições aos professores.",
  cursos: "Cursos profissionais, turmas, anos letivos e matrículas.",
  fct: "Formação em Contexto de Trabalho: protocolos, horas, avaliação e relatórios.",
  pap: "Prova de Aptidão Profissional: orientação, fases, defesa e classificação.",
  documentos: "Repositório de documentos da escola, da turma e do aluno.",
  substituicoes: "Ausências, substituições e troca de aulas entre professores.",
  utilizadores: "Gestão de utilizadores, perfis e permissões.",
  definicoes: "Definições da escola, integrações e personalização.",
};

window.Placeholder = Placeholder;
