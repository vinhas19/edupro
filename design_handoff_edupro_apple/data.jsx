/* ─── Mock data for EduPro prototype ─── */

const NAV_SECTIONS = [
  {
    label: "Geral",
    items: [
      { id: "painel", label: "Painel", icon: "grid", tint: "var(--tint-blue)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "horario", label: "Horário", icon: "calendar", tint: "var(--tint-red)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "calendario", label: "Calendário", icon: "calendar-days", tint: "var(--tint-orange)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "mensagens", label: "Mensagens", icon: "message", tint: "var(--tint-green)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"], badge: 3 },
      { id: "comunicacoes", label: "Comunicações", icon: "bell", tint: "var(--tint-yellow)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"], badge: 5 },
    ],
  },
  {
    label: "Ensino",
    items: [
      { id: "sumarios", label: "Sumários", icon: "clipboard", tint: "var(--tint-indigo)", roles: ["TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "assiduidade", label: "Assiduidade", icon: "check", tint: "var(--tint-green)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "modulos", label: "Notas & Módulos", icon: "chart", tint: "var(--tint-pink)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "disciplinas", label: "Disciplinas", icon: "book", tint: "var(--tint-purple)", roles: ["TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "cursos", label: "Cursos & Turmas", icon: "graduation", tint: "var(--tint-orange)", roles: ["TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
    ],
  },
  {
    label: "Profissional",
    items: [
      { id: "fct", label: "FCT", icon: "briefcase", tint: "var(--tint-teal)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "pap", label: "PAP", icon: "award", tint: "var(--tint-brown)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "documentos", label: "Documentos", icon: "folder", tint: "var(--tint-gray)", roles: ["STUDENT","TEACHER","CLASS_DIRECTOR","SCHOOL_ADMIN"] },
    ],
  },
  {
    label: "Administração",
    items: [
      { id: "substituicoes", label: "Substituições", icon: "user-x", tint: "var(--tint-yellow)", roles: ["CLASS_DIRECTOR","SCHOOL_ADMIN"] },
      { id: "utilizadores", label: "Utilizadores", icon: "users", tint: "var(--tint-cyan)", roles: ["SCHOOL_ADMIN"] },
      { id: "definicoes", label: "Definições", icon: "settings", tint: "var(--tint-gray)", roles: ["SCHOOL_ADMIN"] },
    ],
  },
];

const ROLE_LABELS = {
  STUDENT: "Aluno",
  TEACHER: "Professor",
  CLASS_DIRECTOR: "Diretor de Turma",
  SCHOOL_ADMIN: "Administrador",
};

const USERS = {
  STUDENT: { name: "Mariana Costa", role: "Aluno", turma: "12.º TGPSI · A", initials: "MC", color: "var(--tint-pink)" },
  TEACHER: { name: "Prof. João Almeida", role: "Professor", turma: "Matemática", initials: "JA", color: "var(--tint-indigo)" },
  CLASS_DIRECTOR: { name: "Prof.ª Sofia Reis", role: "Diretor de Turma", turma: "12.º TGPSI · A", initials: "SR", color: "var(--tint-orange)" },
  SCHOOL_ADMIN: { name: "Dr. Henrique Faria", role: "Administrador", turma: "Escola Profissional Lisboa", initials: "HF", color: "var(--tint-teal)" },
};

const STUDENTS = [
  { num: 1, name: "Ana Beatriz Soares", initials: "AB", color: "var(--tint-pink)" },
  { num: 2, name: "Bruno Carvalho", initials: "BC", color: "var(--tint-blue)" },
  { num: 3, name: "Catarina Dias", initials: "CD", color: "var(--tint-purple)" },
  { num: 4, name: "Diogo Esteves", initials: "DE", color: "var(--tint-orange)" },
  { num: 5, name: "Eduarda Fernandes", initials: "EF", color: "var(--tint-green)" },
  { num: 6, name: "Filipe Gomes", initials: "FG", color: "var(--tint-teal)" },
  { num: 7, name: "Gabriela Henriques", initials: "GH", color: "var(--tint-red)" },
  { num: 8, name: "Hugo Inácio", initials: "HI", color: "var(--tint-indigo)" },
  { num: 9, name: "Inês Jorge", initials: "IJ", color: "var(--tint-cyan)" },
  { num: 10, name: "João Lopes", initials: "JL", color: "var(--tint-brown)" },
  { num: 11, name: "Leonor Martins", initials: "LM", color: "var(--tint-purple)" },
  { num: 12, name: "Miguel Nunes", initials: "MN", color: "var(--tint-pink)" },
  { num: 13, name: "Nadia Oliveira", initials: "NO", color: "var(--tint-yellow)" },
  { num: 14, name: "Pedro Pinto", initials: "PP", color: "var(--tint-green)" },
  { num: 15, name: "Rita Queirós", initials: "RQ", color: "var(--tint-red)" },
];

const SCHEDULE = [
  // [day 0..4, startSlot, durationSlots, subject, room, teacher, color]
  { day: 0, start: 0, dur: 2, sub: "Programação", room: "B12", teacher: "Prof. J. Almeida", color: "var(--tint-indigo)" },
  { day: 0, start: 3, dur: 2, sub: "Inglês", room: "A04", teacher: "Prof.ª M. Pires", color: "var(--tint-orange)" },
  { day: 1, start: 0, dur: 2, sub: "Matemática", room: "B07", teacher: "Prof. J. Almeida", color: "var(--tint-pink)" },
  { day: 1, start: 2, dur: 2, sub: "Sist. Operativos", room: "L01", teacher: "Prof. R. Cruz", color: "var(--tint-teal)" },
  { day: 2, start: 0, dur: 1, sub: "Português", room: "A02", teacher: "Prof.ª S. Reis", color: "var(--tint-red)" },
  { day: 2, start: 1, dur: 2, sub: "Redes Comun.", room: "L02", teacher: "Prof. R. Cruz", color: "var(--tint-cyan)" },
  { day: 2, start: 4, dur: 2, sub: "Ed. Física", room: "Pavilhão", teacher: "Prof. T. Lobo", color: "var(--tint-green)" },
  { day: 3, start: 0, dur: 3, sub: "Programação", room: "B12", teacher: "Prof. J. Almeida", color: "var(--tint-indigo)" },
  { day: 3, start: 4, dur: 2, sub: "Área Integ.", room: "A07", teacher: "Prof.ª S. Reis", color: "var(--tint-purple)" },
  { day: 4, start: 0, dur: 2, sub: "Matemática", room: "B07", teacher: "Prof. J. Almeida", color: "var(--tint-pink)" },
  { day: 4, start: 2, dur: 2, sub: "Inglês", room: "A04", teacher: "Prof.ª M. Pires", color: "var(--tint-orange)" },
];

const LESSONS = [
  { date: "13 mai", sub: "Programação", turma: "12.º TGPSI A", hours: "08:30 – 10:00", summary: "Estruturas de controlo: ciclos for, while e do-while. Exercícios práticos.", status: "registado" },
  { date: "13 mai", sub: "Matemática", turma: "12.º TGPSI A", hours: "10:15 – 11:45", summary: "Cálculo integral: primitivação por partes.", status: "registado" },
  { date: "12 mai", sub: "Sist. Operativos", turma: "11.º TGPSI B", hours: "13:30 – 15:00", summary: "Gestão de processos e threads em Linux.", status: "registado" },
  { date: "12 mai", sub: "Programação", turma: "12.º TGPSI A", hours: "15:15 – 16:45", summary: "", status: "por-registar" },
  { date: "10 mai", sub: "Redes Comun.", turma: "11.º TGPSI B", hours: "08:30 – 10:00", summary: "Configuração de VLANs e protocolo STP.", status: "registado" },
];

const MODULES = [
  { sub: "Programação", num: 6, name: "POO Avançada", grade: 17, status: "APPROVED" },
  { sub: "Programação", num: 7, name: "Estruturas de Dados", grade: 15, status: "APPROVED" },
  { sub: "Programação", num: 8, name: "Bases de Dados", grade: null, status: "IN_PROGRESS" },
  { sub: "Matemática", num: 5, name: "Cálculo Diferencial", grade: 14, status: "APPROVED" },
  { sub: "Matemática", num: 6, name: "Cálculo Integral", grade: null, status: "IN_PROGRESS" },
  { sub: "Sist. Operativos", num: 3, name: "Linux Avançado", grade: 11, status: "RECURSO" },
  { sub: "Redes", num: 4, name: "Routing e Switching", grade: 16, status: "APPROVED" },
  { sub: "Inglês", num: 5, name: "Business English", grade: 13, status: "APPROVED" },
  { sub: "Português", num: 4, name: "Texto Argumentativo", grade: null, status: "NOT_STARTED" },
];

const MODULE_STATUS = {
  NOT_STARTED: { label: "Não iniciado", color: "gray" },
  IN_PROGRESS: { label: "Em curso", color: "blue" },
  COMPLETED: { label: "Concluído", color: "green" },
  RECURSO: { label: "Em recurso", color: "yellow" },
  SPECIAL_EPOCH: { label: "Época especial", color: "orange" },
  APPROVED: { label: "Aprovado", color: "green" },
  FAILED: { label: "Reprovado", color: "red" },
};

const NOTIFICATIONS = [
  { title: "Falta justificada — aprovada", body: "A sua justificação de 08/mai foi aprovada pela Prof.ª Sofia Reis.", time: "há 2 h", tint: "var(--tint-green)" },
  { title: "Novo módulo disponível", body: "Bases de Dados — entrega prevista a 23 de maio.", time: "ontem", tint: "var(--tint-blue)" },
  { title: "Reunião de turma", body: "Sala A07, dia 16 de maio às 14:30.", time: "há 2 dias", tint: "var(--tint-orange)" },
  { title: "Documento por entregar", body: "Termo de responsabilidade FCT em falta.", time: "há 3 dias", tint: "var(--tint-red)" },
];

const QUICK_ACTIONS_TEACHER = [
  { label: "Registar sumário", icon: "clipboard", tint: "var(--tint-indigo)", screen: "sumarios" },
  { label: "Marcar presenças", icon: "check", tint: "var(--tint-green)", screen: "assiduidade" },
  { label: "Ver horário", icon: "calendar", tint: "var(--tint-red)", screen: "horario" },
  { label: "Lançar notas", icon: "chart", tint: "var(--tint-pink)", screen: "modulos" },
];

const QUICK_ACTIONS_STUDENT = [
  { label: "Ver horário", icon: "calendar", tint: "var(--tint-red)", screen: "horario" },
  { label: "Justificar falta", icon: "check", tint: "var(--tint-green)", screen: "assiduidade" },
  { label: "Notas & Módulos", icon: "chart", tint: "var(--tint-pink)", screen: "modulos" },
  { label: "Mensagens", icon: "message", tint: "var(--tint-green)", screen: "mensagens" },
];

const TIME_SLOTS = ["08:30", "09:30", "10:30", "11:30", "12:30", "14:30", "15:30", "16:30"];
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

Object.assign(window, {
  NAV_SECTIONS, ROLE_LABELS, USERS, STUDENTS, SCHEDULE, LESSONS,
  MODULES, MODULE_STATUS, NOTIFICATIONS, QUICK_ACTIONS_TEACHER,
  QUICK_ACTIONS_STUDENT, TIME_SLOTS, DAYS,
});
