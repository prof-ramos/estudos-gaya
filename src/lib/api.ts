import type { StudySession, StudyStatus, TopicProgress } from '@/types/estudos';

/** Formato devolvido pela API /api/state. */
interface RemoteTopic {
  topicId: string;
  status: StudyStatus;
  minutes: number;
  notes: string | null;
  updatedAt: string;
}

interface RemoteSession {
  topicId: string | null;
  date: string;
  minutes: number;
}

export interface RemoteState {
  topics: RemoteTopic[];
  sessions: RemoteSession[];
}

/** Estado no formato usado pelo app (espelha o StudyState local). */
export interface SyncedState {
  topics: Record<string, TopicProgress>;
  sessions: StudySession[];
}

const ENDPOINT = '/api/state';

async function request(
  input: string,
  init?: RequestInit,
): Promise<Response | null> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });

    // 503 = banco ainda não conectado; o app segue funcionando só local.
    if (!response.ok) return null;
    return response;
  } catch {
    // Offline ou API indisponível: mantém o modo local.
    return null;
  }
}

/** Lê o estado salvo no Turso. Retorna null se indisponível. */
export async function fetchRemoteState(): Promise<SyncedState | null> {
  const response = await request(ENDPOINT);
  if (!response) return null;

  try {
    const data = (await response.json()) as RemoteState;

    const topics: Record<string, TopicProgress> = {};
    for (const topic of data.topics ?? []) {
      topics[topic.topicId] = {
        status: topic.status,
        minutes: topic.minutes,
        notes: topic.notes ?? undefined,
        updatedAt: topic.updatedAt,
      };
    }

    return {
      topics,
      sessions: (data.sessions ?? []).map((session) => ({
        date: session.date,
        minutes: session.minutes,
        topicId: session.topicId ?? undefined,
      })),
    };
  } catch {
    return null;
  }
}

/** Importa o estado local para o banco (usado na migração inicial). */
export async function pushState(state: SyncedState): Promise<boolean> {
  const response = await request(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      topics: Object.entries(state.topics).map(([topicId, entry]) => ({
        topicId,
        ...entry,
      })),
      sessions: state.sessions,
    }),
  });

  return response !== null;
}

/** Grava um único tópico. */
export async function pushTopic(
  topicId: string,
  entry: TopicProgress,
): Promise<void> {
  await request('/api/topic', {
    method: 'PATCH',
    body: JSON.stringify({ topicId, ...entry }),
  });
}

/** Registra uma sessão de estudo. */
export async function pushSession(session: StudySession): Promise<void> {
  await request('/api/session', {
    method: 'POST',
    body: JSON.stringify(session),
  });
}

/** Zera o progresso no banco. */
export async function clearRemoteState(): Promise<void> {
  await request(ENDPOINT, { method: 'DELETE' });
}
