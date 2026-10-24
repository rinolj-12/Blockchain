import { useState } from "react";
import { CANDIDATE_PAPERS } from "../lib/papersData.js";
import { ipfsGateway } from "../lib/deployment.js";

export default function PaperVaultSection() {
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldId) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const activePaper = CANDIDATE_PAPERS.find((p) => p.id === selectedPaperId);

  return (
    <section className="card" style={{ border: "1px solid var(--border)", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
        <div>
          <span className="eyebrow" style={{ color: "var(--mint)" }}>CRYPTOGRAPHIC EXAM VAULT</span>
          <h2 className="card-title" style={{ margin: "4px 0 6px" }}>
            📚 Candidate Question Papers (IPFS Encrypted Storage)
          </h2>
          <p className="muted small" style={{ margin: 0, maxWidth: "780px" }}>
            The Paper Setter created 3 randomized candidate sets (A, B, and C). Each was encrypted with symmetric AES-256-GCM and stored on IPFS. The cryptographic hash fingerprints are permanently locked in the smart contract.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span className="pill pill-mint mono small">AES-256-GCM</span>
          <span className="pill pill-amber mono small">3-of-5 Shamir Split</span>
        </div>
      </div>

      {/* Security Callout Banner */}
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "13px",
        }}
      >
        <span style={{ fontSize: "20px" }}>🛡️</span>
        <div>
          <strong style={{ color: "var(--text)" }}>Why Staff Do Not Upload Question Papers:</strong>{" "}
          <span className="muted">
            To prevent leaks, custodians are never given the exam questions. Staff members only hold and submit <em>mathematical Shamir key shares</em>. The plaintext paper is never on any staff computer.
          </span>
        </div>
      </div>

      {/* 3 Candidate Paper Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        {CANDIDATE_PAPERS.map((paper) => {
          const isSelected = selectedPaperId === paper.id;
          return (
            <div
              key={paper.id}
              style={{
                background: isSelected ? "var(--mint-tint)" : "var(--surface-2)",
                border: isSelected ? "1.5px solid var(--mint)" : "1px solid var(--border)",
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
                transition: "all 0.25s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: "700",
                      background: "var(--surface)",
                      color: "var(--mint)",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    PAPER SET {paper.id}
                  </span>
                  <span className="mono small muted">{paper.size} bytes</span>
                </div>

                <h3 style={{ fontSize: "16px", margin: "0 0 4px", fontWeight: "600" }}>{paper.setName}</h3>
                <p className="muted small" style={{ margin: "0 0 12px" }}>
                  {paper.title} • {paper.duration} • Max: {paper.maxMarks} marks
                </p>

                {/* Hashes & CIDs */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                  <div style={{ background: "var(--surface)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", marginBottom: "2px" }}>
                      <span>IPFS CIDv1</span>
                      <a
                        href={`${ipfsGateway}/${paper.cid}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--mint)", textDecoration: "none" }}
                        title="Inspect Raw Ciphertext on IPFS"
                      >
                        Open Raw IPFS ↗
                      </a>
                    </div>
                    <div className="mono" style={{ wordBreak: "break-all", color: "var(--text)" }}>
                      {paper.cid.slice(0, 16)}…{paper.cid.slice(-10)}
                    </div>
                  </div>

                  <div style={{ background: "var(--surface)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", marginBottom: "2px" }}>
                      <span>Keccak-256 On-Chain Fingerprint</span>
                      <button
                        onClick={() => copyToClipboard(paper.hash, `hash-${paper.id}`)}
                        className="mono"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: copiedField === `hash-${paper.id}` ? "var(--mint)" : "var(--muted)",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: "11px",
                        }}
                      >
                        {copiedField === `hash-${paper.id}` ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <div className="mono" style={{ wordBreak: "break-all", color: "var(--text)" }}>
                      {paper.hash.slice(0, 16)}…{paper.hash.slice(-10)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                className={`btn ${isSelected ? "btn-primary" : "btn-ghost"} btn-sm`}
                onClick={() => setSelectedPaperId(isSelected ? null : paper.id)}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isSelected ? "▲ Hide Plaintext Questions" : "▼ Inspect Plaintext Questions"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Expanded Plaintext Question Viewer Drawer */}
      {activePaper && (
        <div
          style={{
            marginTop: "20px",
            background: "var(--surface-2)",
            border: "1.5px solid var(--mint-border)",
            borderRadius: "16px",
            padding: "20px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span className="eyebrow" style={{ color: "var(--mint)" }}>EXAM QUESTION PAPER PREVIEW</span>
              <h3 style={{ margin: "2px 0 0", fontSize: "18px" }}>
                {activePaper.setName} — Plaintext Inspection
              </h3>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedPaperId(null)}
              style={{ fontSize: "12px" }}
            >
              ✕ Close Preview
            </button>
          </div>

          <p className="muted small" style={{ margin: "0 0 16px" }}>
            This plaintext exam was authored by the university paper setter. Before distribution, it is encrypted into an AES-256 ciphertext blob. Only when the deadline passes and 3-of-5 staff upload their keys can the invigilator decrypt these questions.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activePaper.questions.map((q) => (
              <div
                key={q.no}
                style={{
                  background: "var(--surface)",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span className="mono" style={{ fontWeight: "700", color: "var(--mint)", fontSize: "13px" }}>
                    {q.no} ({q.marks} Marks) — {q.topic}
                  </span>
                </div>
                <div style={{ fontSize: "14px", color: "var(--text)", lineHeight: "1.5" }}>
                  {q.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

