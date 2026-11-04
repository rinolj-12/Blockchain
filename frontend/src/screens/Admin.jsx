import { useState } from "react";
import StatusPill from "../components/StatusPill.jsx";
import Notice from "../components/Notice.jsx";
import {
  autoSubmitRemainingQuorum,
  examPhase,
  fastForwardChain,
  fastForwardToTime,
  fillSeedsAndSelect,
  postponeExam,
  resolvePaperSelection,
  slashDelinquentCustodians,
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
    if (!v.examTime) return;
    setTxModal({
      isOpen: true,
      title: "Fast-Forwarding Blockchain Time",
      subtitle: `Simulating time-warp past the exam deadline on Hardhat`,
      steps: [
        { label: "Increasing EVM Timestamp", detail: "Advancing block clock past deadline" },
        { label: "Mining Confirmation Block", detail: "Mining new block with updated timestamp" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await fastForwardToTime(v.examTime + 2);
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
    if (!v.examTime) return;
    const seedDeadline = v.examTime + seedWindowDuration;
    setTxModal({
      isOpen: true,
      title: "Fast-Forwarding Seed Challenge Window",
      subtitle: `Advancing EVM block time past entropy challenge window`,
      steps: [
        { label: "Increasing EVM Timestamp", detail: "Advancing block clock past seed window" },
        { label: "Mining Confirmation Block", detail: "Mining new block with updated timestamp" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await fastForwardToTime(seedDeadline + 2);
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

  const handleFastForwardRevealWindow = async () => {
    if (!v.examTime) return;
    const revealDeadline = (v.selectedAt || v.examTime) + revealWindowDuration;
    setTxModal({
      isOpen: true,
      title: "Fast-Forwarding Reveal Window",
      subtitle: "Advancing EVM block time past key reveal window",
      steps: [
        { label: "Increasing EVM Timestamp", detail: "Advancing block clock past reveal window" },
        { label: "Mining Confirmation Block", detail: "Mining new block with updated timestamp" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await fastForwardToTime(revealDeadline + 2);
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setNotice({ tone: "mint", msg: "Key reveal window has closed on Ethereum!" });
    } catch (err) {
      setTxModal((prev) => ({
        ...prev,
        error: err.shortMessage || err.message || "Could not fast forward reveal window.",
      }));
    }
  };

  const handleSlashDelinquent = async () => {
    setTxModal({
      isOpen: true,
      title: "Slashing Delinquent Custodians",
      subtitle: "Executing penalise() on delinquent staff who missed duties",
      steps: [
        { label: "Verify Delinquent Custodians", detail: "Checking missed duties on-chain" },
        { label: "Broadcast penalise()", detail: "Slashes 50% deposit to contract treasury" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      const count = await slashDelinquentCustodians((msg) => {
        setNotice({ tone: "red", msg });
      });
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setNotice({ tone: "mint", msg: `Successfully slashed 50% collateral for ${count} delinquent custodian(s)!` });
    } catch (err) {
      setTxModal((prev) => ({
        ...prev,
        error: err.shortMessage || err.message || "Could not slash delinquent custodians.",
      }));
    }
  };

  const handlePostponeExam = async () => {
    setTxModal({
      isOpen: true,
      title: "Postponing Failed Examination",
      subtitle: "Smart contract abort: threshold quorum could not be achieved",
      steps: [
        { label: "Verify Duty Windows Closed", detail: "Confirming dutiesOver() is true on-chain" },
        { label: "Broadcast postpone()", detail: "Permanently marking exam as postponed" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await postponeExam((msg) => setNotice({ tone: "red", msg }));
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setNotice({ tone: "red", msg: "Exam has been officially marked as postponed on Ethereum." });
    } catch (err) {
      setTxModal((prev) => ({
        ...prev,
        error: err.shortMessage || err.message || "Could not postpone exam.",
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
              : v.postponed
              ? "EXAM POSTPONED"
              : v.paperSelected
              ? "PHASE 3: KEY REVEAL WINDOW"
              : seedsUploaded >= 3
              ? "PHASE 2: CONSENSUS READY"
              : isWindowExpired
              ? "DUTY WINDOW EXPIRED"
              : "PHASE 2: SEED REVEAL WINDOW"}
          </span>
          <div className="mono" style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0" }}>
            {v.examTime === 0 ? (
              <span className="amber-text" style={{ fontSize: "22px" }}>Awaiting Start</span>
            ) : timeLeft > 0 ? (
              fmtCountdown(timeLeft)
            ) : isUnlocked ? (
              <span className="mint-text" style={{ fontSize: "22px" }}>✓ 3/5 UNLOCKED</span>
            ) : v.postponed ? (
              <span className="red-text" style={{ fontSize: "22px" }}>POSTPONED</span>
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
            ) : v.postponed ? (
              <span className="red-text">Exam postponed on-chain. Collateral penalty enforced.</span>
            ) : isWindowExpired ? (
              <span className="red-text">Duty window expired! Delinquent custodians can now be slashed.</span>
            ) : v.paperSelected ? (
              <span className="amber-text">
                ⚠️ <b>Active Key Reveal Window:</b> Custodians have {fmtCountdown(activeWindowLeft)} to submit shares or forfeit 0.50 ETH deposit.
              </span>
            ) : seedsUploaded >= 3 ? (
              <span className="mint-text">
                ✓ <b>Seed Quorum Met ({seedsUploaded}/3 seeds):</b> Window closes in {fmtCountdown(activeWindowLeft)}. Ready to draw candidate paper A, B, or C below.
              </span>
            ) : (
              <span className="amber-text">
                ⚠️ <b>Seed Window Active:</b> Awaiting staff seeds ({fmtCountdown(activeWindowLeft)} left, {seedsUploaded}/3 submitted) for entropy consensus.
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

          {v.examTime > 0 && timeLeft === 0 && !v.paperSelected && !v.postponed && (
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
              ) : activeWindowLeft > 0 ? (
                <button className="btn btn-primary btn-sm" onClick={handleFastTrackConsensus}>
                  ⚡ Fast-Track Consensus (Draw Now)
                </button>
              ) : null}
              {activeWindowLeft === 0 && seedsUploaded < 3 && (
                <button className="btn btn-secondary btn-sm" onClick={handlePostponeExam} style={{ borderColor: "var(--red)", color: "var(--red)" }}>
                  🛑 Postpone Exam (Quorum Failed)
                </button>
              )}
            </div>
          )}

          {v.paperSelected && !isUnlocked && !v.postponed && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
              {revealTimeLeft > 0 && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={handleAutoSubmitQuorum}>
                    ⚡ Auto-Submit Quorum (Staff 1-3)
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleFastForwardRevealWindow}
                    disabled={isAdvancing}
                    title="Advances chain clock past key reveal window"
                  >
                    ⚡ Fast-Forward Reveal Window
                  </button>
                </>
              )}
              {revealTimeLeft === 0 && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={handlePostponeExam} style={{ borderColor: "var(--red)", color: "var(--red)" }}>
                    🛑 Postpone Exam (Reveal Quorum Failed)
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleSlashDelinquent}>
                    🚨 Slash Delinquent Custodians
                  </button>
                </>
              )}
            </div>
          )}

          {isUnlocked && v.staff?.some((s) => s.missedDuty && !s.penalised) && (
            <div style={{ marginTop: "8px" }}>
              <button className="btn btn-secondary btn-sm" onClick={handleSlashDelinquent} style={{ borderColor: "var(--red)", color: "var(--red)" }}>
                🚨 Slash Delinquent Custodians (-0.50 ETH)
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
      <QuorumVisualizer vault={v} role="admin" />

      {/* Question Paper Vault & IPFS Storage Section */}
      <PaperVaultSection />

      {/* Custodian Cryptographic Commitments Ledger */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span className="eyebrow" style={{ color: "var(--mint)" }}>COMMIT-REVEAL SECURITY LEDGER</span>
            <h2 className="card-title" style={{ margin: "4px 0 2px" }}>
              🔒 Custodian Commitment Fingerprints (ExamVault Storage)
            </h2>
            <p className="muted small" style={{ margin: 0 }}>
              Before exam start, all 5 custodians commit Keccak-256 fingerprints of their candidate shares and entropy seeds. Immutable in smart contract storage.
            </p>
          </div>
          <span className="pill pill-mint mono small">
            {v.staff?.every((s) => s.piecesCommitted) ? "✓ 5/5 Custodians Committed" : `${v.staff?.filter((s) => s.piecesCommitted).length || 0}/5 Committed`}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
          {(v.staff || []).map((staff, idx) => {
            const hasCommits = staff.piecesCommitted && staff.pieceCommits?.length === 3;
            return (
              <div
                key={staff.address || idx}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>Custodian #{idx + 1}</span>
                    <span className="mono small muted" title={staff.address}>{shortAddr(staff.address)}</span>
                  </div>
                  <span className={`pill small mono ${hasCommits ? "pill-mint" : "pill-amber"}`}>
                    {hasCommits ? "✓ 3/3 Pieces Committed" : "Pending Commit"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {["A", "B", "C"].map((pLetter, pIdx) => {
                    const commitHash = staff.pieceCommits?.[pIdx] || "";
                    const isCommitted = commitHash && !/^0x0+$/.test(commitHash);
                    return (
                      <div
                        key={pLetter}
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>
                          Paper {pLetter}:
                        </span>
                        <span
                          className="mono small"
                          style={{
                            fontSize: "11px",
                            color: isCommitted ? "var(--cobalt-bright)" : "var(--muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "200px",
                          }}
                          title={commitHash}
                        >
                          {isCommitted ? `${commitHash.slice(0, 10)}…${commitHash.slice(-8)}` : "—"}
                        </span>
                        <span className="mono" style={{ fontSize: "9.5px", color: isCommitted ? "var(--mint)" : "var(--amber)" }}>
                          {isCommitted ? "✓" : "⏳"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px", borderTop: "1px solid var(--border)" }}>
                  <span className="mono small muted" style={{ fontSize: "10.5px" }}>
                    Seed Commitment: {staff.seedCommitted ? "✓ Sealed" : "Pending"}
                  </span>
                  <a href={`#/staff/${idx + 1}`} className="btn btn-ghost btn-sm" style={{ fontSize: "11px", padding: "2px 8px" }}>
                    Custodian Portal ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

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

