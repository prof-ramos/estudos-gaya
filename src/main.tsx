import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/css/globals.css';
import App from './App.tsx';
import Spinner from './views/spinner/Spinner.tsx';

import { ThemeProvider } from './context/shadcntheme/ThemeContext.tsx';

// Render imediato: nada bloqueia o first paint.
// (MSW e mocks do template foram removidos junto com o código morto.)
createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <Suspense fallback={<Spinner />}>
      <App />
    </Suspense>
  </ThemeProvider>,
);
