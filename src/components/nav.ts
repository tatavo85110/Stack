import { Home, LayoutGrid, Users, FolderKanban, Link2, BarChart3 } from "lucide-react";
export const mainNav = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/applis", label: "Applis", icon: LayoutGrid },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projets", label: "Projets", icon: FolderKanban },
  { href: "/raccourcis", label: "Raccourcis", icon: Link2 },
];
export const topTabs = [
  { href: "/", label: "Accueil" },
  { href: "/applis", label: "Applis" },
  { href: "/clients", label: "Clients" },
  { href: "/projets", label: "Projets" },
  { href: "/clients/stats", label: "Stats", icon: BarChart3 },
];
/** Returns true when `href` is the section of `path` (Stats wins over Clients for /clients/stats). */
export function isActive(href: string, path: string) {
  if (href === "/") return path === "/";
  if (href === "/clients" && path.startsWith("/clients/stats")) return false;
  return path === href || path.startsWith(href + "/");
}
