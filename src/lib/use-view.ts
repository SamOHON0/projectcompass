"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Which section of a role view is showing. Kept in the URL hash so a section
 * survives a reload and can be linked to, without turning each section into a
 * separate route (the preview harness mounts the page components directly and
 * has no router).
 */
export function useView<V extends string>(initial: V, allowed: readonly V[]) {
  const [view, setView] = useState<V>(initial);

  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "") as V;
    if (fromHash && allowed.includes(fromHash)) setView(fromHash);
    // Read once on mount; later changes come through change() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = useCallback(
    (next: V) => {
      setView(next);
      const url = next === allowed[0] ? window.location.pathname : `#${next}`;
      window.history.replaceState(null, "", url);
      window.scrollTo({ top: 0 });
    },
    [allowed]
  );

  return [view, change] as const;
}
