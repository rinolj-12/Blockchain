/**
 * Compact Soulbound Token Status Badge Visual
 * Placed inside the College Invigilator card.
 */
export function SoulboundBadgeVisual({ tokenId = 1, holdsToken = true }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "var(--mint-tint)",
        padding: "6px 12px",
        borderRadius: "8px",
        border: "1px solid var(--mint-border)",
        marginTop: "8px",
        marginBottom: "12px",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span className="mono small" style={{ color: "var(--mint)", fontWeight: "600" }}>
        Token #{tokenId} · ERC-5192 Soulbound · Non-Transferable
      </span>
    </div>
  );
}
