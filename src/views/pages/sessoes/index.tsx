import { CalendarCheck, Clock3, Flame } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useStudy } from '@/context/study-context/StudyContext';
import { formatMinutes, minutesByDay, shortDate } from '@/lib/edital';

/** Página de sessões: histórico de estudo registrado. */
export default function SessoesPage() {
  const { sessions } = useStudy();

  const porDia = minutesByDay(sessions).reverse();
  const total = sessions.reduce((acc, session) => acc + session.minutes, 0);
  const diasAtivos = new Set(sessions.map((session) => session.date)).size;
  const media = diasAtivos === 0 ? 0 : Math.round(total / diasAtivos);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard className="py-6">
          <CardContent className="flex items-center justify-between px-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Tempo total</p>
              <h3 className="text-2xl font-semibold">{formatMinutes(total)}</h3>
            </div>
            <div className="w-fit rounded-md border border-border p-2.5">
              <Clock3 size={16} />
            </div>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="py-6">
          <CardContent className="flex items-center justify-between px-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Dias com estudo</p>
              <h3 className="text-2xl font-semibold">{diasAtivos}</h3>
            </div>
            <div className="w-fit rounded-md border border-border p-2.5">
              <CalendarCheck size={16} />
            </div>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="py-6">
          <CardContent className="flex items-center justify-between px-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Média por dia ativo</p>
              <h3 className="text-2xl font-semibold">{formatMinutes(media)}</h3>
            </div>
            <div className="w-fit rounded-md border border-border p-2.5">
              <Flame size={16} />
            </div>
          </CardContent>
        </DashboardCard>
      </div>

      <DashboardCard className="gap-0!">
        <CardHeader className="border-b border-border">
          <CardTitle>Histórico por dia</CardTitle>
        </CardHeader>
        <CardContent className="p-0!">
          {porDia.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nenhuma sessão registrada ainda. Use o botão “30min” nos itens do
              edital para começar.
            </p>
          ) : (
            porDia.map((dia) => (
              <div
                key={dia.date}
                className="flex items-center justify-between border-b border-border px-5 py-3 last:border-b-0"
              >
                <span className="text-sm text-foreground">
                  {shortDate(dia.date)}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatMinutes(dia.minutes)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </DashboardCard>
    </div>
  );
}
