// Minimal ambient declarations for the Next.js APIs this app uses, so the
// sandbox can strict-typecheck src/ without installing next. These mirror the
// real signatures closely enough to catch misuse. Harness only: the deployed
// build uses the real types from the next package.

declare module "next" {
  export interface Metadata {
    title?: string | { default: string; template?: string };
    description?: string;
    robots?: string | { index?: boolean; follow?: boolean; nocache?: boolean };
    applicationName?: string;
    other?: Record<string, string | number | (string | number)[]>;
  }
}

declare module "next/link" {
  import type { AnchorHTMLAttributes, ReactNode } from "react";
  interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
    href: string;
    children?: ReactNode;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  }
  const Link: (props: LinkProps) => JSX.Element;
  export default Link;
}

declare module "next/font/google" {
  interface FontResult {
    className: string;
    variable: string;
    style: { fontFamily: string; fontWeight?: number; fontStyle?: string };
  }
  interface FontOptions {
    subsets?: string[];
    weight?: string | string[];
    style?: string | string[];
    display?: "auto" | "block" | "swap" | "fallback" | "optional";
    variable?: string;
    preload?: boolean;
    fallback?: string[];
  }
  export function Figtree(options?: FontOptions): FontResult;
}
