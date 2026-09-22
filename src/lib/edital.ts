import editalJson from '../../data/edital.json';
import type {
  Edital,
  EditalNode,
  ProgressSummary,
  StudyStatus,
  TopicProgress,
  TopicoFlat,
} from '@/types/estudos';

/** Edital carregado como JSON estático (sem requisição em runtime). */
export const edital = editalJson as Edital;

/** Ordem canônica das situações, do menor para o maior avanço. */
export const STATUS_ORDER: StudyStatus[] = [
  'nao_iniciado',
  'estudando',
  'revisar',
  'dominado',
];

export const STATUS_LABEL: Record<StudyStatus, string> = {
  nao_iniciado: 'Não iniciado',
  estudando: 'Estudando',
  revisar: 'Revisar',
  dominado: 'Dominado',
};

/** Classes Tailwind de cada situação (texto + fundo suave). */
export const STATUS_CLASS: Record<StudyStatus, string> = {
  nao_iniciado: 'bg-muted text-muted-foreground',
  estudando: 'bg-chart-1/10 text-chart-1',
  revisar: 'bg-chart-4/15 text-chart-4',
  dominado: 'bg-chart-2/10 text-chart-2',
};

/** Cor sólida de cada situação, para gráficos do Recharts. */
export const STATUS_COLOR: Record<StudyStatus, string> = {
  nao_iniciado: 'var(--muted-foreground)',
  estudando: 'var(--chart-1)',
  revisar: 'var(--chart-4)',
  dominado: 'var(--chart-2)',
};

/** Slug determinístico e legível para uso em ids e rotas. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Achata o edital em uma lista de itens com ids estáveis.
 * Um item só é "folha" quando não possui subtópicos.
 */
export function flattenEdital(source: Edital = edital): TopicoFlat[] {
  const flat: TopicoFlat[] = [];

  for (const secao of source.secoes) {
    const secaoId = slugify(secao.nome);

    for (const disciplina of secao.disciplinas) {
      const disciplinaId = slugify(disciplina.nome);

      const walk = (
        node: EditalNode,
        nivel: number,
        parentId: string | null,
        ancestors: string[],
      ): number => {
        const id = `${secaoId}/${disciplinaId}/${node.numero}`;
        const children = node.subtopicos ?? [];

        // Contabiliza as folhas descendentes para exibir o "peso" do item.
        const leafCount = children.reduce(
          (acc, child) => acc + walk(child, nivel + 1, id, [...ancestors, node.texto]),
          0,
        );

        flat.push({
          id,
          numero: node.numero,
          texto: node.texto,
          nivel,
          parentId,
          secao: secao.nome,
          secaoId,
          disciplina: disciplina.nome,
          disciplinaId,
          ancestors,
          leafCount,
          fullNumber: node.numero,
        });

        return children.length === 0 ? 1 : leafCount;
      };

      for (const topico of disciplina.topicos) {
        walk(topico, 1, null, []);
      }
    }
  }

  return flat;
}

/** Lista achatada do edital, calculada uma única vez por módulo. */
export const allTopics: TopicoFlat[] = flattenEdital();

/** Índice id -> item, para buscas O(1) em sessões e notas. */
export const topicById: Map<string, TopicoFlat> = new Map(
  allTopics.map((topic) => [topic.id, topic]),
);

export interface DisciplinaResumo {
  nome: string;
  id: string;
  secao: string;
  secaoId: string;
  total: number;
  /** Itens com situação diferente de "não iniciado". */
  iniciados: number;
  dominado: number;
  percent: number;
  minutes: number;
  topicos: TopicoFlat[];
}

/** Agrupa os itens por disciplina, preservando a ordem do edital. */
export function groupByDisciplina(
  topics: TopicoFlat[] = allTopics,
): DisciplinaResumo[] {
  const map = new Map<string, DisciplinaResumo>();

  for (const topic of topics) {
    const key = `${topic.secaoId}/${topic.disciplinaId}`;
    let entry = map.get(key);

    if (!entry) {
      entry = {
        nome: topic.disciplina,
        id: topic.disciplinaId,
        secao: topic.secao,
        secaoId: topic.secaoId,
        total: 0,
        iniciados: 0,
        dominado: 0,
        percent: 0,
        minutes: 0,
        topicos: [],
      };
      map.set(key, entry);
    }

    entry.topicos.push(topic);
  }

  return [...map.values()];
}

/** Resumo numérico de um conjunto de itens a partir do progresso salvo. */
export function summarize(
  topics: TopicoFlat[],
  progress: Record<string, TopicProgress>,
): ProgressSummary {
  const summary: ProgressSummary = {
    total: topics.length,
    dominado: 0,
    revisar: 0,
    estudando: 0,
    nao_iniciado: 0,
    percent: 0,
    minutes: 0,
  };

  for (const topic of topics) {
    const entry = progress[topic.id];
    const status: StudyStatus = entry?.status ?? 'nao_iniciado';

    summary[status] += 1;
    summary.minutes += entry?.minutes ?? 0;
  }

  // "Dominado" vale integralmente; "revisar" e "estudando" valem meio peso.
  const weighted = summary.dominado + (summary.revisar + summary.estudando) * 0.5;
  summary.percent =
    summary.total === 0 ? 0 : Math.round((weighted / summary.total) * 100);

  return summary;
}

/** Converte minutos em um rótulo curto, ex.: "4h 20min". */
export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0min';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

/** Soma minutos de sessões agrupando por dia, em ordem cronológica. */
export function minutesByDay(
  sessions: { date: string; minutes: number }[],
): { date: string; minutes: number }[] {
  const map = new Map<string, number>();

  for (const session of sessions) {
    map.set(session.date, (map.get(session.date) ?? 0) + session.minutes);
  }

  return [...map.entries()]
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Rótulo curto de data (dd/mm) para os eixos dos gráficos. */
export function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}
