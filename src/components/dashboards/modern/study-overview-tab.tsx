import { CalendarDays, Download, RotateCcw, Sun, Moon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudy } from '@/context/study-context/StudyContext';
import { edital, formatMinutes } from '@/lib/edital';
import SyncBadge from '@/components/shared/sync-badge';

const periods = ['Últimos 7 dias', 'Últimos 30 dias', 'Todo o período'];

/** Cabeçalho do dashboard: saudação, resumo e ações rápidas. */
export default function StudyOverviewTab() {
  const { summary, sessions, resetAll } = useStudy();
  const [period, setPeriod] = useState(periods[0]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const isDaytime = new Date().getHours() >= 5 && new Date().getHours() < 18;

  const periodMinutes = useMemo(() => {
    if (period === 'Todo o período') {
      return sessions.reduce((acc, session) => acc + session.minutes, 0);
    }

    const days = period === 'Últimos 7 dias' ? 7 : 30;
    const limit = new Date();
    limit.setDate(limit.getDate() - days);
    const limitIso = limit.toISOString().slice(0, 10);

    return sessions
      .filter((session) => session.date >= limitIso)
      .reduce((acc, session) => acc + session.minutes, 0);
  }, [period, sessions]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col items-start">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          {greeting}! Bons estudos
          <span className="flex items-center">
            {isDaytime ? <Sun size={22} color="orange" /> : <Moon size={22} />}
          </span>
        </h2>
        <p className="text-sm font-normal text-muted-foreground">
          {edital.concurso} {edital.cargo}
        </p>
        <div className="pt-2">
          <SyncBadge />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer"
          aria-label="Zerar progresso"
          title="Zerar progresso salvo"
          onClick={() => {
            if (
              window.confirm(
                'Isso apaga todo o progresso salvo neste navegador. Continuar?',
              )
            ) {
              resetAll();
            }
          }}
        >
          <RotateCcw size={16} />
        </Button>

        <Select value={period} onValueChange={(value) => value && setPeriod(value)}>
          <SelectTrigger className="h-auto! w-fit cursor-pointer text-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {periods.map((item) => (
              <SelectItem className="cursor-pointer" key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3">
          <Download size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">
            {formatMinutes(periodMinutes)} no período
          </span>
        </div>

        <div className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-primary-foreground">
          <span className="text-sm font-medium">
            {summary.percent}% concluído
          </span>
        </div>
      </div>
    </div>
  );
}
