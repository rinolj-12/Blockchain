import React from "react";
import { PadlockIcon } from "./Icons.jsx";

/**
 * 1. Compact Live 3-of-5 Quorum Pipeline Visual
 * Placed inside the Custodian Key Progress card on Admin and Staff screens.
 */
export function QuorumProgressVisual({ staff = [], piecesRevealed = 0, isUnlocked = false }) {
  const staffNodes = [1, 2, 3, 4, 5].map((idx) => {
    const member = staff.find((s) => s.index === idx) || staff[idx - 1];
    const isRevealed = member?.pieceRevealed || false;
    return { idx, isRevealed };
  });

  return (
    <div style={{ marginTop: "12px", marginBottom: "4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          background: "var(--surface-2)",
          padding: "10px 14px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
        }}
      >
        {/* 5 Custodian Nodes */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {staffNodes.map(({ idx, isRevealed }) => (
            <div
              key={idx}
              title={`Staff Custodian #${idx}: ${isRevealed ? "Key Share Revealed & Verified ✓" : "Pending Key Submission"}`}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: "700",
                background: isRevealed ? "var(--mint)" : "var(--surface)",
                color: isRevealed ? "var(--on-mint)" : "var(--muted)",
                border: isRevealed ? "1.5px solid var(--mint)" : "1px solid var(--border)",
                boxShadow: isRevealed ? "0 0 10px rgba(194, 128, 62, 0.4)" : "none",
                transition: "all 0.3s ease",
              }}
            >
              {isRevealed ? "✓" : `S${idx}`}
            </div>
          ))}

          {/* Threshold Divider */}
          <div
            style={{
              height: "24px",
              width: "1px",
              background: "var(--border)",
              margin: "0 4px",
            }}
          />

          <span
            className="mono small"
            style={{
              color: isUnlocked ? "var(--mint)" : "var(--muted)",
              fontWeight: "600",
            }}
          >
            {piecesRevealed}/3 Required
          </span>
        </div>

        {/* Central Vault Status Lock Indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "600",
            fontFamily: "var(--font-mono)",
            background: isUnlocked ? "var(--mint-tint)" : "var(--surface)",
            color: isUnlocked ? "var(--mint)" : "var(--amber)",
            border: `1px solid ${isUnlocked ? "var(--mint-border)" : "var(--border)"}`,
          }}
        >
          <PadlockIcon size={14} open={isUnlocked} color={isUnlocked ? "var(--mint)" : "var(--amber)"} />
          <span>{isUnlocked ? "UNLOCKED" : "LOCKED"}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Compact Soulbound Token Status Badge Visual
 * Placed inside the College Invigilator card.
 */
export function SoulboundBadgeVisual({ tokenId = 1, holdsToken = true }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "var(--surface-2)",
        padding: "6px 12px",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        marginTop: "8px",
        marginBottom: "12px",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span className="mono small" style={{ color: "var(--mint)", fontWeight: "600" }}>
        Token #{tokenId} · ERC-5192 Soulbound
      </span>
      <span
        style={{
          fontSize: "11px",
          padding: "2px 6px",
          borderRadius: "4px",
          background: "rgba(255, 255, 255, 0.06)",
          color: "var(--muted)",
        }}
      >
        🔒 Non-Transferable
      </span>
    </div>
  );
}

/**
 * 3. Architecture Vector Diagram: 3-of-5 Shamir Secret Sharing
 */
export function ShamirDiagram() {
  return (
    <svg viewBox="0 0 320 110" style={{ width: "100%", height: "auto", display: "block", margin: "10px 0" }}>
      {/* Background container */}
      <rect x="0" y="0" width="320" height="110" rx="8" fill="rgba(255,255,255,0.02)" />

      {/* AES Key Box */}
      <rect x="15" y="38" width="65" height="34" rx="6" fill="#18181f" stroke="#c2803e" strokeWidth="1.5" />
      <text x="47" y="54" fill="#dda268" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
        AES-256
      </text>
      <text x="47" y="66" fill="#9ca3af" fontSize="8" fontFamily="sans-serif" textAnchor="middle">
        Key
      </text>

      {/* Split Arrows */}
      <path d="M 80 55 L 115 22" stroke="#333338" strokeWidth="1.2" strokeDasharray="3 3" />
      <path d="M 80 55 L 115 38" stroke="#c2803e" strokeWidth="1.2" />
      <path d="M 80 55 L 115 55" stroke="#c2803e" strokeWidth="1.2" />
      <path d="M 80 55 L 115 72" stroke="#c2803e" strokeWidth="1.2" />
      <path d="M 80 55 L 115 88" stroke="#333338" strokeWidth="1.2" strokeDasharray="3 3" />

      {/* 5 Shares */}
      <circle cx="120" cy="22" r="7" fill="#121215" stroke="#333338" strokeWidth="1" />
      <text x="120" y="25" fill="#9ca3af" fontSize="7" fontFamily="monospace" textAnchor="middle">1</text>

      <circle cx="120" cy="38" r="7" fill="#1e1915" stroke="#c2803e" strokeWidth="1.2" />
      <text x="120" y="41" fill="#dda268" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">2</text>

      <circle cx="120" cy="55" r="7" fill="#1e1915" stroke="#c2803e" strokeWidth="1.2" />
      <text x="120" y="58" fill="#dda268" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">3</text>

      <circle cx="120" cy="72" r="7" fill="#1e1915" stroke="#c2803e" strokeWidth="1.2" />
      <text x="120" y="75" fill="#dda268" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">4</text>

      <circle cx="120" cy="88" r="7" fill="#121215" stroke="#333338" strokeWidth="1" />
      <text x="120" y="91" fill="#9ca3af" fontSize="7" fontFamily="monospace" textAnchor="middle">5</text>

      {/* Reconstruct Arrows (from 2, 3, 4) */}
      <path d="M 127 38 L 175 50" stroke="#c2803e" strokeWidth="1.2" />
      <path d="M 127 55 L 175 55" stroke="#c2803e" strokeWidth="1.2" />
      <path d="M 127 72 L 175 60" stroke="#c2803e" strokeWidth="1.2" />

      {/* Polynomial Interpolation Engine */}
      <rect x="175" y="40" width="55" height="30" rx="5" fill="#1e1915" stroke="#925824" strokeWidth="1" />
      <text x="202" y="53" fill="#dda268" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
        Lagrange
      </text>
      <text x="202" y="63" fill="#9ca3af" fontSize="7" fontFamily="monospace" textAnchor="middle">
        f(0) Quorum
      </text>

      {/* Unlocked Paper Arrow */}
      <path d="M 230 55 L 255 55" stroke="#c2803e" strokeWidth="1.5" />
      <polygon points="253,52 258,55 253,58" fill="#c2803e" />

      {/* Decrypted Paper Result */}
      <rect x="260" y="38" width="48" height="34" rx="4" fill="#18181f" stroke="#c2803e" strokeWidth="1.5" />
      <text x="284" y="53" fill="#dda268" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
        🔓 Clear
      </text>
      <text x="284" y="65" fill="#9ca3af" fontSize="8" fontFamily="sans-serif" textAnchor="middle">
        Exam Paper
      </text>
    </svg>
  );
}

/**
 * 4. Architecture Vector Diagram: Commit-Reveal Scheme
 */
export function CommitRevealDiagram() {
  return (
    <svg viewBox="0 0 320 110" style={{ width: "100%", height: "auto", display: "block", margin: "10px 0" }}>
      {/* Background container */}
      <rect x="0" y="0" width="320" height="110" rx="8" fill="rgba(255,255,255,0.02)" />

      {/* Phase 1: Commitment */}
      <rect x="10" y="16" width="138" height="78" rx="6" fill="#121215" stroke="#26262e" strokeWidth="1" />
      <text x="20" y="32" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold">
        PHASE 1: BEFORE EXAM
      </text>
      <text x="20" y="48" fill="#9ca3af" fontSize="8" fontFamily="sans-serif">
        Staff computes off-chain:
      </text>
      <rect x="20" y="54" width="118" height="20" rx="4" fill="#18181f" stroke="#5a3c12" strokeWidth="1" />
      <text x="79" y="67" fill="#f59e0b" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
        keccak256(piece, seed)
      </text>
      <text x="20" y="86" fill="#9ca3af" fontSize="7" fontFamily="sans-serif">
        🔒 Only hash stored on-chain
      </text>

      {/* Arrow between phases */}
      <path d="M 152 55 L 166 55" stroke="#c2803e" strokeWidth="1.5" />
      <polygon points="164,52 169,55 164,58" fill="#c2803e" />

      {/* Phase 2: Reveal & Verify */}
      <rect x="172" y="16" width="138" height="78" rx="6" fill="#1e1915" stroke="#925824" strokeWidth="1" />
      <text x="182" y="32" fill="#dda268" fontSize="8" fontFamily="monospace" fontWeight="bold">
        PHASE 2: AT DEADLINE
      </text>
      <text x="182" y="48" fill="#9ca3af" fontSize="8" fontFamily="sans-serif">
        Staff reveals raw piece + seed:
      </text>
      <rect x="182" y="54" width="118" height="20" rx="4" fill="#121215" stroke="#925824" strokeWidth="1" />
      <text x="241" y="67" fill="#dda268" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
        Hash(revealed) == Commit ✓
      </text>
      <text x="182" y="86" fill="#dda268" fontSize="7" fontFamily="sans-serif">
        Smart contract mathematically verifies
      </text>
    </svg>
  );
}

/**
 * 5. Architecture Vector Diagram: Soulbound Access Token (ERC-5192)
 */
export function SoulboundDiagram() {
  return (
    <svg viewBox="0 0 320 110" style={{ width: "100%", height: "auto", display: "block", margin: "10px 0" }}>
      {/* Background container */}
      <rect x="0" y="0" width="320" height="110" rx="8" fill="rgba(255,255,255,0.02)" />

      {/* Verified College */}
      <rect x="12" y="24" width="85" height="62" rx="6" fill="#121215" stroke="#c2803e" strokeWidth="1.2" />
      <text x="54" y="42" fill="#dda268" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
        VERIFIED COLLEGE
      </text>
      <text x="54" y="56" fill="#9ca3af" fontSize="7" fontFamily="monospace" textAnchor="middle">
        0x976E...0aa9
      </text>
      <text x="54" y="74" fill="#dda268" fontSize="8" fontFamily="sans-serif" textAnchor="middle">
        Holding Token #1
      </text>

      {/* Binding Chain / Link */}
      <path d="M 97 55 L 125 55" stroke="#c2803e" strokeWidth="1.5" />
      <circle cx="111" cy="55" r="4" fill="#1e1915" stroke="#c2803e" strokeWidth="1.2" />
      <text x="111" y="58" fill="#dda268" fontSize="7" fontFamily="monospace" textAnchor="middle">🔗</text>

      {/* Soulbound Token */}
      <rect x="125" y="24" width="85" height="62" rx="6" fill="#1e1915" stroke="#925824" strokeWidth="1.2" />
      <text x="167" y="42" fill="#dda268" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
        SOULBOUND NFT
      </text>
      <text x="167" y="56" fill="#9ca3af" fontSize="7" fontFamily="monospace" textAnchor="middle">
        ERC-721 / ERC-5192
      </text>
      <rect x="133" y="64" width="69" height="14" rx="3" fill="#121215" />
      <text x="167" y="74" fill="#dda268" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
        locked() = true
      </text>

      {/* Illegal Transfer Revert */}
      <path d="M 210 50 L 235 38" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" />
      <circle cx="245" cy="34" r="9" fill="#2b1114" stroke="#ef4444" strokeWidth="1" />
      <text x="245" y="37" fill="#ef4444" fontSize="9" fontFamily="sans-serif" textAnchor="middle">✕</text>
      <text x="278" y="37" fill="#ef4444" fontSize="7" fontFamily="monospace">
        transfer() reverts
      </text>

      {/* Legal Download Access */}
      <path d="M 210 60 L 235 72" stroke="#c2803e" strokeWidth="1.2" />
      <circle cx="245" cy="76" r="9" fill="#1e1915" stroke="#c2803e" strokeWidth="1" />
      <text x="245" y="79" fill="#dda268" fontSize="9" fontFamily="sans-serif" textAnchor="middle">✓</text>
      <text x="278" y="79" fill="#dda268" fontSize="7" fontFamily="monospace">
        logDownload() ok
      </text>
    </svg>
  );
}

