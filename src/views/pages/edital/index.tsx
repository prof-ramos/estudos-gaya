import { memo, useMemo, useState } from 'react';
import {
  BookMarked,
  Check,
  ChevronRight,
  Clock3,
  Plus,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useStudy } from '@/context/study-context/StudyContext';
import {
  STATUS_CLASS,
  STATUS_LABEL,
  STATUS_ORDER,
  allTopics,
  formatMinutes,
} from '@/lib/edital';
import type { StudyStatus, TopicoFlat } from '@/types/estudos';

const ALL = '__all__';

/** Índice id -> filhos, para renderizar a árvore do edital. */
const childrenByParent = new Map<string, TopicoFlat[]>();
const childrenByDisciplina = new Map<string, TopicoFlat[]>();

for (const topic of allTopics) {
  if (topic.parentId) {
    const list = childrenByParent.get(topic.parentId) ?? [];
    list.push(topic);
    childrenByParent.set(topic.parentId, list);
  } else {
    const key = `${topic.secaoId}/${topic.disciplinaId}`;
    const list = childrenByDisciplina.get(key) ?? [];
    list.push(topic);
    childrenByDisciplina.set(key, list);
  }
}

interface TopicRowProps {
  topic: TopicoFlat;
  expanded: boolean;
  hasChildren: boolean;
  onToggle: (topicId: string) => void;
  /** Progresso do item (referência estável para itens não editados). */
  entry?: { status: StudyStatus; minutes: number; notes?: string };
  setStatus: (topicId: string, status: StudyStatus) => void;
  toggleDominado: (topicId: string) => void;
  addMinutes: (topicId: string, minutes: number) => void;
}

/** Uma linha de item do edital, com ações de status e tempo de estudo. */
const TopicRow = memo(function TopicRow({
  topic,
  expanded,
  hasChildren,
  onToggle,
  entry,
  setStatus,
  toggleDominado,
  addMinutes,
}: TopicRowProps) {
  const status: StudyStatus = entry?.status ?? 'nao_iniciado';
  const isDone = status === 'dominado';

  return (
    <div
      className="flex flex-col gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/30 sm:flex-row sm:items-start sm:justify-between"
      style={{ paddingLeft: `${16 + topic.nivel * 20}px` }}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(topic.id)}
            aria-label={expanded ? 'Recolher subtópicos' : 'Expandir subtópicos'}
            className="mt-0.5 shrink-0 cursor-pointer rounded-md p-0.5 text-muted-foreground transition hover:bg-muted"
          >
            <ChevronRight
              size={16}
              className={
                expanded ? 'rotate-90 transition-transform' : 'transition-transform'
              }
            />
          </button>
        ) : (
          <span className="mt-0.5 w-5 shrink-0" />
        )}

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="shrink-0 tabular-nums">
              {topic.numero}
            </Badge>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
            {entry?.minutes ? (
              <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                <Clock3 size={12} />
                {formatMinutes(entry.minutes)}
              </span>
            ) : null}
          </div>

          <span
            className={`text-sm leading-5 ${
              isDone ? 'text-muted-foreground line-through' : 'text-foreground'
            }`}
          >
            {topic.texto}
          </span>

          {topic.nivel === 1 ? (
            <span className="text-xs text-muted-foreground">
              {topic.disciplina} · {childrenByParent.get(topic.id)?.length ?? 0}{' '}
              subtópicos
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
        <Select
          value={status}
          onValueChange={(value) => value && setStatus(topic.id, value as StudyStatus)}
        >
          <SelectTrigger className="h-8! w-[132px] cursor-pointer text-xs">
            <SelectValue>
              {(value) => STATUS_LABEL[value as StudyStatus]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_ORDER.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="cursor-pointer text-xs"
              >
                {STATUS_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          title="Registrar 30 minutos de estudo"
          onClick={() => addMinutes(topic.id, 30)}
        >
          <Plus size={14} />
          30min
        </Button>

        <Button
          variant={isDone ? 'default' : 'ghost'}
          size="icon-sm"
          className="cursor-pointer"
          aria-label={isDone ? 'Desmarcar dominado' : 'Marcar como dominado'}
          title={isDone ? 'Desmarcar dominado' : 'Marcar como dominado'}
          onClick={() => toggleDominado(topic.id)}
        >
          <Check size={14} />
        </Button>
      </div>
    </div>
  );
});

/** Página do edital: árvore de disciplinas e tópicos com progresso. */
export default function EditalPage() {
  const { disciplinas, summary, progress, setStatus, toggleDominado, addMinutes } =
    useStudy();
  const [search, setSearch] = useState('');
  const [secaoFilter, setSecaoFilter] = useState(ALL);
  const [disciplinaFilter, setDisciplinaFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const secoes = useMemo(() => {
    const map = new Map<string, string>();
    disciplinas.forEach((disciplina) => map.set(disciplina.secaoId, disciplina.secao));
    return [...map.entries()].map(([id, nome]) => ({ id, nome }));
  }, [disciplinas]);

  const disciplinasFiltradas = useMemo(
    () =>
      disciplinas.filter((disciplina) => {
        if (secaoFilter !== ALL && disciplina.secaoId !== secaoFilter) return false;
        if (disciplinaFilter !== ALL && disciplina.id !== disciplinaFilter) return false;
        return true;
      }),
    [disciplinas, secaoFilter, disciplinaFilter],
  );

  const termo = search.trim().toLowerCase();

  /**
   * Itens visíveis por disciplina: filtra por status/busca e expande
   * subtópicos dos itens abertos. Derivado uma única vez por mudança de
   * filtros, busca, progresso ou expansão.
   */
  const visiveisPorDisciplina = useMemo(() => {
    const matches = (topic: TopicoFlat): boolean => {
      if (statusFilter !== ALL) {
        const status: StudyStatus = progress[topic.id]?.status ?? 'nao_iniciado';
        if (status !== statusFilter) return false;
      }
      if (!termo) return true;

      // Mantém o item quando ele ou qualquer descendente casa com a busca.
      if (
        topic.texto.toLowerCase().includes(termo) ||
        topic.numero.includes(termo) ||
        topic.disciplina.toLowerCase().includes(termo)
      ) {
        return true;
      }

      return (childrenByParent.get(topic.id) ?? []).some(matches);
    };

    const result = new Map<string, { topic: TopicoFlat; expanded: boolean }[]>();

    for (const disciplina of disciplinasFiltradas) {
      const key = `${disciplina.secaoId}/${disciplina.id}`;
      const linhas: { topic: TopicoFlat; expanded: boolean }[] = [];

      // Percurso em profundidade: raiz visível; filhos entram se o pai
      // estiver expandido (ou casar com a busca, que já os mantém).
      const visit = (topic: TopicoFlat) => {
        if (!matches(topic)) return;

        const filhos = childrenByParent.get(topic.id) ?? [];
        const isExpanded = expanded.has(topic.id);
        linhas.push({ topic, expanded: isExpanded });

        const buscaAtiva = Boolean(termo);
        if (isExpanded || buscaAtiva) {
          for (const filho of filhos) visit(filho);
        }
      };

      for (const topico of childrenByDisciplina.get(key) ?? []) visit(topico);

      if (linhas.length > 0) result.set(key, linhas);
    }

    return result;
  }, [disciplinasFiltradas, progress, statusFilter, termo, expanded]);

  const toggleExpand = (topicId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard className="gap-0!">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <BookMarked size={16} className="text-muted-foreground" />
            Edital verticalizado
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {summary.dominado} de {summary.total} itens dominados
              </span>
              <span className="font-medium tabular-nums">{summary.percent}%</span>
            </div>
            <Progress value={summary.percent} />
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar tópico, número ou disciplina"
                className="pl-9"
              />
            </div>

            <Select
              value={secaoFilter}
              onValueChange={(value) => {
                if (!value) return;
                setSecaoFilter(value);
                setDisciplinaFilter(ALL);
              }}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue>
                  {(value) =>
                    value === ALL
                      ? 'Todas as seções'
                      : (secoes.find((secao) => secao.id === value)?.nome ?? '')
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="cursor-pointer">
                  Todas as seções
                </SelectItem>
                {secoes.map((secao) => (
                  <SelectItem key={secao.id} value={secao.id} className="cursor-pointer">
                    {secao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={disciplinaFilter}
              onValueChange={(value) => value && setDisciplinaFilter(value)}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue>
                  {(value) =>
                    value === ALL
                      ? 'Todas as disciplinas'
                      : (disciplinas.find((disciplina) => disciplina.id === value)
                          ?.nome ?? '')
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="cursor-pointer">
                  Todas as disciplinas
                </SelectItem>
                {disciplinas
                  .filter(
                    (disciplina) =>
                      secaoFilter === ALL || disciplina.secaoId === secaoFilter,
                  )
                  .map((disciplina) => (
                    <SelectItem
                      key={`${disciplina.secaoId}/${disciplina.id}`}
                      value={disciplina.id}
                      className="cursor-pointer"
                    >
                      {disciplina.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => value && setStatusFilter(value)}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue>
                  {(value) =>
                    value === ALL
                      ? 'Qualquer situação'
                      : STATUS_LABEL[value as StudyStatus]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="cursor-pointer">
                  Qualquer situação
                </SelectItem>
                {STATUS_ORDER.map((option) => (
                  <SelectItem key={option} value={option} className="cursor-pointer">
                    {STATUS_LABEL[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </DashboardCard>

      {visiveisPorDisciplina.size === 0 ? (
        <DashboardCard>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhum tópico corresponde aos filtros selecionados.
          </CardContent>
        </DashboardCard>
      ) : null}

      {disciplinasFiltradas.map((disciplina) => {
        const linhas = visiveisPorDisciplina.get(
          `${disciplina.secaoId}/${disciplina.id}`,
        );

        if (!linhas?.length) return null;

        return (
          <DashboardCard
            key={`${disciplina.secaoId}/${disciplina.id}`}
            className="gap-0!"
          >
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <CardTitle>{disciplina.nome}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {disciplina.secao}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{disciplina.percent}%</Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatMinutes(disciplina.minutes)}
                    </span>
                  </div>
                </div>
                <Progress value={disciplina.percent} />
              </div>
            </CardHeader>

            <CardContent className="p-0!">
              {linhas.map(({ topic, expanded: isOpen }) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  expanded={isOpen}
                  hasChildren={(childrenByParent.get(topic.id)?.length ?? 0) > 0}
                  onToggle={toggleExpand}
                  entry={progress[topic.id]}
                  setStatus={setStatus}
                  toggleDominado={toggleDominado}
                  addMinutes={addMinutes}
                />
              ))}
            </CardContent>
          </DashboardCard>
        );
      })}
    </div>
  );
}
