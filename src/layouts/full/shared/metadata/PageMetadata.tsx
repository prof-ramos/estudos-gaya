import { useEffect } from 'react';
import { useLocation } from 'react-router';

const METADATA: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Visão geral | Estudos Gaya',
    description:
      'Veja o progresso geral do plano de estudos para o TCDF, tempo estudado e distribuição por situação.',
  },
  '/edital': {
    title: 'Edital verticalizado | Estudos Gaya',
    description:
      'Consulte o edital verticalizado do TCDF, filtre tópicos e registre progresso e tempo de estudo.',
  },
  '/revisao': {
    title: 'Revisão | Estudos Gaya',
    description:
      'Organize os itens marcados para revisão, conteúdos em estudo e tópicos ainda não iniciados.',
  },
  '/sessoes': {
    title: 'Sessões de estudo | Estudos Gaya',
    description:
      'Acompanhe o histórico de sessões, tempo total de estudo, dias ativos e média diária.',
  },
  '/estatisticas': {
    title: 'Estatísticas | Estudos Gaya',
    description:
      'Analise o desempenho por disciplina, itens dominados, progresso percentual e tempo estudado.',
  },
};

export default function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = METADATA[pathname] ?? METADATA['/'];
    document.title = page.title;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }

    meta.content = page.description;
  }, [pathname]);

  return null;
}
