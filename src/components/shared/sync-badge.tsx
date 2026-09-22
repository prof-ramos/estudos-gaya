import { CloudOff, CloudCheck, RefreshCw } from 'lucide-react';
import { useStudy } from '@/context/study-context/StudyContext';

const CONFIG = {
  synced: {
    label: 'Sincronizado',
    icon: CloudCheck,
    className: 'bg-chart-2/10 text-chart-2',
    title: 'Progresso salvo no Turso',
  },
  syncing: {
    label: 'Sincronizando',
    icon: RefreshCw,
    className: 'bg-chart-4/15 text-chart-4',
    title: 'Buscando progresso no banco',
  },
  offline: {
    label: 'Só neste navegador',
    icon: CloudOff,
    className: 'bg-muted text-muted-foreground',
    title:
      'Banco não configurado ou offline. O progresso fica salvo apenas neste navegador.',
  },
} as const;

/** Selo que indica onde o progresso está sendo salvo. */
export default function SyncBadge() {
  const { syncStatus } = useStudy();
  const { label, icon: Icon, className, title } = CONFIG[syncStatus];

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon size={13} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
      {label}
    </span>
  );
}
