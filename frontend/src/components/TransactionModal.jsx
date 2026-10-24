import { useEffect, useState } from "react";
import { CheckIcon, PadlockIcon } from "./Icons.jsx";
import { deployment } from "../lib/deployment.js";
import { shortAddr } from "../lib/format.js";

/**
 * High-tech Web3 Transaction Modal with holographic core visualizer,
 * matrix laser scanning, animated step progression, and live on-chain telemetry.
 */
export function TransactionModal({
  isOpen,
  onClose,
  title = "Blockchain Transaction in Progress",
  subtitle = "Executing smart contract cryptographic transaction",
  steps = [],
  currentStepIndex = 0,
  isComplete = false,
  error = null,
  txHash = null,
}) {
  const [activeHash, setActiveHash] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (txHash) {
        setActiveHash(txHash);
      } else {
        const rand = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        setActiveHash(`0x${rand}`);
      }
      setCopied(false);
    }
  }, [isOpen, txHash]);

  if (!isOpen) return null;

  const copyHash = () => {
    if (activeHash && navigator.clipboard) {
      navigator.clipboard.writeText(activeHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tx-modal-overlay" role="dialog" aria-modal="true">
      <div className="tx-modal-backdrop" onClick={isComplete || error ? onClose : undefined} />
      <div className="tx-modal-card">
        {/* Holographic Laser Sweep Bar */}
        <div className="tx-laser-sweep" />

        {/* Animated Holographic Core */}
        <div className="tx-modal-header">
          <div className={`tx-hologram-wrapper ${error ? "beacon-error" : isComplete ? "beacon-success" : "beacon-active"}`}>
            {error ? (
              <span style={{ fontSize: "28px", fontWeight: "700" }}>✕</span>
            ) : isComplete ? (
              <CheckIcon size={32} color="#04201A" strokeWidth={3} />
            ) : (
              <div className="tx-hologram-core">
                <div className="tx-orbit-ring" />
                <div className="tx-orbit-ring-reverse" />
                <div className="tx-core-pulse">
                  <span className="tx-core-symbol">🔐</span>
                </div>
              </div>
            )}
          </div>

          <h2 className="tx-modal-title">{title}</h2>
          <p className="tx-modal-subtitle">{subtitle}</p>
        </div>

        {/* Dynamic Step Progression Tracker */}
        <div className="tx-steps-track">
          {steps.map((s, idx) => {
            const isDone = idx < currentStepIndex || isComplete;
            const isCurrent = idx === currentStepIndex && !isComplete && !error;

            return (
              <div key={idx} className={`tx-step-item ${isDone ? "step-done" : isCurrent ? "step-active" : "step-pending"}`}>
                <div className="tx-step-node">
                  {isDone ? (
                    <span className="tx-step-check">✓</span>
                  ) : isCurrent ? (
                    <div className="tx-step-pulse" />
                  ) : (
                    <span className="tx-step-num">{idx + 1}</span>
                  )}
                </div>
                <div className="tx-step-content">
                  <div className="tx-step-label">{s.label}</div>
                  {s.detail && <div className="tx-step-detail mono">{s.detail}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Cryptographic Telemetry Box */}
        <div className="tx-telemetry-box mono">
          <div className="tx-telemetry-row">
            <span className="muted">TRANSACTION:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="mint-text tx-hash-text" title={activeHash}>
                {activeHash ? `${activeHash.slice(0, 10)}…${activeHash.slice(-8)}` : "Computing…"}
              </span>
              <button
                type="button"
                onClick={copyHash}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "11px",
                  color: "var(--muted)",
                  padding: "0 2px",
                }}
                title="Copy Transaction Hash"
              >
                {copied ? "✓ Copied" : "📋"}
              </button>
            </div>
          </div>
          <div className="tx-telemetry-row">
            <span className="muted">SMART CONTRACT:</span>
            <span>ExamVault ({shortAddr(deployment?.vault)})</span>
          </div>
          <div className="tx-telemetry-row">
            <span className="muted">CONSENSUS:</span>
            <span>Hardhat Localnet (Chain 31337)</span>
          </div>
          <div className="tx-telemetry-row">
            <span className="muted">STATUS:</span>
            <span className={error ? "tx-status-err" : isComplete ? "tx-status-ok" : "tx-status-active"}>
              {error ? "REVERTED" : isComplete ? "CONFIRMED ON-CHAIN ✓" : "MINING BLOCK ON LOCALNET…"}
            </span>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="tx-error-notice">
            <span style={{ fontWeight: 600 }}>Contract notice:</span> {error}
          </div>
        )}

        {/* Footer / Close Button */}
        <div className="tx-modal-footer">
          {isComplete || error ? (
            <button className="btn btn-primary" onClick={onClose} style={{ width: "100%", padding: "12px", fontSize: "14.5px" }}>
              {error ? "Close & Try Again" : "Complete & Return to Portal ✓"}
            </button>
          ) : (
            <div className="tx-wait-msg mono small muted">
              <span className="dot" style={{ display: "inline-block", marginRight: "6px" }} />
              Awaiting Ethereum block validation…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

