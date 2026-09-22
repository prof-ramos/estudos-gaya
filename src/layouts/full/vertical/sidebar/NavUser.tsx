import { BookMarked, ChartBar } from 'lucide-react';
import { Link } from 'react-router';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupContent,
  SidebarGroup,
} from '@/components/ui/sidebar';

/** Atalhos rápidos no rodapé da sidebar. */
export function NavUser() {
  const navItems = [
    {
      title: 'Edital verticalizado',
      url: '/edital',
      icon: BookMarked,
    },
    {
      title: 'Estatísticas',
      url: '/estatisticas',
      icon: ChartBar,
    },
  ];

  return (
    <SidebarGroup className="mt-auto p-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton size="lg" className="h-full cursor-pointer">
                <Link to={item.url}>
                  <div className="flex w-full items-center gap-3">
                    <item.icon className="size-5 shrink-0 shadow-none" />
                    <div className="hide-menu flex flex-1 flex-col text-left text-sm leading-tight whitespace-nowrap">
                      <span className="truncate font-medium">{item.title}</span>
                    </div>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
