import type { ReactNode } from "react";
import Link from "next/link";
import { SERVICE } from "@/lib/data";
import type { Role } from "@/lib/types";
import DemoBanner from "@/components/DemoBanner";

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  // A single first name gets its first two letters, so the avatar still reads.
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L15 12 L12 22 L9 12 Z" fill="currentColor" />
        <rect x="10" y="10" width="4" height="4" fill="var(--accent)" stroke="white" strokeWidth="1.4" />
      </svg>
    </span>
  );
}

export default function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const user = role === "worker" ? SERVICE.workerName : SERVICE.managerName;
  return (
    <div>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <DemoBanner />
      <header className="topbar">
        <Link href="/" className="brand">
          <BrandMark />
          Compass
        </Link>
        <span className="topbar-service">
          {SERVICE.name}, {SERVICE.location}
        </span>
        <div className="topbar-right">
          <nav className="role-switch" aria-label="Switch role view">
            <Link href="/worker" className={role === "worker" ? "active" : ""} aria-current={role === "worker" ? "page" : undefined}>
              Project Worker
            </Link>
            <Link href="/manager" className={role === "manager" ? "active" : ""} aria-current={role === "manager" ? "page" : undefined}>
              Manager
            </Link>
          </nav>
          <span className="avatar" title={user} aria-label={`Signed in as ${user}`} role="img">
            {initials(user)}
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
