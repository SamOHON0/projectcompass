"use client";

import React from "react";

/**
 * Keeps a rendering fault from blanking the screen during a live demo.
 * Shows a recoverable panel instead, so the person presenting can carry on.
 */
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Compass prototype error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="page" role="main">
        <section className="card">
          <div className="card-head">
            <h2>Something went wrong in the prototype</h2>
          </div>
          <div className="card-body">
            <p style={{ marginTop: 0, color: "var(--ink-soft)" }}>
              This is a demo build, so nothing is lost. Reload to start the walkthrough again.
            </p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Reload the prototype
              </button>
            </div>
            <details style={{ marginTop: 16 }}>
              <summary className="field-label" style={{ cursor: "pointer" }}>
                Technical detail
              </summary>
              <pre className="error-detail">{this.state.error.message}</pre>
            </details>
          </div>
        </section>
      </main>
    );
  }
}
