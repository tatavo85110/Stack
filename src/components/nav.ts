import { Home, LayoutGrid, Users, FolderKanban, Link2, BarChart3, Globe, NotebookPen, Sparkles, MoreHorizontal } from "lucide-react";
export const mainNav = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/applis", label: "Applis", icon: LayoutGrid },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projets", label: "Projets", icon: FolderKanban },
  { href: "/raccourcis", label: "Raccourcis", icon: Link2 },
  { href: "/site", label: "Mon site", icon: Globe },
  { href: "/notes", label: "Notes techniques", icon: NotebookPen },
  { href: "/assistant", label: "Assistant Claude", icon: Sparkles },
];
export const mobileNav = [...mainNav.slice(0, 4), { href: "/plus", label: "Plus", icon: MoreHorizontal }];
export const topTabs = [
  { href: "/", label: "Accueil" },
  { href: "/applis", label: "Applis" },
  { href: "/clients", label: "Clients" },
  { href: "/projets", label: "Projets" },
  { href: "/clients/stats", label: "Stats", icon: BarChart3 },
];
/** Public pages shown without the cockpit around them (shared with clients). */
export const PUBLIC_PAGES = ["/portail", "/statut"];
/** Returns true when `href` is the section of `path` (Stats wins over Clients for /clients/stats). */
export function isActive(href: string, path: string) {
  if (href === "/") return path === "/";
  if (href === "/clients" && path.startsWith("/clients/stats")) return false;
  if (href === "/plus") return ["/plus", "/raccourcis", "/site", "/notes", "/assistant", "/reglages"].some((p) => path.startsWith(p));
  return path === href || path.startsWith(href + "/");
}
