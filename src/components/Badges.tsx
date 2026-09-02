import type { Rag } from "@/lib/types";

export function RagPill({ rag }: { rag: Rag }) {
  const label = rag === "green" ? "Green" : rag === "amber" ? "Amber" : "Red";
  return <span className={`pill pill-${rag}`}>{label}</span>;
}

export function NewPill() {
  return <span className="pill pill-new">New</span>;
}
