import { useState } from "react";
import StatusPill from "../components/StatusPill.jsx";
import Notice from "../components/Notice.jsx";
import {
  autoSubmitRemainingQuorum,
  examPhase,
  fastForwardChain,
  fillSeedsAndSelect,
  resolvePaperSelection,
  startExamCountdown,
  useChainNow,
} from "../lib/chain.js";
import { deployment } from "../lib/deployment.js";
import { fmtCountdown, fmtDuration, fmtEth, fmtLocalTime, PAPER_NAMES, shortAddr } from "../lib/format.js";
import { QuorumVisualizer } from "../components/QuorumVisualizer.jsx";
import { TransactionModal } from "../components/TransactionModal.jsx";
import { SoulboundBadgeVisual } from "../components/BlockchainVisuals.jsx";
import PaperVaultSection from "../components/PaperVaultSection.jsx";

export default function Admin({ vault: v, refresh }) {
  const now = useChainNow();
  const phase = examPhase(v, now);
  const [duration, setDuration] = useState(120);
  const [notice, setNotice] = useState(null);

  // Web3 Transaction Modal State
  const [txModal, setTxModal] = useState({
    isOpen: false,
    title: "",
    subtitle: "",
    steps: [],
    currentStepIndex: 0,
    isComplete: false,
    error: null,
  });

  const timeLeft = v.examTime > now ? v.examTime - now : 0;
  const keysUploaded = v.piecesRevealed || 0;
  const seedsUploaded = v.seedsRevealed || 0;
  const isUnlocked = v.unlocked || keysUploaded >= 3;

  // Reveal Window Timers & Slashing Logic
  const isSeedPhase = v.examTime > 0 && timeLeft === 0 && !v.paperSelected && !isUnlocked;
  const isRevealPhase = v.examTime > 0 && timeLeft === 0 && v.paperSelected && !isUnlocked;

  const seedWindowDuration = v.seedWindow || 120;
  const seedDeadline = v.examTime + seedWindowDuration;
  const seedTimeLeft = Math.max(0, seedDeadline - now);

  const revealWindowDuration = v.revealWindow || 600;
  const revealDeadline = (v.selectedAt || v.examTime) + revealWindowDuration;
  const revealTimeLeft = Math.max(0, revealDeadline - now);

  const activeWindowDuration = v.paperSelected ? revealWindowDuration : seedWindowDuration;
  const activeWindowLeft = v.paperSelected ? revealTimeLeft : seedTimeLeft;
  const isWindowExpired = v.examTime > 0 && timeLeft === 0 && !isUnlocked && activeWindowLeft === 0;

  const handleStartExam = async () => {
    setNotice(null);
    setTxModal({
      isOpen: true,
      title: "Locking Exam on Ethereum Blockchain",
      subtitle: `Initializing immutable smart contract time-lock (${fmtDuration(duration)})`,
      steps: [
        { label: "Preparing Cryptographic Hashes", detail: "Generating Keccak-256 fingerprints & IPFS CIDs" },
        { label: "Executing ExamVault.setExam()", detail: "Submitting permanent time-lock to Ethereum block" },
        { label: "Registering 5 Custodian Commitments", detail: "Signing piece hashes & seed commitments" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await startExamCountdown(duration, (msg) => {
        if (msg.includes("commitments")) {
          setTxModal((prev) => ({ ...prev, currentStepIndex: 2 }));
        }
      });

      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setNotice({
        tone: "mint",
        msg: `Exam deadline successfully locked on Ethereum for ${fmtDuration(duration)}! Countdown is now active.`,
      });
    } catch (err) {
      console.error(err);
      setTxModal((prev) => ({
        ...prev,
        error: err.shortMessage || err.message || "Failed to schedule exam on blockchain.",
      }));
    }
  };

  const handleFastForwardDeadline = async () => {
    if (timeLeft <= 0) return;
    setTxModal({
      isOpen: true,
      title: "Fast-Forwarding Blockchain Time",
      subtitle: `Simulating time-warp (+${timeLeft + 2}s) past the exam deadline on Hardhat`,
      steps: [
        { label: "Increasing EVM Timestamp", detail: `Calling evm_increaseTime(${timeLeft + 2})` },
        { label: "Mining Confirmation Block", detail: "Mining new block with updated timestamp" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await fastForwardChain(timeLeft + 2);
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setNotice({ tone: "mint", msg: "Blockchain time successfully advanced past the exam deadline!" });
    } catch (err) {
      setTxModal((prev) => ({
        ...prev,
        error: err.shortMessage || err.message || "Could not fast forward blockchain clock.",
      }));
    }
  };

  const handleFastForwardSeedWindow = async () => {
    if (activeWindowLeft <= 0) return;
    setTxModal({
      isOpen: true,
      title: "Fast-Forwarding Seed Challenge Window",
      subtitle: `Advancing EVM block time (+${activeWindowLeft + 2}s) past entropy challenge window`,
      steps: [
        { label: "Increasing EVM Timestamp", detail: `Calling evm_increaseTime(${activeWindowLeft + 2})` },
        { label: "Mining Confirmation Block", detail: "Mining new block with updated timestamp" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await fastForwardChain(activeWindowLeft + 2);
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setNotice({ tone: "mint", msg: "Seed challenge window has closed on Ethereum!" });
    } catch (err) {
      setTxModal((prev) => ({
        ...prev,
        error: err.shortMessage || err.message || "Could not fast forward seed window.",
      }));
    }
  };

  const handleSelectPaper = async () => {
    setNotice(null);
    setTxModal({
      isOpen: true,
      title: "Resolving Paper Selection Consensus",
      subtitle: "XORing custodian seeds to compute deterministic paper selection on Ethereum",
      steps: [
        { label: "Verify Seed Threshold", detail: `${seedsUploaded} / 3 Seeds verified on-chain` },
        { label: "Executing ExamVault.selectPaper()", detail: "keccak256(seedAccumulator) % 3" },
        { label: "Locking In Exam Paper", detail: "Candidate paper sealed permanently in Ethereum state" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      const chosen = await resolvePaperSelection((msg) => {
        if (msg.includes("Computing")) {
          setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
        }
      });
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setNotice({
        tone: "mint",
        msg: `Decentralized consensus reached! Paper ${PAPER_NAMES[chosen]} has been selected on-chain!`,
      });
    } catch (err) {
      console.error(err);
      setTxModal((prev) => ({
        ...prev,
        error: err.shortMessage || err.message || "Failed to execute paper selection draw.",
      }));
    }
  };

  const handleFastTrackConsensus = async () => {
    setNotice(null);
    setTxModal({
      isOpen: true,
      title: "Fast-Tracking Entropy Consensus Draw",
      subtitle: "Revealing custodian seeds and selecting candidate paper on Ethereum",
      steps: [
        { label: "Check Blockchain Timestamp", detail: "Confirming exam deadline has arrived" },
        { label: "Reveal Custodian Seeds", detail: "Submitting entropy seeds 1, 2, and 3 on-chain" },
        { label: "On-Chain Consensus Draw", detail: "Executing selectPaper() on ExamVault" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await fillSeedsAndSelect((msg) => {
        if (msg.includes("Computing") || msg.includes("selected")) {
          setTxModal((prev) => ({ ...prev, currentStepIndex: 2 }));
        }
      });
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setNotice({ tone: "mint", msg: "Entropy consensus resolved! Candidate paper has been selected." });
    } catch (err) {
      console.error(err);
      setTxModal((prev) => ({
        ...prev,
        error: err.shortMessage || err.message || "Failed to fast-track consensus.",
      }));
    }
  };

  const handleAutoSubmitQuorum = async () => {
    setNotice(null);
    setTxModal({
      isOpen: true,
      title: "Auto-Submitting Remaining Quorum",
      subtitle: `Submitting Shamir key shares to reach 3-of-5 threshold for Paper ${PAPER_NAMES[v.selectedPaper]}`,
      steps: [
        { label: "Verify Selected Paper", detail: `Locked on Paper ${PAPER_NAMES[v.selectedPaper]}` },
        { label: "Broadcast Custodian Shares", detail: "Revealing 32-byte shares on ExamVault" },
        { label: "Quorum Verification", detail: "Assembling AES-256 key and unlocking vault" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await autoSubmitRemainingQuorum((msg) => {
        if (msg.includes("Quorum reached") || msg.includes("unlocked")) {
          setTxModal((prev) => ({ ...prev, currentStepIndex: 2 }));
        }
      });
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setNotice({ tone: "mint", msg: `Quorum reached! Paper ${PAPER_NAMES[v.selectedPaper]} is UNLOCKED for exam halls.` });
    } catch (err) {
      console.error(err);
      setTxModal((prev) => ({
        ...prev,
        error: err.shortMessage || err.message || "Failed to auto-submit quorum.",
      }));
    }
  };

  const isStarting = txModal.isOpen && !txModal.isComplete && !txModal.error;
  const isAdvancing = txModal.isOpen && txModal.title.includes("Fast-Forward") && !txModal.isComplete && !txModal.error;

  return (
    <div className="stack">
      {/* Header / Hero */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="eyebrow">CENTRAL CONTROLLER PORTAL</span>
            <h1 className="h1" style={{ marginTop: "4px" }}>
              {deployment.examTitle || "University Final Examination"}
            </h1>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Control room for managing staff key custodians, monitoring the tamper-proof deadline, and verifying college access.
            </p>
          </div>
          <StatusPill phase={isUnlocked ? "UNLOCKED" : phase} />
        </div>
      </section>

      {notice && <Notice tone={notice.tone}>{notice.msg}</Notice>}

      {/* Start Exam Countdown Panel (shown when exam is not yet locked) */}
      {v.examTime === 0 && (
        <section className="card" style={{ border: "1px solid var(--mint-border)", background: "var(--mint-tint)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <span className="eyebrow" style={{ color: "var(--mint)" }}>EXAM CONTROLLER ACTION</span>
              <h2 className="card-title" style={{ margin: "4px 0 6px" }}>
                🚀 Schedule & Start Exam Countdown
              </h2>
              <p className="muted small" style={{ margin: 0, maxWidth: "680px" }}>
                The smart contracts are deployed and 5 staff custodians have staked deposits. Select the countdown duration for your demonstration and lock the deadline on Ethereum:
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "18px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Countdown Duration:</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={isStarting}
                aria-label="Select Countdown Duration"
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                <option value={120}>2 Minutes (Standard Viva Demo)</option>
                <option value={300}>5 Minutes</option>
                <option value={600}>10 Minutes</option>
                <option value={60}>1 Minute (Fast Test)</option>
                <option value={30}>30 Seconds (Quick Test)</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleStartExam}
              disabled={isStarting}
              style={{ minWidth: "220px" }}
            >
              {isStarting ? "Starting On-Chain..." : `🚀 Start Countdown (${fmtDuration(duration)})`}
            </button>
          </div>
        </section>
      )}

      {/* Overview Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Deadline Card with Dynamic Reveal Window & Slashing Timer */}
        <div className="card">
          <span className="eyebrow">
            {v.examTime === 0
              ? "EXAM DEADLINE TIMER"
              : timeLeft > 0
              ? "PHASE 1: EXAM COUNTDOWN"
              : isUnlocked
              ? "PHASE 3: VAULT UNLOCKED"
              : isWindowExpired
              ? "DUTY WINDOW EXPIRED"
              : isRevealPhase
              ? "PHASE 2: KEY REVEAL WINDOW"
              : "PHASE 2: SEED REVEAL WINDOW"}
          </span>
          <div className="mono" style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0" }}>
            {v.examTime === 0 ? (
              <span className="amber-text" style={{ fontSize: "22px" }}>Awaiting Start</span>
            ) : timeLeft > 0 ? (
              fmtCountdown(timeLeft)
            ) : isUnlocked ? (
              <span className="mint-text" style={{ fontSize: "22px" }}>✓ 3/5 UNLOCKED</span>
            ) : isWindowExpired ? (
              <span className="red-text" style={{ fontSize: "22px" }}>00:00:00 (EXPIRED)</span>
            ) : (
              <span className={activeWindowLeft < 60 ? "red-text" : "amber-text"}>
                {fmtCountdown(activeWindowLeft)}
              </span>
            )}
          </div>
          <p className="muted small" style={{ margin: "0 0 12px" }}>
            {v.examTime === 0 ? (
              <span className="amber-text">Deadline not set. Start countdown above.</span>
            ) : timeLeft > 0 ? (
              <>Deadline: <b>{fmtLocalTime(v.examTime)}</b> (keys locked on-chain)</>
            ) : isUnlocked ? (
              <span className="mint-text">✓ 3-of-5 Quorum reached. Vault is unlocked for exam halls.</span>
            ) : isWindowExpired ? (
              <span className="red-text">Duty window expired! Delinquent custodians can now be slashed.</span>
            ) : isRevealPhase ? (
              <span className="amber-text">
                ⚠️ <b>Active Slashing Window:</b> Custodians have {fmtCountdown(activeWindowLeft)} to submit shares or forfeit 1.0 ETH collateral.
              </span>
            ) : (
              <span className="amber-text">
                ⚠️ <b>Seed Window Active:</b> Awaiting staff seeds ({fmtCountdown(activeWindowLeft)} left) for entropy consensus.
              </span>
            )}
          </p>
          {v.examTime > 0 && timeLeft > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleFastForwardDeadline}
              disabled={isAdvancing}
              title="Advances Hardhat chain time so you do not have to wait during viva"
            >
              {isAdvancing ? "Advancing..." : "⚡ Fast-Forward to Deadline"}
            </button>
          )}

          {v.examTime > 0 && timeLeft === 0 && !v.paperSelected && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
              {activeWindowLeft > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleFastForwardSeedWindow}
                  disabled={isAdvancing}
                  title="Advances chain clock past seed challenge window"
                >
                  ⚡ Fast-Forward Seed Window
                </button>
              )}
              {seedsUploaded >= 3 ? (
                <button className="btn btn-primary btn-sm" onClick={handleSelectPaper}>
                  🎲 Draw Paper (Consensus Ready)
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleFastTrackConsensus}>
                  ⚡ Fast-Track Consensus (Draw Now)
                </button>
              )}
            </div>
          )}

          {v.paperSelected && !isUnlocked && (
            <div style={{ marginTop: "8px" }}>
              <button className="btn btn-primary btn-sm" onClick={handleAutoSubmitQuorum}>
                ⚡ Auto-Submit Quorum (Staff 1-3)
              </button>
            </div>
          )}
        </div>

        {/* Quorum / Key Progress Card */}
        <div className="card">
          <span className="eyebrow">CUSTODIAN KEY PROGRESS</span>
          <div className="mono" style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0" }}>
            <span className={isUnlocked ? "mint-text" : ""}>{keysUploaded}</span>
            <span className="muted" style={{ fontSize: "20px" }}> / 5 Keys</span>
          </div>

          <div className="progress-bar-bg" style={{ height: "8px", borderRadius: "999px", background: "var(--surface)", overflow: "hidden", margin: "10px 0" }}>
            <div
              style={{
                height: "100%",
                width: `${(keysUploaded / 5) * 100}%`,
                background: isUnlocked ? "var(--mint)" : "var(--amber)",
                transition: "width 0.4s ease",
              }}
            />
          </div>

          <p className="muted small" style={{ margin: "10px 0 0" }}>
            {v.examTime === 0 ? (
              <span className="muted">5 custodians staked. Ready for countdown start.</span>
            ) : isUnlocked ? (
              <span className="mint-text">✓ Quorum reached (3-of-5 threshold). Vault is UNLOCKED!</span>
            ) : (
              `Requires ${Math.max(0, 3 - keysUploaded)} more key(s) to reconstruct the decryption key.`
            )}
          </p>
        </div>

        {/* College Access Card */}
        <div className="card">
          <span className="eyebrow">EXAM CENTRE / HALL ACCESS</span>
          <div style={{ margin: "8px 0 4px", fontSize: "18px", fontWeight: "600" }}>
            Govt. College of Engineering
          </div>

          {/* Soulbound Token Status Visual */}
          <SoulboundBadgeVisual tokenId={1} holdsToken={true} />

          <p className="muted small" style={{ margin: "0 0 12px" }}>
            Status:{" "}
            <span className={isUnlocked ? "mint-text" : "amber-text"}>
              {isUnlocked ? "Download Available" : "Locked (Awaiting Quorum)"}
            </span>
          </p>
          <a className="btn btn-ghost btn-sm" href="#/college">
            Open Exam Centre Portal ↗
          </a>
        </div>
      </div>

      {/* Interactive Holographic Quorum Visualizer */}
      <QuorumVisualizer vault={v} />

      {/* Question Paper Vault & IPFS Storage Section */}
      <PaperVaultSection />

      {/* Protocol Telemetry & Cryptographic Verification */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>Smart Contract Protocol Verification</h2>
            <p className="muted small" style={{ margin: "2px 0 0" }}>
              Active on-chain parameters enforcing the tamper-proof exam distribution protocol
            </p>
          </div>
          <span className="pill pill-mint mono small">Verified Solidity Bytecode</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
          <div style={{ background: "var(--surface-2)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <span className="eyebrow">VAULT CONTRACT</span>
            <div className="mono small mint-text" style={{ margin: "4px 0", wordBreak: "break-all" }}>{deployment.vault}</div>
            <div className="muted small">ExamVault.sol (ERC-5192 Manager)</div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <span className="eyebrow">SECURITY PARAMS</span>
            <div className="mono small" style={{ margin: "4px 0", fontWeight: 600 }}>Min Stake: {fmtEth(v.minStake)}</div>
            <div className="muted small">Seed Window: {v.seedWindow}s • Reveal: {v.revealWindow}s</div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <span className="eyebrow">STORAGE & ENCRYPTION</span>
            <div className="mono small" style={{ margin: "4px 0", fontWeight: 600 }}>AES-256-GCM + IPFS</div>
            <div className="muted small">CIDv1 sha2-256 content-addressed</div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <span className="eyebrow">ACCESS CONTROL</span>
            <div className="mono small" style={{ margin: "4px 0", fontWeight: 600 }}>Soulbound ERC-721/5192</div>
            <div className="muted small">Non-transferable college access tokens</div>
          </div>
        </div>
      </section>

      {/* Web3 Transaction Modal */}
      <TransactionModal
        isOpen={txModal.isOpen}
        onClose={() => setTxModal((prev) => ({ ...prev, isOpen: false }))}
        title={txModal.title}
        subtitle={txModal.subtitle}
        steps={txModal.steps}
        currentStepIndex={txModal.currentStepIndex}
        isComplete={txModal.isComplete}
        error={txModal.error}
      />
    </div>
  );
}

