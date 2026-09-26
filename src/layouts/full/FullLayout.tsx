import { FC } from 'react';
import Sidebar from './vertical/sidebar/Sidebar';
import Header from './vertical/header/Header';
import { SidebarInset, SidebarProvider } from 'src/components/ui/sidebar';
import { cn } from 'src/lib/utils';
import Footer from './shared/footer/Footer';
import { Outlet } from 'react-router';
import PageMetadata from './shared/metadata/PageMetadata';

const FullLayout: FC = () => {
  return (
    <SidebarProvider
      defaultOpen={true}
      style={{ '--sidebar-width-icon': '52px' } as React.CSSProperties}
    >
      <Sidebar id="app-sidebar" />

      <SidebarInset className="m-0 min-w-0 overflow-x-clip rounded-none outline outline-border md:m-2">
        <Header />

        <div className="flex min-w-0 flex-1 flex-col gap-4 p-3 sm:p-4">
          <div className={cn('container mx-auto w-full min-w-0')}>
            <PageMetadata />
            <div className="min-h-[calc(100vh-140px)] min-w-0">
              <Outlet />
            </div>
            <div className="pt-6">
              <Footer />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default FullLayout;
