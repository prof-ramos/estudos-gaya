// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';

const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

const ModernDashboard = Loadable(lazy(() => import('../views/dashboards/modern')));
const Error = Loadable(lazy(() => import('../views/auth/error')));

const EditalPage = Loadable(lazy(() => import('../views/pages/edital')));
const RevisaoPage = Loadable(lazy(() => import('../views/pages/revisao')));
const SessoesPage = Loadable(lazy(() => import('../views/pages/sessoes')));
const EstatisticasPage = Loadable(lazy(() => import('../views/pages/estatisticas')));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { index: true, element: <ModernDashboard /> },
      { path: 'edital', element: <EditalPage /> },
      { path: 'revisao', element: <RevisaoPage /> },
      { path: 'sessoes', element: <SessoesPage /> },
      { path: 'estatisticas', element: <EstatisticasPage /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '404', element: <Error /> },
      { path: 'auth/404', element: <Error /> },
      { path: '*', element: <Error /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;
