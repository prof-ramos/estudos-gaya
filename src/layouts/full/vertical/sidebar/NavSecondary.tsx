import { Target } from 'lucide-react';
import { Link } from 'react-router';
import { useStudy } from '@/context/study-context/StudyContext';
import { formatMinutes } from '@/lib/edital';

/** Painel inferior da sidebar com o avanço geral no edital. */
export function NavSecondary() {
  const { summary, sessions } = useStudy();

  const minutos = sessions.reduce((acc, session) => acc + session.minutes, 0);

  return (
    <div className="-mx-4 border-t border-b border-border px-5 py-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="size-5 shrink-0" />
                <span className="text-base leading-6 font-medium text-foreground">
                  Edital
                </span>
              </div>
              <span className="text-base leading-6 font-medium text-foreground">
                {summary.percent}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${summary.percent}%` }}
              />
            </div>
          </div>
          <p className="text-center text-sm leading-5 font-normal text-muted-foreground">
            {summary.dominado}/{summary.total} itens dominados
          </p>
        </div>

        <Link
          to="/edital"
          className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background hover:bg-foreground/90"
        >
          {minutos > 0 ? `${formatMinutes(minutos)} estudados` : 'Começar a estudar'}
        </Link>
      </div>
    </div>
  );
}
