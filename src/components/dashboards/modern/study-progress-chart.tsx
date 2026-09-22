import type * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';
import { Layers } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useStudy } from '@/context/study-context/StudyContext';
import { formatMinutes } from '@/lib/edital';

/** Uma cor por seção do edital (básicos, específicos, especializados). */
const SECTION_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

const chartConfig = {
  percent: { label: 'Concluído' },
} satisfies ChartConfig;

interface Row {
  key: string;
  nome: string;
  percent: number;
  minutes: number;
  color: string;
}

/** Palavras que ficam minúsculas no título (exceto a primeira). */
const LOWERCASE_WORDS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'para',
  'com',
]);

/** "LEI ORGÂNICA DO TCDF" -> "Lei Orgânica do TCDF"... mantendo siglas. */
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      // Siglas (ex.: TCDF, DF, IA) voltam para caixa alta.
      if (/^[a-z]{2,4}$/.test(word) && word === word.toUpperCase()) return word;
      if (i > 0 && LOWERCASE_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Quebra o nome da disciplina em linhas curtas para o eixo Y. */
function wrapLabel(value: string, maxChars = 26, maxLines = 3): string[] {
  const words = titleCase(value).split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  // Junta o excesso na última linha em vez de truncar com "…".
  return [
    ...lines.slice(0, maxLines - 1),
    lines.slice(maxLines - 1).join(' '),
  ];
}

const TICK_LINE_HEIGHT = 13;

interface YTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

/** Tick do eixo Y com nome completo em múltiplas linhas. */
function YTick({ x = 0, y = 0, payload }: YTickProps) {
  const lines = wrapLabel(payload?.value ?? '');
  const firstDy = -((lines.length - 1) * TICK_LINE_HEIGHT) / 2;

  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      dominantBaseline="central"
      fill="var(--foreground)"
      fontSize={11}
    >
      {lines.map((line, i) => (
        <tspan key={line} x={x} dy={i === 0 ? firstDy : TICK_LINE_HEIGHT}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** Barra horizontal com o avanço de cada disciplina do edital. */
export default function StudyProgressChart() {
  const { disciplinas } = useStudy();

  const sectionIndex = new Map<string, number>();
  const sectionNames = new Map<string, string>();

  const data: Row[] = disciplinas.map((disciplina) => {
    if (!sectionIndex.has(disciplina.secaoId)) {
      sectionIndex.set(disciplina.secaoId, sectionIndex.size);
    }
    sectionNames.set(disciplina.secaoId, disciplina.secao);

    return {
      key: `${disciplina.secaoId}/${disciplina.id}`,
      nome: disciplina.nome,
      percent: disciplina.percent,
      minutes: disciplina.minutes,
      color:
        SECTION_COLORS[
          (sectionIndex.get(disciplina.secaoId) ?? 0) % SECTION_COLORS.length
        ],
    };
  });

  /** Altura cresce com a quantidade de disciplinas (36px por barra + eixos). */
  const chartHeight = Math.max(360, data.length * 36 + 80);

  return (
    <DashboardCard className="flex flex-col gap-0!">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Layers size={16} className="text-muted-foreground" />
          Progresso por disciplina
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5">
        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{ height: chartHeight }}
          initialDimension={{ width: 640, height: chartHeight }}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
            barCategoryGap="25%"
            barSize={16}
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="nome"
              width={220}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={<YTick />}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload as Row | undefined;
                if (!item) return null;

                return (
                  <div className="grid min-w-48 gap-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                    <span className="font-medium">{item.nome}</span>
                    <span className="text-muted-foreground">
                      {item.percent}% concluído
                    </span>
                    <span className="text-muted-foreground">
                      {formatMinutes(item.minutes)} estudados
                    </span>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="percent"
              radius={4}
              isAnimationActive
              animationDuration={700}
            >
              <LabelList
                dataKey="percent"
                position="right"
                formatter={(value: React.ReactNode) => `${String(value)}%`}
                fill="var(--muted-foreground)"
                fontSize={11}
              />
              {data.map((item) => (
                <Cell key={item.key} fill={item.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
          {[...sectionIndex.entries()].map(([secaoId, index]) => (
            <div key={secaoId} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-[2px]"
                style={{
                  backgroundColor:
                    SECTION_COLORS[index % SECTION_COLORS.length],
                }}
              />
              <span className="text-xs text-muted-foreground">
                {sectionNames.get(secaoId)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </DashboardCard>
  );
}
