"use client";

import { useCompass } from "@/lib/store";

/**
 * Present on every screen. This prototype shows realistic-looking resident
 * records, risk levels and safeguarding notes, so it must never be mistakable
 * for a live system holding real people's data.
 */
export default function DemoBanner() {
  const { demoRan, resetDemo } = useCompass();
  return (
    <div className="demo-banner">
      <span className="demo-tag">Demo</span>
      <span className="demo-text">
        Prototype with invented data. No resident, staff member or event on this site is real.
      </span>
      {demoRan && (
        <button className="demo-reset" onClick={resetDemo}>
          Reset walkthrough
        </button>
      )}
    </div>
  );
}
