import { PadlockIcon } from "./Icons.jsx";
import { fmtCountdown, PAPER_NAMES } from "../lib/format.js";
import { useChainNow } from "../lib/chain.js";

const PORTALS = [
  { route: "admin", step: "1", label: "Admin Portal", icon: "🏛️", href: "#/admin" },
  { route: "staff", step: "2", label: "Key Custodians", icon: "👥", href: "#/staff/1" },
  { route: "college", step: "3", label: "Exam Centre", icon: "🏫", href: "#/college" },
];

export default function Header({ route, vault }) {
  const now = useChainNow();
  const currentRouteName = typeof route === "string" ? route : route?.name || "admin";
  const activeStaffId = route?.staffId || 1;

  const timeLeft = vault?.examTime > now ? vault.examTime - now : 0;
  const isUnlocked = Boolean(vault?.unlocked || (vault?.piecesRevealed || 0) >= 3);
  const paperSelected = Boolean(vault?.paperSelected);
  const selectedPaper = Number(vault?.selectedPaper || 0);
  const seedsRevealed = Number(vault?.seedsRevealed || 0);
  const piecesRevealed = Number(vault?.piecesRevealed || 0);

  // Determine system-wide phase for connected live status pill
  let phaseLabel = "AWAITING SCHEDULE";
  let phaseTone = "pill-muted";
  if (vault?.examTime > 0) {
    if (timeLeft > 0) {
      phaseLabel = `PHASE 1: COUNTDOWN (${fmtCountdown(timeLeft)})`;
      phaseTone = "pill-amber";
    } else if (isUnlocked) {
      phaseLabel = `PHASE 3: UNLOCKED (3/3 KEYS)`;
      phaseTone = "pill-mint";
    } else if (paperSelected) {
      phaseLabel = `PHASE 2: PAPER ${PAPER_NAMES[selectedPaper]} (${piecesRevealed}/3 KEYS)`;
      phaseTone = "pill-mint";
    } else {
      phaseLabel = `PHASE 2: SEED ENTROPY (${seedsRevealed}/3 SEEDS)`;
      phaseTone = "pill-amber";
    }
  }

  // Determine which portal is the active stage in the protocol lifecycle
  let activeStageRoute = "admin";
  let activeStageBadge = "SCHEDULE EXAM";
  if (!vault || vault.examTime === 0) {
    activeStageRoute = "admin";
    activeStageBadge = "SCHEDULE";
  } else if (timeLeft > 0) {
    activeStageRoute = "admin";
    activeStageBadge = "COUNTDOWN";
  } else if (!isUnlocked) {
    activeStageRoute = "staff";
    activeStageBadge = !paperSelected ? "SEEDS NEEDED" : "KEYS NEEDED";
  } else {
    activeStageRoute = "college";
    activeStageBadge = "DECRYPT READY";
  }

  return (
    <header className="header">
      <div className="header-row header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <a className="logo" href="#/admin" title="ExamVault Home">
            <span className="logo-tile">
              <PadlockIcon size={17} color="#FFFFFF" strokeWidth={2.4} open={isUnlocked} />
            </span>
            <span className="logo-text">ExamVault</span>
          </a>

          {/* Global protocol status pill */}
          <span className={`pill ${phaseTone} small mono`}>
            <span className="dot" style={{ width: "6px", height: "6px" }} />
            {phaseLabel}
          </span>
        </div>

        <div className="wallet-area">
          <span className="wallet-pill">
            <span className="dot" style={{ background: "var(--mint)" }} />
            <span className="wallet-role">
              {currentRouteName === "admin" && "Central Admin"}
              {currentRouteName === "staff" && `Custodian #${activeStaffId}`}
              {currentRouteName === "college" && "Exam Centre (College)"}
            </span>
            <span className="mono small" style={{ fontWeight: 600 }}>
              {vault ? `Block #${vault.blockNumber}` : "Localnet"}
            </span>
          </span>
        </div>
      </div>

      <div className="header-row header-tabs">
        <nav className="nav" aria-label="Portal Navigation">
          {PORTALS.map((p) => {
            const isCurrentPage = currentRouteName === p.route;
            const isLifecycleActive = p.route === activeStageRoute;

            return (
              <a
                key={p.route}
                href={p.href}
                className={`nav-item ${isCurrentPage ? "nav-active" : ""}`}
                aria-current={isCurrentPage ? "page" : undefined}
              >
                <span>{p.icon} {p.label}</span>
                {isLifecycleActive && (
                  <span className="nav-stage-pill">{activeStageBadge}</span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Custodian sub-switcher when inside the Staff portal */}
        {currentRouteName === "staff" && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--surface)", padding: "3px 6px", borderRadius: "999px", border: "1px solid var(--border)" }}>
            <span className="muted mono" style={{ fontSize: "11px", padding: "0 4px" }}>Staff:</span>
            {[1, 2, 3, 4, 5].map((id) => {
              const isSel = activeStaffId === id;
              const staffObj = vault?.staff?.[id - 1];
              const isDone = staffObj?.pieceRevealed;
              const hasSeed = staffObj?.seedRevealed;

              return (
                <a
                  key={id}
                  href={`#/staff/${id}`}
                  className={`btn btn-sm ${isSel ? "btn-primary" : "btn-ghost"}`}
                  style={{
                    padding: "2px 8px",
                    fontSize: "12px",
                    borderRadius: "999px",
                    minWidth: "28px",
                    height: "24px",
                    lineHeight: "20px",
                  }}
                  title={`Switch to Staff #${id} (${isDone ? "Key Submitted" : hasSeed ? "Seed Revealed" : "Pending"})`}
                >
                  #{id} {isDone ? "✓" : hasSeed ? "🎲" : ""}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

