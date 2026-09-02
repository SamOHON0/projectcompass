import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { CompassProvider } from "@/lib/store";
import ErrorBoundary from "@/components/ErrorBoundary";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  title: "Compass · Prototype",
  description:
    "Project Compass prototype. An intelligent colleague for frontline homelessness services. Demonstration only: every resident, staff member and event is invented.",
  // A public demo containing realistic-looking care records should not be
  // indexed, cached or surfaced in search.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: `${figtree.style.fontFamily}, -apple-system, "Segoe UI", Roboto, sans-serif` }}>
        <ErrorBoundary>
          <CompassProvider>{children}</CompassProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
