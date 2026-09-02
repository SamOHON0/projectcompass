import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { CompassProvider } from "@/lib/store";
import ErrorBoundary from "@/components/ErrorBoundary";

// Clear Sans is not on Google Fonts. Source Sans 3 is the closest match
// available there: humanist, drawn for screen legibility, open apertures.
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

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
      <body className={sourceSans.variable}>
        <ErrorBoundary>
          <CompassProvider>{children}</CompassProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
