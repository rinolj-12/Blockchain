import { useState } from "react";
import { PadlockIcon } from "./Icons.jsx";
import { shortAddr, PAPER_NAMES } from "../lib/format.js";

/**
 * Interactive 3-of-5 Holographic Custodian Quorum Visualizer
 * Shows live on-chain threshold status with dynamic connection beams,
 * animated core, and support for both Entropy Seed & Key Share phases.
 */
export function QuorumVisualizer({ vault, onSelectStaff }) {
  const [hoveredStaff, setHoveredStaff] = useState(null);

  const staffList = vault?.staff || [];
  const piecesRevealed = Number(vault?.piecesRevealed || 0);
  const seedsRevealed = Number(vault?.seedsRevealed || 0);
  const paperSelected = Boolean(vault?.paperSelected);
  const selectedPaper = Number(vault?.selectedPaper || 0);
  const isUnlocked = Boolean(vault?.unlocked || piecesRevealed >= 3);

  // Active phase metrics
  const activeCount = paperSelected ? piecesRevealed : seedsRevealed;
  const thresholdPct = Math.min(100, Math.round((activeCount / 3) * 100));

  // 5 nodes positions in a responsive layout
  const nodes = [1, 2, 3, 4, 5].map((idx) => {
    const s = staffList.find((item) => item.index === idx) || staffList[idx - 1] || {};
    return {
      index: idx,
      address: s.address || "",
      pieceRevealed: Boolean(s.pieceRevealed),
      seedRevealed: Boolean(s.seedRevealed),
      piecesCommitted: Boolean(s.piecesCommitted),
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
          <span className="eyebrow" style={{ color: "var(--mint)" }}>HOLOGRAPHIC THRESHOLD ENGINE</span>
          <h3 className="card-title" style={{ margin: "4px 0 0", fontSize: "19px" }}>
            3-of-5 Shamir Custodian Quorum
          </h3>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            {!paperSelected
              ? "Stage 1: Custodians reveal entropy seeds to achieve random paper selection consensus."
              : isUnlocked
              ? "Stage 2: 3-of-5 Quorum reached! Decryption key assembled on blockchain."
              : `Stage 2: Revealing 32-byte Shamir shares for Paper ${PAPER_NAMES[selectedPaper]}.`}
          </p>
        </div>

        <div className="quorum-badge-wrapper">
          <div className={`quorum-status-pill ${isUnlocked ? "unlocked" : "locked"}`}>
            <span className="dot" style={{ background: isUnlocked ? "var(--mint)" : "var(--amber)" }} />
            <span>
              {isUnlocked
                ? "VAULT UNLOCKED (QUORUM REACHED)"
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
                ? "The AES-256 decryption key has been mathematically reconstructed on Ethereum. Authorized exam centres can now download and decrypt the paper."
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

        {/* 5 Custodian Nodes in a 5-Column Grid */}
        <div className="quorum-nodes-row">
          {nodes.map((node) => {
            const isPieceDone = node.pieceRevealed;
            const isSeedDone = node.seedRevealed;
            const isActive = isPieceDone || (!paperSelected && isSeedDone);
            const isHovered = hoveredStaff === node.index;

            return (
              <div
                key={node.index}
                className={`custodian-node-card ${isActive ? "node-active" : "node-idle"} ${isHovered ? "node-hovered" : ""}`}
                onMouseEnter={() => setHoveredStaff(node.index)}
                onMouseLeave={() => setHoveredStaff(null)}
                onClick={() => onSelectStaff?.(node.index)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div className="node-orb">
                    {isPieceDone ? (
                      <span className="node-check">✓</span>
                    ) : isSeedDone ? (
                      <span className="node-check" style={{ color: "var(--amber)" }}>🎲</span>
                    ) : (
                      <span className="node-num mono">#{node.index}</span>
                    )}
                  </div>
                  <span className={`pill small ${isPieceDone ? "pill-mint" : isSeedDone ? "pill-amber" : "pill-muted"}`}>
                    {isPieceDone ? "Key ✓" : isSeedDone ? "Seed ✓" : "Pending"}
                  </span>
                </div>

                <div className="node-info">
                  <div className="node-title">Staff #{node.index}</div>
                  <div className="node-addr mono small muted" title={node.address}>{shortAddr(node.address)}</div>
                </div>

                <a
                  href={`#/staff/${node.index}`}
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}
                  title={`Open Staff #${node.index} Portal`}
                >
                  Open ↗
                </a>
              </div>
            );
          })}
        </div>
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
        <div className="telemetry-item">
          <span className="muted">VERIFICATION:</span>
          <span>Keccak-256 Commitments On-Chain</span>
        </div>
      </div>
    </div>
  );
}


