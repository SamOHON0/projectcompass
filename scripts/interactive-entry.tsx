// Interactive test harness entry. Mounts the real components in a browser so
// the click-through flows can be exercised end to end. Not part of the app.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import WorkerPage from "@/app/worker/page";
import ManagerPage from "@/app/manager/page";
import { CompassProvider } from "@/lib/store";

function Harness() {
  const [route, setRoute] = useState(location.hash === "#manager" ? "manager" : "worker");
  // The real app routes with next/link; here we intercept clicks on those
  // anchors so both views share one provider and one in-memory state.
  return (
    <div
      onClick={(e) => {
        const a = (e.target as HTMLElement).closest("a");
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (href === "/worker" || href === "/manager") {
          e.preventDefault();
          setRoute(href.slice(1));
        }
      }}
    >
      {route === "worker" ? <WorkerPage /> : <ManagerPage />}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <CompassProvider>
    <Harness />
  </CompassProvider>
);
