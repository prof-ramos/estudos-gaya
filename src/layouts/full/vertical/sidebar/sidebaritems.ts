export interface ChildItem {
  id?: number | string;
  name: string;
  icon?: LucideIcon;
  items?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  badgeContent?: string;
  isActive?: boolean;
  external?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: LucideIcon;
  id?: number;
  to?: string;
  item?: MenuItem[];
  items?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  badgeContent?: string;
  isActive?: boolean;
}

import { uniqueId } from "lodash";

import {
  LucideIcon,
  House,
  ListChecks,
  BookMarked,
  CalendarCheck,
  BarChart3,
} from "lucide-react"

const SidebarContent: MenuItem[] = [
  {
    heading: "Estudos",
    items: [
      {
        id: uniqueId(),
        name: "Visão Geral",
        icon: House,
        url: "/",
      },
      {
        id: uniqueId(),
        name: "Edital",
        icon: BookMarked,
        url: "/edital",
      },
    ],
  },
  {
    heading: "Revisão",
    items: [
      {
        id: uniqueId(),
        name: "Revisão",
        icon: ListChecks,
        url: "/revisao",
      },
    ],
  },
  {
    heading: "Desempenho",
    items: [
      {
        id: uniqueId(),
        name: "Sessões",
        icon: CalendarCheck,
        url: "/sessoes",
      },
      {
        id: uniqueId(),
        name: "Estatísticas",
        icon: BarChart3,
        url: "/estatisticas",
      },
    ],
  },
];

export default SidebarContent;
