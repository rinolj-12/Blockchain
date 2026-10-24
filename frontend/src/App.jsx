import React, { Component, useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Notice from "./components/Notice.jsx";
import { deployment } from "./lib/deployment.js";
import { friendlyError, useToasts, useVaultState } from "./lib/chain.js";
import { WalletProvider } from "./lib/wallet.jsx";
import Admin from "./screens/Admin.jsx";
import Staff from "./screens/Staff.jsx";
import College from "./screens/College.jsx";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <main className="page" style={{ padding: "40px 20px" }}>
          <div className="card" style={{ maxWidth: "620px", margin: "40px auto", textAlign: "center" }}>
            <span style={{ fontSize: "40px" }}>⚠️</span>
            <h2 className="h2" style={{ margin: "14px 0 8px" }}>Interface Render Notice</h2>
            <p className="muted small" style={{ margin: "0 0 18px", wordBreak: "break-word" }}>
              {this.state.error?.message || "An unexpected render error occurred in the portal."}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                🔄 Reload Portal
              </button>
              <button className="btn btn-ghost" onClick={() => { window.location.hash = "#/admin"; window.location.reload(); }}>
                Admin Portal
              </button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

/**
 * Supports both clean URLs (/admin, /staff/2, /college, /setup) and Hash URLs (#/admin, #/staff/2, #/college, #/setup)
 */
function parseRoute() {
  const hash = window.location.hash ? window.location.hash.replace(/^#\/?/, "") : "";
  const path = hash || window.location.pathname.replace(/^\//, "");
  const clean = path.split("?")[0].replace(/\/+$/, "");
  const parts = clean.split("/");
  const primary = parts[0]?.toLowerCase() || "";

  if (primary === "staff") {
    const id = parseInt(parts[1], 10);
    return { name: "staff", staffId: !isNaN(id) && id >= 1 && id <= 5 ? id : 1 };
  }
  if (primary === "college") {
    return { name: "college" };
  }
  return { name: "admin" };
}

function useRoute() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    const onNavigate = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onNavigate);
    window.addEventListener("popstate", onNavigate);
    return () => {
      window.removeEventListener("hashchange", onNavigate);
      window.removeEventListener("popstate", onNavigate);
    };
  }, []);
  return route;
}

function NotDeployed() {
  return (
    <main className="page">
      <div className="card empty-card">
        <h1 className="h1">Vault not deployed yet</h1>
        <p className="muted">
          Start a local chain and deploy the contracts, then reload this page:
        </p>
        <pre className="code">npm run node{"\n"}npm run demo:setup</pre>
      </div>
    </main>
  );
}

function Portal() {
  const route = useRoute();
  const { state, error, refresh } = useVaultState();
  const { toasts, removeToast } = useToasts();

  let body;
  if (!state) {
    body = error ? (
      <div className="card empty-card">
        <h1 className="h1">Cannot reach the vault</h1>
        <p className="muted">
          No answer from <span className="mono">{deployment.rpcUrl}</span>. Is the Hardhat node running
          (<span className="mono">npm run node</span>)?
        </p>
        <p className="muted small">{friendlyError(error)}</p>
      </div>
    ) : (
      <div className="card empty-card"><p className="muted">Reading the vault…</p></div>
    );
  } else if (route.name === "staff") {
    body = <Staff vault={state} refresh={refresh} staffId={route.staffId || 1} />;
  } else if (route.name === "college") {
    body = <College vault={state} refresh={refresh} />;
  } else {
    body = <Admin vault={state} refresh={refresh} />;
  }

  return (
    <>
      {/* Real-time Multi-Tab HUD Toast Notifications */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.tone || "mint"}`}>
            <span className="toast-icon">{t.icon || "🛡️"}</span>
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              <div className="toast-msg">{t.message}</div>
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Dismiss Notification">✕</button>
          </div>
        ))}
      </div>

      <Header route={route} vault={state} />
      <main className="page">
        {state && error && (
          <Notice tone="red">Lost contact with the chain, showing the last known state. {friendlyError(error)}</Notice>
        )}
        {body}
      </main>
      <footer className="footer muted small">
        ExamVault Smart Contract <span className="mono">{deployment.vault}</span> · Chain ID {deployment.chainId}
        {state ? <> · Block #{state.blockNumber}</> : null}
      </footer>
    </>
  );
}

export default function App() {
  if (!deployment) return <NotDeployed />;
  return (
    <ErrorBoundary>
      <WalletProvider>
        <Portal />
      </WalletProvider>
    </ErrorBoundary>
  );
}
