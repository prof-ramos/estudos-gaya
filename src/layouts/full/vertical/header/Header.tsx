import { useSidebar } from 'src/components/ui/sidebar';
import { Button } from 'src/components/ui/button';
import { PanelLeft } from 'lucide-react';
import { Separator } from 'src/components/ui/separator';
import { cn } from 'src/lib/utils';
import FullLogo from '../../shared/logo/FullLogo';
import Profile from './Profile';
import LightDark from './Light-Dark';

const Header = () => {
  const { toggleSidebar, isMobile, openMobile, open } = useSidebar();

  return (
    <header className={cn('sticky top-0 z-20 border-b border-border bg-background')}>
      <nav aria-label="Navegação principal">
        <div className="mx-auto flex flex-wrap items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <div className="block lg:hidden">
              <FullLogo />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-full p-2 transition hover:bg-primary/5"
              onClick={toggleSidebar}
              aria-label={isMobile ? 'Abrir menu de navegação' : 'Alternar menu lateral'}
              aria-expanded={isMobile ? openMobile : open}
              aria-controls="app-sidebar"
              title={isMobile ? 'Abrir menu' : 'Alternar menu lateral'}
            >
              <PanelLeft size={21} aria-hidden="true" />
            </Button>

            <Separator
              orientation="vertical"
              className="mr-4 ml-2 hidden h-4 w-px self-center bg-border lg:block"
            />
          </div>

          <div className="flex items-center gap-0 sm:gap-1">
            <LightDark />
            <Profile />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
