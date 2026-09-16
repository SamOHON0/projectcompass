"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SERVICE } from "@/lib/data";
import type { Role } from "@/lib/types";
import DemoBanner from "@/components/DemoBanner";

export interface ShellView<V extends string> {
  id: V;
  label: string;
  /** Shown as a badge beside the label when greater than zero. */
  count?: number;
  /** Highlights the badge when something in that section is new since the last look. */
  isNew?: boolean;
}

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

/**
 * The app frame: a sidebar carrying the sections of the current role view, the
 * primary action for that role, and the demo role switch. Each role page owns
 * which section is showing; the shell only draws the navigation for it.
 */
export default function AppShell<V extends string>({
  role,
  views,
  view,
  onViewChange,
  primaryAction,
  children,
}: {
  role: Role;
  views: ShellView<V>[];
  view: V;
  onViewChange: (view: V) => void;
  primaryAction?: { label: string; onClick: () => void };
  children: ReactNode;
}) {
  const user = role === "worker" ? SERVICE.workerName : SERVICE.managerName;
  const userRole = role === "worker" ? SERVICE.workerRole : SERVICE.managerRole;

  return (
    <div>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <DemoBanner />
      <div className="shell">
        <aside className="sidebar">
          <Link href="/" className="sidebar-brand">
            <BrandMark />
            <span className="sidebar-brand-text">
              <span className="brand-name">Compass</span>
              <span className="brand-service">
                {SERVICE.name}, {SERVICE.location}
              </span>
            </span>
          </Link>

          {primaryAction && (
            <button className="btn btn-primary sidebar-action" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </button>
          )}

          <nav className="nav" aria-label={`${userRole} sections`}>
            {views.map((v) => {
              const active = v.id === view;
              return (
                <button
                  key={v.id}
                  className={`nav-item ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onViewChange(v.id)}
                >
                  <span className="nav-label">{v.label}</span>
                  {v.count !== undefined && v.count > 0 && (
                    <span className={`nav-count ${v.isNew ? "is-new" : ""}`}>{v.count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-foot">
            <div className="role-switch-label" id="role-switch-label">
              Demo: switch view
            </div>
            <nav className="role-switch" aria-labelledby="role-switch-label">
              <Link
                href="/worker"
                className={role === "worker" ? "active" : ""}
                aria-current={role === "worker" ? "page" : undefined}
              >
                Project Worker
              </Link>
              <Link
                href="/manager"
                className={role === "manager" ? "active" : ""}
                aria-current={role === "manager" ? "page" : undefined}
              >
                Manager
              </Link>
            </nav>
            <div className="user-card">
              <span className="avatar" aria-hidden>
                {initials(user)}
              </span>
              <span className="user-text">
                <span className="user-name">{user}</span>
                <span className="user-role">{userRole}</span>
              </span>
            </div>
          </div>
        </aside>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}
