import { useState } from 'react';
import { Check, ListTodo, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useStudy } from '@/context/study-context/StudyContext';
import { allTopics, formatMinutes } from '@/lib/edital';

const LIMIT = 8;

/** Lista os próximos itens não iniciados, com ações rápidas de estudo. */
export default function StudyFocus() {
  const { progress, addMinutes, toggleDominado } = useStudy();
  const [limit, setLimit] = useState(LIMIT);

  const pendentes = allTopics.filter(
    (topic) => (progress[topic.id]?.status ?? 'nao_iniciado') !== 'dominado',
  );

  const visiveis = pendentes.slice(0, limit);

  return (
    <DashboardCard className="flex flex-col gap-0!">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <ListTodo size={16} className="text-muted-foreground" />
          Próximos itens do edital
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col p-0!">
        {visiveis.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Tudo dominado por aqui. Excelente trabalho!
          </p>
        ) : (
          visiveis.map((topic) => {
            const entry = progress[topic.id];

            return (
              <div
                key={topic.id}
                className="flex flex-col gap-2 border-b border-border px-5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="shrink-0 tabular-nums">
                      {topic.numero}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {topic.disciplina}
                    </span>
                  </div>
                  <span className="text-sm leading-5 text-foreground">
                    {topic.texto}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {entry?.minutes ? (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatMinutes(entry.minutes)}
                    </span>
                  ) : null}
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
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer"
                    aria-label="Marcar como dominado"
                    title="Marcar como dominado"
                    onClick={() => toggleDominado(topic.id)}
                  >
                    <Check size={14} />
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {pendentes.length > visiveis.length ? (
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full cursor-pointer"
              onClick={() => setLimit((value) => value + LIMIT)}
            >
              Mostrar mais {Math.min(LIMIT, pendentes.length - visiveis.length)} itens
            </Button>
          </div>
        ) : null}
      </CardContent>
    </DashboardCard>
  );
}
