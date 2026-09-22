import { useMemo, useState } from 'react';
import { Check, Clock3, ListChecks, Plus, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useStudy } from '@/context/study-context/StudyContext';
import { allTopics, formatMinutes } from '@/lib/edital';
import type { StudyStatus } from '@/types/estudos';

type Filtro = 'revisar' | 'estudando' | 'pendentes';

const filtros: { id: Filtro; label: string }[] = [
  { id: 'revisar', label: 'Marcados para revisão' },
  { id: 'estudando', label: 'Em estudo' },
  { id: 'pendentes', label: 'Ainda não iniciados' },
];

/** Página de revisão: itens que precisam de retomada. */
export default function RevisaoPage() {
  const { progress, setStatus, addMinutes } = useStudy();
  const [filtro, setFiltro] = useState<Filtro>('revisar');

  const lista = useMemo(() => {
    return allTopics.filter((topic) => {
      const status: StudyStatus = progress[topic.id]?.status ?? 'nao_iniciado';

      if (filtro === 'revisar') return status === 'revisar';
      if (filtro === 'estudando') return status === 'estudando';
      return status === 'nao_iniciado';
    });
  }, [filtro, progress]);

  const minutos = lista.reduce(
    (acc, topic) => acc + (progress[topic.id]?.minutes ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard className="gap-0!">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <ListChecks size={16} className="text-muted-foreground" />
            Fila de revisão
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select
              value={filtro}
              onValueChange={(value) => value && setFiltro(value as Filtro)}
            >
              <SelectTrigger className="w-[240px] cursor-pointer">
                <SelectValue>
                  {(value) =>
                    filtros.find((item) => item.id === value)?.label ?? ''
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filtros.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="cursor-pointer">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {lista.length} itens na fila
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock3 size={14} />
                {formatMinutes(minutos)}
              </span>
            </div>
          </div>
        </CardContent>
      </DashboardCard>

      <DashboardCard className="gap-0!">
        <CardContent className="p-0!">
          {lista.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nenhum item nesta fila. Ajuste o filtro ou avance nos estudos.
            </p>
          ) : (
            lista.map((topic) => {
              const entry = progress[topic.id];

              return (
                <div
                  key={topic.id}
                  className="flex flex-col gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="tabular-nums">
                        {topic.numero}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {topic.disciplina}
                      </span>
                      {entry?.minutes ? (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatMinutes(entry.minutes)}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-sm leading-5 text-foreground">
                      {topic.texto}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => addMinutes(topic.id, 30)}
                    >
                      <Plus size={14} />
                      30min
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setStatus(topic.id, 'revisar')}
                    >
                      <RotateCcw size={14} />
                      Revisar
                    </Button>
                    <Button
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setStatus(topic.id, 'dominado')}
                    >
                      <Check size={14} />
                      Dominado
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </DashboardCard>
    </div>
  );
}
