"use client";
import { Segmented } from "./ui";
export function ProjectsTabs({ value }: { value: "kanban" | "temps" | "maintenance" }) {
  return <Segmented value={value} options={[{ value: "kanban", label: "Kanban", href: "/projets" }, { value: "temps", label: "Temps", href: "/projets/temps" }, { value: "maintenance", label: "Maintenance", href: "/projets/maintenance" }]} />;
}
