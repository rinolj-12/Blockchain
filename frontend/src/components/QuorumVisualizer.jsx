import { useState } from "react";
import { PadlockIcon } from "./Icons.jsx";
import { shortAddr, PAPER_NAMES, fmtCountdown } from "../lib/format.js";
import { useChainNow } from "../lib/chain.js";

/**
 * Unified 3-of-5 Holographic Custodian Quorum & Slashing Visualizer
 *
 * Combines:
 * 1. Cryptographic 3-of-5 Shamir Secret Sharing threshold progress & entropy consensus
 * 2. Real-time Custodian Slashing Status Roster, stake deposit protection (1.00 ETH),
 *    countdown timers, and quick custodian switching.
 *
 * Supports 3 role contexts:
 * - "staff": Complete command center with live slashing risk, duty fulfillment, and quick-switching
 * - "college": Exam hall decryption readiness monitor (read-only, no staff switching links)
 * - "admin": Central administrative protocol overview
 */
export function QuorumVisualizer({
  vault,
  role = "admin", // "staff" | "college" | "admin"
  showStaffNodes = role !== "college",
  currentStaffIndex = null,
  isRevealPhase: propIsRevealPhase,
  isSeedPhase: propIsSeedPhase,
  revealTimeLeft: propRevealTimeLeft,
  seedTimeLeft: propSeedTimeLeft,
  revealMinutesLeft: propRevealMinutesLeft,
  revealWindowMinutes: propRevealWindowMinutes,
  onSelectStaff,
}) {
  const [hoveredStaff, setHoveredStaff] = useState(null);
  const [selectedFingerprintNode, setSelectedFingerprintNode] = useState(null);
  const now = useChainNow();

  const v = vault || {};
  const staffList = v?.staff || [];
  const piecesRevealed = Number(v?.piecesRevealed || 0);
  const seedsRevealed = Number(v?.seedsRevealed || 0);
  const paperSelected = Boolean(v?.paperSelected);
  const selectedPaper = Number(v?.selectedPaper || 0);
  const isUnlocked = Boolean(v?.unlocked || piecesRevealed >= 3);

  // Time and Phase calculations (fallback to self-computation if not passed)
  const timeLeft = v.examTime > now ? v.examTime - now : 0;
  const isSeedPhase = propIsSeedPhase !== undefined ? propIsSeedPhase : (v.examTime > 0 && timeLeft === 0 && !paperSelected);
  const isRevealPhase = propIsRevealPhase !== undefined ? propIsRevealPhase : (v.examTime > 0 && timeLeft === 0 && paperSelected);

  const seedWindowDuration = v.seedWindow || 120;
  const seedDeadline = v.examTime + seedWindowDuration;
  const seedTimeLeft = propSeedTimeLeft !== undefined ? propSeedTimeLeft : Math.max(0, seedDeadline - now);

  const revealWindowDuration = v.revealWindow || 600;
  const revealDeadline = (v.selectedAt || v.examTime) + revealWindowDuration;
  const revealTimeLeft = propRevealTimeLeft !== undefined ? propRevealTimeLeft : Math.max(0, revealDeadline - now);
  const revealMinutesLeft = propRevealMinutesLeft !== undefined ? propRevealMinutesLeft : Math.ceil(revealTimeLeft / 60);
  const revealWindowMinutes = propRevealWindowMinutes !== undefined ? propRevealWindowMinutes : Math.round(revealWindowDuration / 60);

  // Active phase metrics
  const activeCount = paperSelected ? piecesRevealed : seedsRevealed;
  const thresholdPct = Math.min(100, Math.round((activeCount / 3) * 100));

  // 5 nodes positions in responsive layout
  const nodes = [1, 2, 3, 4, 5].map((idx) => {
    const s = staffList.find((item) => item.index === idx) || staffList[idx - 1] || {};
    const pieceRevealed = Boolean(s.pieceRevealed);
    const seedRevealed = Boolean(s.seedRevealed);
    const isPenalised = Boolean(s.penalised);
    const isCurrent = currentStaffIndex === idx;

    let cardClass = "item-protected";
    let statusBadge = <span className="pill pill-mint small">✓ Safe (0% Slash)</span>;
    let statusMsg = "Key Verified · 1.00 ETH Safe";
    let orbIcon = "✓";

    if (isPenalised) {
      cardClass = "item-slashed";
      statusBadge = <span className="pill pill-red small">🚨 Slashed</span>;
      statusMsg = "-0.50 ETH Slashed (Delinquent)";
      orbIcon = "🚨";
    } else if (pieceRevealed) {
      cardClass = "item-protected";
      statusBadge = <span className="pill pill-mint small">✓ Protected</span>;
      statusMsg = "Key Verified · 1.00 ETH Safe";
      orbIcon = "✓";
    } else if (isRevealPhase && !seedRevealed) {
      cardClass = "item-slashed";
      statusBadge = <span className="pill pill-red small">🚨 Missed Seed</span>;
      statusMsg = "Missed Seed · -0.50 ETH";
      orbIcon = "🚨";
    } else if (isRevealPhase && revealTimeLeft > 0) {
      cardClass = "item-at-risk";
      statusBadge = <span className="pill pill-amber small">⚠️ {fmtCountdown(revealTimeLeft)}</span>;
      statusMsg = `Upload in ${revealMinutesLeft}m or -0.50 ETH`;
      orbIcon = "⚠️";
    } else if (isRevealPhase && revealTimeLeft === 0) {
      cardClass = "item-slashed";
      statusBadge = <span className="pill pill-red small">🚨 Expired</span>;
      statusMsg = "Missed Deadline · -0.50 ETH";
      orbIcon = "🚨";
    } else if (isSeedPhase && !seedRevealed) {
      if (seedTimeLeft === 0) {
        cardClass = "item-slashed";
        statusBadge = <span className="pill pill-red small">🚨 Expired</span>;
        statusMsg = "Missed Seed · -0.50 ETH";
        orbIcon = "🚨";
      } else {
        cardClass = "item-at-risk";
        statusBadge = <span className="pill pill-amber small">🎲 Seed Due</span>;
        statusMsg = `Seed Pending · ${fmtCountdown(seedTimeLeft)}`;
        orbIcon = "🎲";
      }
    } else if (seedRevealed && !paperSelected) {
      cardClass = "item-protected";
      statusBadge = <span className="pill pill-mint small">🎲 Seed ✓</span>;
      statusMsg = "Seed Contributed · Ready";
      orbIcon = "🎲";
    } else {
      cardClass = "item-protected";
      statusBadge = <span className="pill pill-muted small">⏳ Escrow</span>;
      statusMsg = "1.00 ETH Staked Active";
      orbIcon = `#${idx}`;
    }

    return {
      index: idx,
      address: s.address || "",
      pieceRevealed,
      seedRevealed,
      isPenalised,
      isCurrent,
      cardClass,
      statusBadge,
      statusMsg,
      orbIcon,
      stake: s.stake ? Number(s.stake) / 1e18 : 1.0,
      commits: s.pieceCommits || [],
    };
  });

  return (
    <div className="quorum-visualizer-card">
      {/* Background Holographic Overlay */}
      <div className="quorum-grid-overlay" />

      {/* Header */}
      <div className="quorum-header">
        <div>
          <span className="eyebrow" style={{ color: "var(--mint)" }}>
            {role === "staff"
              ? "ALL 5 CUSTODIANS — LIVE 3-OF-5 QUORUM & SLASHING ROSTER"
              : role === "college"
              ? "EXAM CENTRE DECRYPTION CONSENSUS"
              : "HOLOGRAPHIC THRESHOLD ENGINE"}
          </span>
          <h3 className="card-title" style={{ margin: "4px 0 0", fontSize: "19px" }}>
            {role === "staff"
              ? "3-of-5 Shamir Custodian Quorum & Slashing Roster"
              : role === "college"
              ? "3-of-5 Custodian Decryption Quorum"
              : "3-of-5 Shamir Custodian Quorum"}
          </h3>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            {role === "college"
              ? "The exam paper is encrypted with AES-256-GCM. Once any 3 keyholders upload their shares, this exam centre can decrypt and print the question paper."
              : !paperSelected
              ? "Stage 1: Custodians reveal entropy seeds to achieve random paper selection consensus."
              : isUnlocked
              ? "Stage 2: 3-of-5 Quorum reached! Decryption key assembled on blockchain. Custodians with fulfilled duty have 100% stake protected."
              : `Stage 2: Revealing Shamir shares for Paper ${PAPER_NAMES[selectedPaper]}. Custodians must submit before deadline to avoid a 50% (0.50 ETH) stake slash.`}
          </p>
        </div>

        <div className="quorum-badge-wrapper" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {role === "staff" && (
            <span className="pill pill-muted mono small">
              {piecesRevealed}/5 Uploaded · {isUnlocked ? "Quorum Met" : "Awaiting Quorum"}
            </span>
          )}
          <div className={`quorum-status-pill ${isUnlocked ? "unlocked" : "locked"}`}>
            <span className="dot" style={{ background: isUnlocked ? "var(--mint)" : "var(--amber)" }} />
            <span>
              {isUnlocked
                ? role === "college"
                  ? "✓ DECRYPTION READY (QUORUM REACHED)"
                  : "VAULT UNLOCKED (QUORUM REACHED)"
                : !paperSelected
                ? `CONSENSUS: ${seedsRevealed}/3 SEEDS`
                : `QUORUM: ${piecesRevealed}/3 SHARES (PAPER ${PAPER_NAMES[selectedPaper]})`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Holographic Canvas */}
      <div className="quorum-stage">
        {/* Central Core & Progress Info Panel */}
        <div className="quorum-core-panel">
          <div className={`quorum-core ${isUnlocked ? "core-unlocked" : "core-locked"}`}>
            {/* Concentric Progress Ring */}
            <svg className="core-progress-ring" width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" className="ring-bg" />
              <circle
                cx="60"
                cy="60"
                r="48"
                className="ring-bar"
                transform="rotate(-90 60 60)"
                style={{
                  strokeDasharray: "301.6",
                  strokeDashoffset: `${301.6 - (301.6 * thresholdPct) / 100}`,
                  stroke: isUnlocked ? "var(--mint)" : "var(--amber)",
                }}
              />
            </svg>

            {/* Core Center Content */}
            <div className="core-inner">
              <PadlockIcon size={24} open={isUnlocked} color={isUnlocked ? "#04201A" : "#F5B94A"} strokeWidth={2.4} />
              <div className="core-stat mono">{activeCount}/3</div>
              <div className="core-label">{isUnlocked ? "UNLOCKED" : !paperSelected ? "SEEDS" : "QUORUM"}</div>
            </div>
          </div>

          <div className="quorum-core-info">
            <div className="quorum-core-title">
              {isUnlocked
                ? `✓ 3-of-5 Quorum Achieved: Paper ${PAPER_NAMES[selectedPaper]} Unlocked`
                : !paperSelected
                ? seedsRevealed >= 3
                  ? "✓ 3 Seeds Collected: Entropy Consensus Ready"
                  : `Collecting Custodian Entropy: ${seedsRevealed} of 3 Seeds Submitted`
                : `Awaiting Key Shares: ${piecesRevealed} of 3 Pieces for Paper ${PAPER_NAMES[selectedPaper]}`}
            </div>
            <p className="muted small" style={{ margin: "4px 0 10px", lineHeight: 1.5 }}>
              {isUnlocked
                ? role === "college"
                  ? "The AES-256 decryption key has been reassembled on Ethereum. Exam centre invigilators can now execute Download & Decrypt to print the official paper."
                  : "The AES-256 decryption key has been mathematically reconstructed on Ethereum. Authorized exam centres can now download and decrypt the paper."
                : !paperSelected
                ? "Custodians upload their confidential seed number. The contract XORs them to deterministically select Paper A, B, or C on-chain."
                : `Candidate Paper ${PAPER_NAMES[selectedPaper]} was selected on-chain! Any 3 staff members must now reveal their Paper ${PAPER_NAMES[selectedPaper]} Shamir key piece.`}
            </p>
            <div className="quorum-progress-track">
              <div
                className="quorum-progress-fill"
                style={{
                  width: `${(activeCount / 3) * 100}%`,
                  background: isUnlocked ? "var(--mint)" : "var(--amber)",
                }}
              />
            </div>
          </div>
        </div>

        {/* 5 Custodian Nodes in a 5-Column Grid (Hidden on College View) */}
        {showStaffNodes && (
          <div className="quorum-nodes-row">
            {nodes.map((node) => {
              const isPieceDone = node.pieceRevealed;
              const isSeedDone = node.seedRevealed;
              const isActive = isPieceDone || (!paperSelected && isSeedDone);
              const isHovered = hoveredStaff === node.index;

              return (
                <div
                  key={node.index}
                  className={`custodian-node-card ${node.cardClass} ${node.isCurrent ? "active-item" : ""} ${isActive ? "node-active" : "node-idle"} ${isHovered ? "node-hovered" : ""}`}
                  onMouseEnter={() => setHoveredStaff(node.index)}
                  onMouseLeave={() => setHoveredStaff(null)}
                  onClick={() => onSelectStaff?.(node.index)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div className="node-orb">
                      {node.orbIcon === "✓" ? (
                        <span className="node-check">✓</span>
                      ) : node.orbIcon === "🎲" ? (
                        <span className="node-check" style={{ color: "var(--amber)" }}>🎲</span>
                      ) : node.orbIcon === "⚠️" ? (
                        <span style={{ color: "var(--amber)", fontSize: "14px" }}>⚠️</span>
                      ) : node.orbIcon === "🚨" ? (
                        <span style={{ color: "var(--red)", fontSize: "14px" }}>🚨</span>
                      ) : (
                        <span className="node-num mono">#{node.index}</span>
                      )}
                    </div>
                    {role === "staff" ? (
                      node.statusBadge
                    ) : (
                      <span className={`pill small ${isPieceDone ? "pill-mint" : isSeedDone ? "pill-amber" : "pill-muted"}`}>
                        {isPieceDone ? "Key ✓" : isSeedDone ? "Seed ✓" : "Pending"}
                      </span>
                    )}
                  </div>

                  <div className="node-info">
                    <div className="node-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>Staff #{node.index}</span>
                      {node.isCurrent && (
                        <span className="pill pill-primary small mono" style={{ padding: "1px 6px", fontSize: "10px" }}>
                          Viewing
                        </span>
                      )}
                    </div>
                    <div className="node-addr mono small muted" title={node.address}>
                      {shortAddr(node.address)}
                    </div>
                    {role === "staff" && (
                      <div
                        className="node-status-line"
                        style={{
                          color: isPieceDone ? "var(--mint)" : isRevealPhase && !isPieceDone ? "var(--amber)" : "var(--muted)",
                          fontWeight: 500,
                        }}
                      >
                        {node.statusMsg}
                      </div>
                    )}
                  </div>

                  {role === "staff" ? (
                    node.isCurrent ? (
                      <div className="node-current-badge">Viewing Portal</div>
                    ) : (
                      <a
                        href={`#/staff/${node.index}`}
                        className="btn btn-ghost btn-sm"
                        style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}
                        title={`Switch to Custodian #${node.index}`}
                      >
                        Switch Custodian ↗
                      </a>
                    )
                  ) : role === "college" ? (
                    <div className="mono small muted" style={{ textAlign: "center", padding: "4px 0", fontSize: "11px" }}>
                      {isPieceDone ? "Verified On-Chain" : isSeedDone ? "Seed Registered" : "Awaiting Share"}
                    </div>
                  ) : (
                    <a
                      href={`#/staff/${node.index}`}
                      className="btn btn-ghost btn-sm"
                      style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}
                      title={`Open Staff #${node.index} Portal`}
                    >
                      Open ↗
                    </a>
                  )}

                  {/* Fingerprint Inspection Button */}
                  {node.commits?.length === 3 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{
                        fontSize: "10px",
                        padding: "2px 4px",
                        width: "100%",
                        justifyContent: "center",
                        marginTop: "2px",
                        borderColor: selectedFingerprintNode === node.index ? "var(--mint)" : "var(--border)",
                        color: selectedFingerprintNode === node.index ? "var(--mint)" : "var(--muted)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFingerprintNode(selectedFingerprintNode === node.index ? null : node.index);
                      }}
                      title="Inspect On-Chain Commitment Fingerprints"
                    >
                      🔒 Fingerprints {selectedFingerprintNode === node.index ? "▲" : "▼"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Expandable Fingerprints Inspector Panel */}
        {selectedFingerprintNode && (
          <div style={{ background: "rgba(10, 10, 14, 0.95)", border: "1px solid var(--mint-border)", borderRadius: "12px", padding: "14px 16px", marginTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>🔒</span>
                <strong style={{ fontSize: "13px", color: "var(--text)" }}>
                  Custodian #{selectedFingerprintNode} Cryptographic Commitments (ExamVault Storage)
                </strong>
                <span className="pill pill-mint small mono" style={{ fontSize: "10px", padding: "2px 8px" }}>
                  Sealed On-Chain
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "11px", padding: "2px 8px" }}
                onClick={() => setSelectedFingerprintNode(null)}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
              {["A", "B", "C"].map((pLetter, pIdx) => {
                const staffObj = nodes.find((s) => s.index === selectedFingerprintNode);
                const hash = staffObj?.commits?.[pIdx] || "";
                const isCommitted = hash && !/^0x0+$/.test(hash);
                return (
                  <div key={pLetter} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", fontWeight: "700", color: "var(--muted)", marginBottom: "4px" }}>
                      <span>PAPER {pLetter} COMMITMENT</span>
                      <span className={isCommitted ? "mint-text" : "amber-text"}>
                        {isCommitted ? "SEALED ✓" : "PENDING"}
                      </span>
                    </div>
                    <div className="mono small" style={{ fontSize: "11px", color: isCommitted ? "var(--mint)" : "var(--muted)", wordBreak: "break-all" }}>
                      {isCommitted ? hash : "0x0000000000000000000000000000000000000000000000000000000000000000"}
                    </div>
                    <div className="muted mono" style={{ fontSize: "9px", marginTop: "4px" }}>
                      keccak256(vault, staff, {pIdx}, piece)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Live Telemetry Bar */}
      <div className="quorum-telemetry-bar mono small">
        <div className="telemetry-item">
          <span className="muted">CRYPTOSYSTEM:</span>
          <span className="mint-text">Shamir (k=3, n=5) over GF(256)</span>
        </div>
        <div className="telemetry-item">
          <span className="muted">AES ENVELOPE:</span>
          <span>AES-256-GCM (256-bit Key)</span>
        </div>
        {role === "staff" ? (
          <>
            <div className="telemetry-item">
              <span className="muted">COLLATERAL ESCROW:</span>
              <span className="mint-text">1.00 ETH per Custodian</span>
            </div>
            <div className="telemetry-item">
              <span className="muted">SLASHING PENALTY:</span>
              <span className="amber-text">50% (0.50 ETH) on Missed Deadline</span>
            </div>
          </>
        ) : role === "college" ? (
          <>
            <div className="telemetry-item">
              <span className="muted">ACCESS CONTROL:</span>
              <span className="mint-text">Soulbound Token Verification</span>
            </div>
            <div className="telemetry-item">
              <span className="muted">ON-CHAIN DECRYPTION:</span>
              <span>Autonomous Smart Contract Assemble</span>
            </div>
          </>
        ) : (
          <div className="telemetry-item">
            <span className="muted">VERIFICATION:</span>
            <span>Keccak-256 Commitments On-Chain</span>
          </div>
        )}
      </div>
    </div>
  );
}


