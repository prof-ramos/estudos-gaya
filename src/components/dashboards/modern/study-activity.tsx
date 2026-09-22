import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CalendarRange } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useStudy } from '@/context/study-context/StudyContext';
import { formatMinutes, minutesByDay, shortDate } from '@/lib/edital';

const DAYS = 14;

const chartConfig = {
  minutes: { label: 'Minutos', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/** Série diária de minutos estudados nos últimos dias. */
export default function StudyActivity() {
  const { sessions } = useStudy();

  const byDay = new Map(minutesByDay(sessions).map((d) => [d.date, d.minutes]));

  // Monta uma janela contínua de dias, preenchendo os dias sem registro com 0.
  const data = Array.from({ length: DAYS }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (DAYS - 1 - index));
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    return { date: shortDate(iso), minutes: byDay.get(iso) ?? 0 };
  });

  const total = data.reduce((acc, item) => acc + item.minutes, 0);
  const media = Math.round(total / DAYS);

  return (
    <DashboardCard className="flex flex-col gap-0!">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <CalendarRange size={16} className="text-muted-foreground" />
          Ritmo de estudo (últimos {DAYS} dias)
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Total no período</span>
            <span className="text-2xl font-semibold tracking-[-0.3px]">
              {formatMinutes(total)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Média diária</span>
            <span className="text-2xl font-semibold tracking-[-0.3px]">
              {formatMinutes(media)}
            </span>
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="h-[200px]! w-full"
          initialDimension={{ width: 640, height: 200 }}
        >
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="fill-minutes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-minutes)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-minutes)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={48}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickFormatter={(value) => `${value}min`}
            />
            <ChartTooltip
              cursor={{
                stroke: 'var(--border)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const value = Number(payload[0]?.value ?? 0);

                return (
                  <div className="grid gap-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {formatMinutes(value)} estudados
                    </span>
                  </div>
                );
              }}
            />
            <Area
              dataKey="minutes"
              type="monotone"
              stroke="var(--color-minutes)"
              strokeWidth={1.5}
              fill="url(#fill-minutes)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-minutes)', strokeWidth: 0 }}
              isAnimationActive
              animationDuration={700}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </DashboardCard>
  );
}
