import { BookOpenCheck, CircleCheckBig, Clock3, Target } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useStudy } from '@/context/study-context/StudyContext';
import { formatMinutes } from '@/lib/edital';

interface StatProps {
  title: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  /** Quando definido, exibe uma barra de progresso abaixo do valor. */
  percent?: number;
}

function StatCard({ title, value, hint, icon: Icon, percent }: StatProps) {
  return (
    <DashboardCard className="py-6">
      <CardContent className="flex flex-col gap-4 px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-normal text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-semibold tracking-[-0.3px]">{value}</h3>
          </div>
          <div className="w-fit rounded-md border border-border p-2.5">
            <Icon size={16} />
          </div>
        </div>

        {percent === undefined ? (
          <p className="text-sm text-muted-foreground">{hint}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <Progress value={percent} />
            <p className="text-sm text-muted-foreground">{hint}</p>
          </div>
        )}
      </CardContent>
    </DashboardCard>
  );
}

/** Grade de indicadores gerais do plano de estudos. */
export default function StudyStats() {
  const { summary, sessions } = useStudy();

  const totalMinutes = sessions.reduce(
    (acc, session) => acc + session.minutes,
    0,
  );

  const pendencias = summary.nao_iniciado + summary.estudando + summary.revisar;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Itens do edital"
        value={String(summary.total)}
        hint={`${summary.nao_iniciado} ainda não iniciados`}
        icon={BookOpenCheck}
      />
      <StatCard
        title="Itens dominados"
        value={String(summary.dominado)}
        hint={`${pendencias} itens em andamento`}
        icon={CircleCheckBig}
      />
      <StatCard
        title="Progresso do edital"
        value={`${summary.percent}%`}
        percent={summary.percent}
        hint={`${summary.revisar} itens marcados para revisão`}
        icon={Target}
      />
      <StatCard
        title="Tempo estudado"
        value={formatMinutes(totalMinutes)}
        hint={`${sessions.length} sessões registradas`}
        icon={Clock3}
      />
    </div>
  );
}
