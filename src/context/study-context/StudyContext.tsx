import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  allTopics,
  groupByDisciplina,
  summarize,
  type DisciplinaResumo,
} from '@/lib/edital';
import {
  clearRemoteState,
  fetchRemoteState,
  pushSession,
  pushState,
  pushTopic,
} from '@/lib/api';
import type {
  ProgressSummary,
  StudySession,
  StudyState,
  StudyStatus,
  TopicProgress,
} from '@/types/estudos';

const STORAGE_KEY = 'gaya:study-state:v1';
const MIGRATED_KEY = 'gaya:migrated-to-turso:v1';
const STATE_VERSION = 1;

/** Estado da sincronização exibido na interface. */
export type SyncStatus = 'offline' | 'syncing' | 'synced';

interface StudyContextValue {
  progress: Record<string, TopicProgress>;
  sessions: StudySession[];
  summary: ProgressSummary;
  disciplinas: DisciplinaResumo[];
  syncStatus: SyncStatus;
  setStatus: (topicId: string, status: StudyStatus) => void;
  toggleDominado: (topicId: string) => void;
  addMinutes: (topicId: string, minutes: number) => void;
  setNote: (topicId: string, note: string) => void;
  resetAll: () => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

function emptyState(): StudyState {
  return { version: STATE_VERSION, topics: {}, sessions: [] };
}

/** Lê o estado salvo, ignorando dados corrompidos ou de versão antiga. */
function loadState(): StudyState {
  if (typeof window === 'undefined') return emptyState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();

    const parsed = JSON.parse(raw) as Partial<StudyState>;
    if (parsed.version !== STATE_VERSION) return emptyState();

    return {
      version: STATE_VERSION,
      topics: parsed.topics ?? {},
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return emptyState();
  }
}

/** Data local no formato yyyy-MM-dd (evita deslocamento de fuso do toISOString). */
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudyState>(loadState);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');

  // Evita gravar no banco as atualizações que vieram do próprio banco.
  const hydratedRef = useRef(false);

  /** Cache local: mantém o app utilizável offline. */
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Armazenamento indisponível (modo privado/cota): segue só em memória.
    }
  }, [state]);

  /** Hidrata a partir do Turso e migra o progresso local na primeira vez. */
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setSyncStatus('syncing');
      const remote = await fetchRemoteState();

      if (cancelled) return;

      // API indisponível: permanece em modo local.
      if (!remote) {
        setSyncStatus('offline');
        return;
      }

      const local = loadState();
      const localTemDados =
        Object.keys(local.topics).length > 0 || local.sessions.length > 0;
      const remoteTemDados =
        Object.keys(remote.topics).length > 0 || remote.sessions.length > 0;

      const jaMigrou = window.localStorage.getItem(MIGRATED_KEY) === 'true';

      // Migração: o banco está vazio e existe progresso local a preservar.
      if (!jaMigrou && localTemDados && !remoteTemDados) {
        const ok = await pushState(local);
        if (cancelled) return;

        if (ok) {
          window.localStorage.setItem(MIGRATED_KEY, 'true');
          setState(local);
          setSyncStatus('synced');
          hydratedRef.current = true;
          return;
        }

        setSyncStatus('offline');
        return;
      }

      window.localStorage.setItem(MIGRATED_KEY, 'true');
      setState({ version: STATE_VERSION, ...remote });
      setSyncStatus('synced');
      hydratedRef.current = true;
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const patchTopic = useCallback(
    (topicId: string, patch: Partial<TopicProgress>) => {
      setState((prev) => {
        const current: TopicProgress = prev.topics[topicId] ?? {
          status: 'nao_iniciado',
          minutes: 0,
          updatedAt: todayIso(),
        };

        const next = { ...current, ...patch, updatedAt: todayIso() };

        if (hydratedRef.current) {
          void pushTopic(topicId, next);
        }

        return {
          ...prev,
          topics: { ...prev.topics, [topicId]: next },
        };
      });
    },
    [],
  );

  const setStatus = useCallback(
    (topicId: string, status: StudyStatus) => patchTopic(topicId, { status }),
    [patchTopic],
  );

  const toggleDominado = useCallback(
    (topicId: string) =>
      setState((prev) => {
        const current: TopicProgress = prev.topics[topicId] ?? {
          status: 'nao_iniciado',
          minutes: 0,
          updatedAt: todayIso(),
        };
        const nextStatus: StudyStatus =
          current.status === 'dominado' ? 'nao_iniciado' : 'dominado';

        const next: TopicProgress = {
          ...current,
          status: nextStatus,
          updatedAt: todayIso(),
        };

        if (hydratedRef.current) {
          void pushTopic(topicId, next);
        }

        return {
          ...prev,
          topics: { ...prev.topics, [topicId]: next },
        };
      }),
    [],
  );

  const addMinutes = useCallback((topicId: string, minutes: number) => {
    if (minutes <= 0) return;

    setState((prev) => {
      const current: TopicProgress = prev.topics[topicId] ?? {
        status: 'estudando',
        minutes: 0,
        updatedAt: todayIso(),
      };
      const nextStatus: StudyStatus =
        current.status === 'nao_iniciado' ? 'estudando' : current.status;

      const next: TopicProgress = {
        ...current,
        status: nextStatus,
        minutes: current.minutes + minutes,
        updatedAt: todayIso(),
      };

      const session: StudySession = { date: todayIso(), minutes, topicId };

      if (hydratedRef.current) {
        void pushTopic(topicId, next);
        void pushSession(session);
      }

      return {
        ...prev,
        topics: { ...prev.topics, [topicId]: next },
        sessions: [...prev.sessions, session],
      };
    });
  }, []);

  const setNote = useCallback(
    (topicId: string, note: string) => patchTopic(topicId, { notes: note }),
    [patchTopic],
  );

  const resetAll = useCallback(() => {
    setState(emptyState());
    if (hydratedRef.current) {
      void clearRemoteState();
    }
  }, []);

  const summary = useMemo(
    () => summarize(allTopics, state.topics),
    [state.topics],
  );

  const disciplinas = useMemo(() => {
    return groupByDisciplina(allTopics).map((disciplina) => {
      const resumo = summarize(disciplina.topicos, state.topics);
      return {
        ...disciplina,
        iniciados: resumo.total - resumo.nao_iniciado,
        dominado: resumo.dominado,
        percent: resumo.percent,
        minutes: resumo.minutes,
      };
    });
  }, [state.topics]);

  const value = useMemo<StudyContextValue>(
    () => ({
      progress: state.topics,
      sessions: state.sessions,
      summary,
      disciplinas,
      syncStatus,
      setStatus,
      toggleDominado,
      addMinutes,
      setNote,
      resetAll,
    }),
    [
      state.topics,
      state.sessions,
      summary,
      disciplinas,
      syncStatus,
      setStatus,
      toggleDominado,
      addMinutes,
      setNote,
      resetAll,
    ],
  );

  return (
    <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
  );
}

/** Acessa o progresso de estudos. Deve ser usado dentro de StudyProvider. */
export function useStudy(): StudyContextValue {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy precisa estar dentro de <StudyProvider>');
  }
  return context;
}
