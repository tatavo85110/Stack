"use client";
import { Segmented } from "./ui";
export function ProjectsTabs({ value }: { value: "kanban" | "temps" | "activite" | "modeles" }) {
  return (
    <Segmented
      value={value}
      options={[
        { value: "kanban", label: "Kanban", href: "/projets" },
        { value: "temps", label: "Temps", href: "/projets/temps" },
        { value: "activite", label: "Activité", href: "/projets/activite" },
        { value: "modeles", label: "Modèles", href: "/projets/modeles" },
      ]}
    />
  );
}
