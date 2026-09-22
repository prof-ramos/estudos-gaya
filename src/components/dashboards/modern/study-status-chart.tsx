import { Cell, Pie, PieChart } from 'recharts';
import { ChartPie } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useStudy } from '@/context/study-context/StudyContext';
import { STATUS_COLOR, STATUS_LABEL, STATUS_ORDER } from '@/lib/edital';

const chartConfig = {
  value: { label: 'Itens' },
} satisfies ChartConfig;

/** Rosca com a distribuição dos itens do edital por situação de estudo. */
export default function StudyStatusChart() {
  const { summary } = useStudy();

  const data = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    value: summary[status],
    color: STATUS_COLOR[status],
  }));

  return (
    <DashboardCard className="flex flex-col gap-0!">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <ChartPie size={16} className="text-muted-foreground" />
          Situação dos itens
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-5">
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-[200px]! w-full"
          initialDimension={{ width: 280, height: 200 }}
        >
          <PieChart>
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload as
                  | { label: string; value: number }
                  | undefined;
                if (!item) return null;

                return (
                  <div className="grid gap-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.value} itens
                    </span>
                  </div>
                );
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive
              animationDuration={700}
            >
              {data.map((item) => (
                <Cell key={item.status} fill={item.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          {data.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="ml-auto text-sm font-medium tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </DashboardCard>
  );
}