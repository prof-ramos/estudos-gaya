/** Tipos do edital e do progresso de estudos. */

/** Nó cru do edital.json (tópico ou subtópico, recursivo). */
export interface EditalNode {
  numero: string;
  texto: string;
  subtopicos: EditalNode[];
}

export interface EditalDisciplina {
  nome: string;
  topicos: EditalNode[];
}

export interface EditalSecao {
  nome: string;
  disciplinas: EditalDisciplina[];
}

export interface Edital {
  concurso: string;
  cargo: string;
  secoes: EditalSecao[];
}

/** Situação de estudo de um item do edital. */
export type StudyStatus =
  | 'nao_iniciado'
  | 'estudando'
  | 'revisar'
  | 'dominado';

/** Item do edital já achatado, com ids estáveis e contexto. */
export interface TopicoFlat {
  /** Id estável derivado de seção + disciplina + numeração. */
  id: string;
  numero: string;
  texto: string;
  /** 1 = tópico, 2 = subtópico, 3 = sub-subtópico... */
  nivel: number;
  parentId: string | null;
  secao: string;
  secaoId: string;
  disciplina: string;
  disciplinaId: string;
  /** Caminho de textos dos ancestrais, do mais externo ao pai direto. */
  ancestors: string[];
  /** Quantidade de itens folha abaixo deste item (0 para folhas). */
  leafCount: number;
  /** Numeração completa exibida na UI, ex.: "4.1.2". */
  fullNumber: string;
}

/** Registro de progresso persistido por item. */
export interface TopicProgress {
  status: StudyStatus;
  /** Minutos acumulados de estudo neste item. */
  minutes: number;
  /** Notas livres do usuário. */
  notes?: string;
  /** ISO date da última atualização. */
  updatedAt: string;
}

/** Sessão de estudo registrada (para os gráficos de evolução). */
export interface StudySession {
  /** ISO date (yyyy-MM-dd). */
  date: string;
  minutes: number;
  topicId?: string;
}

export interface StudyState {
  version: number;
  topics: Record<string, TopicProgress>;
  sessions: StudySession[];
}

export interface ProgressSummary {
  total: number;
  dominado: number;
  revisar: number;
  estudando: number;
  nao_iniciado: number;
  /** Percentual 0-100 considerando peso por item. */
  percent: number;
  minutes: number;
}
