import { BarChart3 } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useStudy } from '@/context/study-context/StudyContext';
import { formatMinutes } from '@/lib/edital';

/** Página de estatísticas: desempenho detalhado por disciplina. */
export default function EstatisticasPage() {
  const { disciplinas, summary } = useStudy();

  const ordenadas = [...disciplinas].sort((a, b) => b.percent - a.percent);

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard className="gap-0!">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={16} className="text-muted-foreground" />
            Desempenho por disciplina
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span className="text-muted-foreground">
              Itens dominados:{' '}
              <strong className="text-foreground">{summary.dominado}</strong>
            </span>
            <span className="text-muted-foreground">
              Em revisão:{' '}
              <strong className="text-foreground">{summary.revisar}</strong>
            </span>
            <span className="text-muted-foreground">
              Estudando:{' '}
              <strong className="text-foreground">{summary.estudando}</strong>
            </span>
            <span className="text-muted-foreground">
              Não iniciados:{' '}
              <strong className="text-foreground">{summary.nao_iniciado}</strong>
            </span>
          </div>
          <Progress value={summary.percent} />
        </CardContent>
      </DashboardCard>

      <DashboardCard className="gap-0!">
        <CardContent className="px-0!">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="px-5 py-3 text-sm font-normal text-muted-foreground">
                    Disciplina
                  </TableHead>
                  <TableHead className="w-[110px] px-4 py-3 text-sm font-normal text-muted-foreground">
                    Itens
                  </TableHead>
                  <TableHead className="w-[130px] px-4 py-3 text-sm font-normal text-muted-foreground">
                    Dominados
                  </TableHead>
                  <TableHead className="w-[160px] px-4 py-3 text-sm font-normal text-muted-foreground">
                    Progresso
                  </TableHead>
                  <TableHead className="w-[120px] px-4 py-3 text-sm font-normal text-muted-foreground">
                    Tempo
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {ordenadas.map((disciplina) => (
                  <TableRow
                    key={`${disciplina.secaoId}/${disciplina.id}`}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell className="px-5 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {disciplina.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {disciplina.secao}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                      {disciplina.total}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                      {disciplina.dominado}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={disciplina.percent} className="w-[90px]" />
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {disciplina.percent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="secondary" className="tabular-nums">
                        {formatMinutes(disciplina.minutes)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </DashboardCard>
    </div>
  );
}
