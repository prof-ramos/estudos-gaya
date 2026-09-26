import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import errorpage from '@/assets/images/backgrounds/404.svg';
import { useEffect } from 'react';

const Error = () => {
  useEffect(() => {
    document.title = 'Página não encontrada | Estudos Gaya';
    const description =
      'A página solicitada não foi encontrada no Estudos Gaya. Volte para a visão geral do plano de estudos.';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');

    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }

    meta.content = description;
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-xl text-center">
        <img
          src={errorpage}
          alt=""
          aria-hidden="true"
          className="mx-auto mb-8 h-auto w-full max-w-md"
          width={500}
          height={500}
        />
        <h1 className="mb-3 text-3xl font-semibold text-foreground sm:text-4xl">
          Página não encontrada
        </h1>
        <p className="mx-auto max-w-md text-base text-muted-foreground">
          O endereço pode estar incorreto ou a página pode ter sido removida.
        </p>
        <Button className="mx-auto mt-6" render={<Link to="/" />}>
          Voltar para o início
        </Button>
      </div>
    </main>
  );
};

export default Error;
