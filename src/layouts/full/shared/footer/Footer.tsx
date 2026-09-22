import { edital } from '@/lib/edital';

export default function Footer() {
  return (
    <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row">
      <p className="text-sm text-muted-foreground">
        Plano de estudos · {edital.concurso} — {edital.cargo}
      </p>

      <p className="text-sm text-muted-foreground">
        Progresso salvo localmente neste navegador
      </p>
    </div>
  );
}
