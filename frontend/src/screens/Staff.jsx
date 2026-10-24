import { useEffect, useState } from "react";
import Notice from "../components/Notice.jsx";
import { ClockIcon, FileIcon } from "../components/Icons.jsx";
import { TransactionModal } from "../components/TransactionModal.jsx";
import { QuorumVisualizer } from "../components/QuorumVisualizer.jsx";
import {
  autoSubmitRemainingQuorum,
  loadStaffKey,
  readProvider,
  saveStaffKey,
  submitStaffKeySequence,
  useChainNow,
  vaultRead,
} from "../lib/chain.js";
import { fromHex } from "../lib/crypto.js";
import { fmtCountdown, fmtLocalTime, PAPER_NAMES, shortAddr } from "../lib/format.js";

function parseKeyFile(text) {
  let j;
  try {
    j = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON format.");
  }
  if (!Array.isArray(j.pieces) || j.pieces.length !== 3) {
    throw new Error("The key file must contain 3 pieces (for papers A, B, C).");
  }
  j.pieces.forEach((p) => fromHex(p));
  if (j.seed === undefined || j.seed === null) {
    throw new Error("The key file is missing the secret seed number.");
  }
  return {
    staffIndex: Number(j.staffIndex),
    staffAddress: j.staffAddress ?? null,
    pieces: j.pieces,
    seed: BigInt(j.seed),
  };
}

export default function Staff({ vault: v, refresh, staffId = 1 }) {
  const now = useChainNow();
  const currentIndex = Math.min(5, Math.max(1, Number(staffId) || 1));
  const staffMember = v.staff.find((s) => s.index === currentIndex) || v.staff[currentIndex - 1];

  const [keyFile, setKeyFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Web3 Transaction Modal State
  const [txModal, setTxModal] = useState({
    isOpen: false,
    title: "",
    subtitle: "",
    steps: [],
    currentStepIndex: 0,
    isComplete: false,
    error: null,
    txHash: null,
  });

  // Load existing key from localStorage or reset on staff change
  useEffect(() => {
    const stored = loadStaffKey(currentIndex);
    setKeyFile(stored);
    setError(null);
    setSuccess(null);
  }, [currentIndex]);

  const timeLeft = v.examTime > now ? v.examTime - now : 0;
  const isPieceRevealed = staffMember?.pieceRevealed;
  const isSeedRevealed = staffMember?.seedRevealed;
  const keysUploaded = v.piecesRevealed || 0;
  const isUnlocked = v.unlocked || keysUploaded >= 3;

  // Reveal Window Timers & Slashing Logic
  const isSeedPhase = v.examTime > 0 && timeLeft === 0 && !v.paperSelected;
  const isRevealPhase = v.examTime > 0 && timeLeft === 0 && v.paperSelected;

  const seedWindowDuration = v.seedWindow || 120;
  const seedDeadline = v.examTime + seedWindowDuration;
  const seedTimeLeft = Math.max(0, seedDeadline - now);

  const revealWindowDuration = v.revealWindow || 600;
  const revealDeadline = (v.selectedAt || v.examTime) + revealWindowDuration;
  const revealTimeLeft = Math.max(0, revealDeadline - now);
  const revealMinutesLeft = Math.ceil(revealTimeLeft / 60);
  const revealWindowMinutes = Math.round(revealWindowDuration / 60);

  const activeWindowDuration = v.paperSelected ? revealWindowDuration : seedWindowDuration;
  const activeWindowLeft = v.paperSelected ? revealTimeLeft : seedTimeLeft;
  const isWindowExpired = v.examTime > 0 && timeLeft === 0 && activeWindowLeft === 0;

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const text = await file.text();
      const parsed = parseKeyFile(text);
      setKeyFile(parsed);
      saveStaffKey(currentIndex, parsed);
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 1200);
      setSuccess(`Loaded key file for Staff ${parsed.staffIndex || currentIndex}. Ready to submit.`);
    } catch (err) {
      setError(err.message);
    }
    e.target.value = "";
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const text = await file.text();
      const parsed = parseKeyFile(text);
      setKeyFile(parsed);
      saveStaffKey(currentIndex, parsed);
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 1200);
      setSuccess(`Loaded key file for Staff ${parsed.staffIndex || currentIndex}. Ready to submit.`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Quick load demo key helper (from public/demo-secrets)
  const handleQuickLoad = async () => {
    try {
      setError(null);
      const res = await fetch(`/demo-secrets/staff-${currentIndex}.json`);
      if (!res.ok) throw new Error(`Could not fetch demo key for Staff ${currentIndex}`);
      const text = await res.text();
      const parsed = parseKeyFile(text);
      setKeyFile(parsed);
      saveStaffKey(currentIndex, parsed);
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 1200);
      setSuccess(`Quick-loaded official demo key for Staff ${currentIndex}. Ready to submit.`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Submit key to smart contract with live animated transaction modal
  const handleSubmitKey = async () => {
    if (v.examTime === 0) {
      setError("The exam countdown has not been started yet. Please start it from the Central Admin Portal first.");
      return;
    }
    if (!keyFile) {
      setError("Please select or load a key file first.");
      return;
    }

    const steps = [
      { label: "Inspect Shamir Shares & Entropy", detail: "Validating 3 key pieces & seed in memory" },
      { label: "Blockchain Time Sync", detail: "Checking block timestamp against exam schedule" },
      { label: "Broadcast revealSeed()", detail: `Submitting entropy seed for Staff #${currentIndex}` },
      { label: "On-Chain Paper Selection", detail: "Resolving pseudo-random consensus if quorum met" },
      { label: "Submit Shamir Key Share", detail: "Revealing piece and verifying Keccak-256 hash" },
    ];

    setTxModal({
      isOpen: true,
      title: `Submitting Staff #${currentIndex} Key Credentials`,
      subtitle: "Executing multi-step commit-reveal protocol on Ethereum",
      steps,
      currentStepIndex: 0,
      isComplete: false,
      error: null,
      txHash: null,
    });

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Inspection done
      await new Promise((r) => setTimeout(r, 400));
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));

      const staffSigner = await readProvider.getSigner(staffMember.address);

      const res = await submitStaffKeySequence(
        vaultRead,
        staffSigner,
        staffMember.address,
        keyFile,
        (msg) => {
          if (msg.includes("Advancing")) {
            setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
          } else if (msg.includes("entropy seed") || msg.includes("secret seed")) {
            setTxModal((prev) => ({ ...prev, currentStepIndex: 2 }));
          } else if (msg.includes("Threshold reached") || msg.includes("Selecting exam paper") || msg.includes("Consensus")) {
            setTxModal((prev) => ({ ...prev, currentStepIndex: 3 }));
          } else if (msg.includes("Revealing key piece") || msg.includes("Submitting cached")) {
            setTxModal((prev) => ({ ...prev, currentStepIndex: 4 }));
          }
        }
      );

      await refresh?.();
      setTxModal((prev) => ({
        ...prev,
        currentStepIndex: 5,
        isComplete: true,
      }));

      if (res?.quorumReached) {
        setSuccess(`🎉 3-of-5 Custodian Quorum Achieved! Paper ${res.selectedPaper !== null ? PAPER_NAMES[res.selectedPaper] : ""} is UNLOCKED on Ethereum!`);
      } else if (res?.paperSelected) {
        setSuccess(`✓ Key share for selected Paper ${res.selectedPaper !== null ? PAPER_NAMES[res.selectedPaper] : ""} successfully confirmed on the blockchain!`);
      } else {
        const totalSeeds = Math.min(3, (v.seedsRevealed || 0) + 1);
        setSuccess(`✓ Custodian #${currentIndex} entropy seed registered on Ethereum (${totalSeeds}/3 seeds toward paper draw). Switch to Custodian #${currentIndex < 5 ? currentIndex + 1 : 1} to continue.`);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.shortMessage || err.message || "Failed to submit key to the smart contract.";
      setError(errMsg);
      setTxModal((prev) => ({
        ...prev,
        error: errMsg,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmitQuorum = async () => {
    setTxModal({
      isOpen: true,
      title: "Auto-Submitting Remaining Quorum",
      subtitle: "Submitting Shamir key shares across custodians to reach 3-of-5 threshold",
      steps: [
        { label: "Check On-Chain Status", detail: "Resolving paper consensus if needed" },
        { label: "Reveal Custodian Pieces", detail: "Submitting 3 shares on ExamVault" },
        { label: "Quorum Achieved", detail: "Paper is unlocked on Ethereum!" },
      ],
      currentStepIndex: 0,
      isComplete: false,
      error: null,
      txHash: null,
    });
    setSubmitting(true);
    setError(null);

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await autoSubmitRemainingQuorum((msg) => {
        if (msg.includes("Quorum reached") || msg.includes("unlocked")) {
          setTxModal((prev) => ({ ...prev, currentStepIndex: 2 }));
        }
      });
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
      setSuccess("Quorum achieved! Exam paper is unlocked on Ethereum.");
    } catch (err) {
      console.error(err);
      const msg = err.shortMessage || err.message || "Failed to auto-submit quorum.";
      setError(msg);
      setTxModal((prev) => ({ ...prev, error: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStaffChange = (e) => {
    const nextId = e.target.value;
    window.location.hash = `#/staff/${nextId}`;
  };

  return (
    <div className="stack">
      {/* Live Web3 Transaction Modal */}
      <TransactionModal
        isOpen={txModal.isOpen}
        onClose={() => setTxModal((prev) => ({ ...prev, isOpen: false }))}
        title={txModal.title}
        subtitle={txModal.subtitle}
        steps={txModal.steps}
        currentStepIndex={txModal.currentStepIndex}
        isComplete={txModal.isComplete}
        error={txModal.error}
        txHash={txModal.txHash}
      />

      {/* Top Staff Switcher & Identity */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span className="eyebrow">KEY CUSTODIAN PORTAL (EXAM BOARD STAFF)</span>
              <span className="pill pill-muted mono small">{shortAddr(staffMember?.address)}</span>
            </div>
            <h1 className="h1">Key Custodian #{currentIndex}</h1>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              You are one of 5 appointed university keyholders. Any 3 keyholders must submit their secret shares to unlock the question paper for exam halls.
            </p>
          </div>

          {/* Quick Staff Switcher Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500" }}>
              Switch Custodian:
            </label>
            <div className="demo-select">
              <select value={currentIndex} onChange={handleStaffChange} aria-label="Switch Staff Member">
                {[1, 2, 3, 4, 5].map((id) => {
                  const s = v.staff[id - 1];
                  const label = s?.pieceRevealed ? "(Key ✓)" : s?.seedRevealed ? "(Seed ✓)" : "(Pending)";
                  return (
                    <option key={id} value={id}>
                      Key Custodian #{id} {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Visual Slashing Confirmation / Countdown Banner */}
      {isPieceRevealed ? (
        /* POSITIVE CONFIRMATION: Custodian Has Uploaded Their Key Share */
        <div className="slashing-alert-banner banner-protected">
          <div className="banner-header">
            <div className="banner-title-area">
              <div className="banner-icon">🛡️</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h2 className="banner-title" style={{ color: "var(--mint)" }}>
                    Custodian #{currentIndex} Key Share Confirmed On-Chain
                  </h2>
                  <span className="pill pill-mint small">✓ 0% Slashing Risk</span>
                  <span className="pill pill-muted small mono">1.00 ETH Protected</span>
                </div>
                <p className="banner-desc">
                  Your Shamir key share for Paper {v.paperSelected ? PAPER_NAMES[v.selectedPaper] : "A"} is cryptographically verified on Ethereum. You have fulfilled your duty. <b>Your 1.00 ETH staked deposit is 100% safe from penalties and cannot be slashed.</b>
                </p>
              </div>
            </div>
            {isRevealPhase && revealTimeLeft > 0 && (
              <div className="banner-countdown-box" style={{ borderColor: "var(--mint-border)", background: "rgba(194, 128, 62, 0.08)" }}>
                <span className="banner-countdown-label" style={{ color: "var(--mint)" }}>Reveal Window Closes In</span>
                <span className="banner-countdown-time mint-text">{fmtCountdown(revealTimeLeft)}</span>
                <span className="small muted mono" style={{ fontSize: "11px", marginTop: "2px" }}>For remaining custodians</span>
              </div>
            )}
          </div>
          <div className="banner-metrics-strip">
            <div className="metrics-chips">
              <div className="metric-chip">
                <span className="chip-label">Staked Escrow:</span>
                <span className="chip-val mint-text">1.00 ETH</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Slashing Risk:</span>
                <span className="chip-val mint-text">0.00 ETH (0%)</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Duty Status:</span>
                <span className="chip-val mint-text">✓ Fulfilled On-Chain</span>
              </div>
            </div>
            {v.staff.some((s) => !s.pieceRevealed) && isRevealPhase && (
              <span className="small muted">
                ⚠️ Custodians who have not yet uploaded still face 50% slashing when the window expires.
              </span>
            )}
          </div>
        </div>
      ) : isRevealPhase && revealTimeLeft > 0 ? (
        /* ACTIVE SLASHING WARNING: Custodian Has NOT Uploaded Yet */
        <div className="slashing-alert-banner banner-warning">
          <div className="banner-header">
            <div className="banner-title-area">
              <div className="banner-icon">⚠️</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h2 className="banner-title" style={{ color: "var(--amber)" }}>
                    ACTION REQUIRED: {revealMinutesLeft} Min Countdown To Upload Or 50% ETH Is Slashed!
                  </h2>
                  <span className="pill pill-amber small">⚠️ 0.50 ETH At Risk</span>
                  <span className="pill pill-muted small mono">Staff #{currentIndex} Pending</span>
                </div>
                <p className="banner-desc">
                  Paper <b>{PAPER_NAMES[v.selectedPaper]}</b> has been drawn on Ethereum! Custodian #{currentIndex} has <b>not submitted their key share yet</b>. You must upload your Shamir piece before the {revealWindowMinutes}-minute window expires. <b>If you fail to upload in time, 50% of your deposit (0.50 ETH) will be permanently slashed on-chain via penalise()!</b>
                </p>
              </div>
            </div>
            <div className="banner-countdown-box">
              <span className="banner-countdown-label">Slashing Countdown ({revealMinutesLeft}m left)</span>
              <span className={`banner-countdown-time ${revealTimeLeft < 120 ? "red-text" : "amber-text"}`}>
                ⏱️ {fmtCountdown(revealTimeLeft)}
              </span>
              <span className="small muted mono" style={{ fontSize: "11px", marginTop: "2px" }}>
                Deadline: {revealMinutesLeft} min remaining
              </span>
            </div>
          </div>
          <div className="banner-metrics-strip">
            <div className="metrics-chips">
              <div className="metric-chip">
                <span className="chip-label">Staked Collateral:</span>
                <span className="chip-val">1.00 ETH</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Slashing Penalty:</span>
                <span className="chip-val red-text">-0.50 ETH (50%)</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Protected Upon Upload:</span>
                <span className="chip-val mint-text">1.00 ETH (100%)</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Reveal Window:</span>
                <span className="chip-val">{revealWindowMinutes} Minutes ({revealWindowDuration}s)</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button className="btn btn-primary btn-sm" onClick={handleQuickLoad} disabled={submitting}>
                ⚡ Quick-Load Key File
              </button>
              <label className="btn btn-ghost btn-sm">
                Choose File
                <input type="file" accept=".json,application/json" onChange={handleFileUpload} hidden />
              </label>
            </div>
          </div>
        </div>
      ) : isRevealPhase && revealTimeLeft === 0 ? (
        /* EXPIRED SLASHING NOTICE: Custodian Failed To Upload */
        <div className="slashing-alert-banner banner-expired">
          <div className="banner-header">
            <div className="banner-title-area">
              <div className="banner-icon">🚨</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h2 className="banner-title" style={{ color: "var(--red)" }}>
                    REVEAL WINDOW EXPIRED — 50% STAKE (0.50 ETH) SUBJECT TO SLASHING
                  </h2>
                  <span className="pill pill-red small">🚨 Delinquent Custodian</span>
                </div>
                <p className="banner-desc">
                  The {revealWindowMinutes}-minute reveal window has elapsed. Custodian #{currentIndex} did not submit their key share for Paper {PAPER_NAMES[v.selectedPaper]}. Under the smart contract rules (<span className="mono">PENALTY_BPS = 5000</span>), <b>0.50 ETH (50% penalty)</b> will be forfeited upon settlement via <span className="mono">penalise()</span>.
                </p>
              </div>
            </div>
            <div className="banner-countdown-box" style={{ borderColor: "var(--red)", background: "rgba(239, 68, 68, 0.15)" }}>
              <span className="banner-countdown-label" style={{ color: "var(--red)" }}>Window Closed</span>
              <span className="banner-countdown-time red-text">00:00:00</span>
              <span className="small muted mono" style={{ fontSize: "11px", marginTop: "2px" }}>Slashing Active</span>
            </div>
          </div>
          <div className="banner-metrics-strip">
            <div className="metrics-chips">
              <div className="metric-chip">
                <span className="chip-label">Staked Deposit:</span>
                <span className="chip-val">1.00 ETH</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Penalty Slashed:</span>
                <span className="chip-val red-text">-0.50 ETH (50%)</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Remaining Stake:</span>
                <span className="chip-val">0.50 ETH</span>
              </div>
            </div>
          </div>
        </div>
      ) : isSeedPhase && !isSeedRevealed ? (
        /* SEED PHASE WARNING */
        <div className="slashing-alert-banner banner-warning">
          <div className="banner-header">
            <div className="banner-title-area">
              <div className="banner-icon">🎲</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h2 className="banner-title" style={{ color: "var(--amber)" }}>
                    Entropy Consensus Phase: {fmtCountdown(seedTimeLeft)} To Reveal Seed
                  </h2>
                  <span className="pill pill-amber small">🎲 Seed Reveal Active</span>
                </div>
                <p className="banner-desc">
                  Exam time has arrived! Custodians must reveal their entropy seeds to deterministically draw Paper A, B, or C. Submit your seed now to prevent duty delinquency.
                </p>
              </div>
            </div>
            <div className="banner-countdown-box">
              <span className="banner-countdown-label">Seed Window Left</span>
              <span className="banner-countdown-time amber-text">⏱️ {fmtCountdown(seedTimeLeft)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Stats / Status Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Individual Upload Status */}
        <div className="card">
          <span className="eyebrow">YOUR KEY UPLOAD STATUS</span>
          <div style={{ margin: "10px 0" }}>
            {isPieceRevealed ? (
              <span className="pill pill-mint" style={{ fontSize: "14px", padding: "6px 14px" }}>
                ✓ Key Uploaded & Verified On-Chain
              </span>
            ) : isRevealPhase && revealTimeLeft > 0 ? (
              <span className="pill pill-amber" style={{ fontSize: "14px", padding: "6px 14px" }}>
                ⚠️ Key Share Pending (Slashing Risk)
              </span>
            ) : isRevealPhase && revealTimeLeft === 0 ? (
              <span className="pill pill-red" style={{ fontSize: "14px", padding: "6px 14px" }}>
                🚨 Missed Deadline (Slashable)
              </span>
            ) : isSeedRevealed ? (
              <span className="pill pill-amber" style={{ fontSize: "14px", padding: "6px 14px" }}>
                🎲 Seed Registered ({v.seedsRevealed}/3 Seeds)
              </span>
            ) : (
              <span className="pill pill-muted" style={{ fontSize: "14px", padding: "6px 14px" }}>
                ⏳ Pending Key Upload
              </span>
            )}
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            {isPieceRevealed
              ? `Your Shamir key share for Paper ${v.paperSelected ? PAPER_NAMES[v.selectedPaper] : ""} is verified on Ethereum. Deposit 100% protected (0% slashing risk).`
              : isRevealPhase && revealTimeLeft > 0
              ? `Submit within ${fmtCountdown(revealTimeLeft)} (${revealMinutesLeft}m) to protect your 1.00 ETH deposit from a 0.50 ETH penalty.`
              : isRevealPhase && revealTimeLeft === 0
              ? `Reveal window closed. Custodian #${currentIndex} did not upload; 0.50 ETH is subject to slashing.`
              : isSeedRevealed && !v.paperSelected
              ? `Entropy seed registered! Awaiting remaining custodians (${v.seedsRevealed}/3 seeds) to determine paper.`
              : isSeedPhase
              ? "Window open! Submit your seed now to complete your on-chain duty."
              : "Upload and submit your key before or at the exam deadline."}
          </p>
        </div>

        {/* Dynamic Countdown Timer with Reveal Window */}
        <div className="card">
          <span className="eyebrow">
            {v.examTime === 0
              ? "DEADLINE COUNTDOWN"
              : timeLeft > 0
              ? "PHASE 1: EXAM COUNTDOWN"
              : isPieceRevealed
              ? "PHASE 3: YOUR DUTY FULFILLED"
              : isWindowExpired
              ? "DUTY WINDOW EXPIRED"
              : isRevealPhase
              ? `PHASE 2: KEY REVEAL WINDOW (PAPER ${PAPER_NAMES[v.selectedPaper]})`
              : "PHASE 2: SEED ENTROPY CONSENSUS"}
          </span>
          <div className="mono" style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0" }}>
            {v.examTime === 0 ? (
              <span className="amber-text" style={{ fontSize: "22px" }}>Awaiting Start</span>
            ) : timeLeft > 0 ? (
              fmtCountdown(timeLeft)
            ) : isPieceRevealed ? (
              <span className="mint-text" style={{ fontSize: "22px" }}>✓ 1.00 ETH PROTECTED</span>
            ) : isWindowExpired ? (
              <span className="red-text" style={{ fontSize: "22px" }}>00:00:00 (EXPIRED)</span>
            ) : isRevealPhase ? (
              <span className={revealTimeLeft < 120 ? "red-text" : "amber-text"}>
                {fmtCountdown(revealTimeLeft)}
              </span>
            ) : (
              <span className={seedTimeLeft < 60 ? "red-text" : "amber-text"}>
                {fmtCountdown(seedTimeLeft)}
              </span>
            )}
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            {v.examTime === 0 ? (
              <span className="amber-text">Exam schedule awaiting start in Admin Portal.</span>
            ) : timeLeft > 0 ? (
              <>Time remaining until exam: <b>{fmtLocalTime(v.examTime)}</b> (keys locked on-chain)</>
            ) : isPieceRevealed ? (
              <span className="mint-text">
                ✓ Key share verified on Ethereum. Custodian #{currentIndex} has zero slashing risk.
                {revealTimeLeft > 0 ? ` (Remaining reveal window: ${fmtCountdown(revealTimeLeft)} for other custodians).` : ""}
              </span>
            ) : isWindowExpired ? (
              <span className="red-text">Duty window closed. Custodian #{currentIndex} missed deadline; 50% deposit (0.50 ETH) is slashed!</span>
            ) : isRevealPhase ? (
              <span className="amber-text">
                ⚠️ <b>Action Required:</b> {revealMinutesLeft} min remaining to upload key share or 0.50 ETH will be slashed! (Even if 3/5 quorum is reached, delinquent staff are still penalized).
              </span>
            ) : (
              isSeedRevealed ? (
                <span className="mint-text">✓ Your seed is registered on-chain. ({v.seedsRevealed}/3 seeds revealed for consensus).</span>
              ) : (
                <span className="amber-text">⚠️ <b>Seed Window Active:</b> Reveal entropy seed to randomly select paper.</span>
              )
            )}
          </p>
        </div>

        {/* Custodian Staking Deposit with Dynamic Slashing Alert */}
        <div className="card">
          <span className="eyebrow">YOUR STAKE DEPOSIT</span>
          <div className="mono" style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0" }}>
            <span className={staffMember?.penalised ? "red-text" : isPieceRevealed ? "mint-text" : isRevealPhase && !isPieceRevealed ? "amber-text" : "mint-text"}>
              {staffMember?.penalised ? "0.50" : "1.00"}
            </span>
            <span className="muted" style={{ fontSize: "20px" }}> ETH</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
            {staffMember?.penalised ? (
              <span className="pill pill-red small">🚨 Slashed (-0.50 ETH)</span>
            ) : isPieceRevealed ? (
              <span className="pill pill-mint small">✓ 100% Protected (No Slash)</span>
            ) : isSeedRevealed && !v.paperSelected ? (
              <span className="pill pill-mint small">✓ Seed Duty Fulfilled</span>
            ) : isRevealPhase && revealTimeLeft > 0 ? (
              <span className="pill pill-amber small">⚠️ 0.50 ETH At Risk</span>
            ) : isRevealPhase && revealTimeLeft === 0 ? (
              <span className="pill pill-red small">🚨 0.50 ETH Slashable</span>
            ) : (
              <span className="pill pill-mint small">✓ Deposit Active (Escrow)</span>
            )}
            <span className="muted small mono">
              {staffMember?.penalised ? "Collateral Slashed" : "Smart Contract Escrow"}
            </span>
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            {staffMember?.penalised
              ? "Missed reveal deadline. 0.50 ETH penalty was slashed; 0.50 ETH remains in contract."
              : isPieceRevealed
              ? "Duty fulfilled. Your full 1.00 ETH deposit is protected and refundable."
              : isSeedRevealed && !v.paperSelected
              ? "Entropy seed confirmed on-chain. Collateral safe."
              : isRevealPhase && revealTimeLeft > 0
              ? `Upload key share within ${fmtCountdown(revealTimeLeft)} (${revealMinutesLeft}m) to avoid 50% (0.50 ETH) slash.`
              : isRevealPhase && revealTimeLeft === 0
              ? "Window expired without upload. Subject to 50% penalty (0.50 ETH) upon settlement."
              : "Submitting your key piece during the reveal window prevents stake slashing."}
          </p>
        </div>
      </div>

      {/* Unified 3-of-5 Shamir Quorum Visualizer & Custodian Slashing Roster */}
      <QuorumVisualizer
        vault={v}
        role="staff"
        currentStaffIndex={currentIndex}
        isRevealPhase={isRevealPhase}
        isSeedPhase={isSeedPhase}
        revealTimeLeft={revealTimeLeft}
        seedTimeLeft={seedTimeLeft}
        revealMinutesLeft={revealMinutesLeft}
        revealWindowMinutes={revealWindowMinutes}
      />

      {/* Key Upload & Submission Card */}
      <section
        className={`card ${isDragging ? "dropzone-active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ position: "relative", overflow: "hidden" }}
      >
        {/* Animated Laser Scanning Line */}
        {isScanning && <div className="laser-scanner-line" />}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
          <h2 className="card-title" style={{ margin: 0 }}>Upload Key File</h2>
          <span className="pill pill-muted mono small">Custodian #{currentIndex}</span>
        </div>

        {/* Dynamic Contextual Guidance Banner */}
        {isSeedPhase && !isSeedRevealed && (
          <div className="context-notice-box notice-amber">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>⏳</span>
              <div>
                <strong>Entropy Consensus Phase:</strong>
                <div className="small muted">
                  The exam deadline has arrived! Submit your key file to contribute your entropy seed. Any 3 seeds combine on-chain to randomly select Paper A, B, or C.
                </div>
              </div>
            </div>
            <div className="mono small" style={{ fontWeight: "700", color: "var(--amber)" }}>
              ⏱️ {fmtCountdown(activeWindowLeft)}
            </div>
          </div>
        )}

        {isSeedPhase && isSeedRevealed && !v.paperSelected && (
          <div className="context-notice-box notice-mint">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🎲</span>
              <div>
                <strong style={{ color: "var(--mint)" }}>Custodian #{currentIndex} Entropy Seed Registered!</strong>
                <div className="small muted">
                  Confirmed on Ethereum ({v.seedsRevealed}/3 seeds revealed). Awaiting remaining custodians to finalize paper selection draw.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {currentIndex < 5 && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { window.location.hash = `#/staff/${currentIndex + 1}`; }}
                >
                  Switch to Custodian #{currentIndex + 1} ➔
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleAutoSubmitQuorum}
                disabled={submitting}
              >
                ⚡ Auto-Submit Quorum
              </button>
            </div>
          </div>
        )}

        {isRevealPhase && !isPieceRevealed && (
          <div className="context-notice-box notice-amber">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🔐</span>
              <div>
                <strong style={{ color: "var(--amber)" }}>Paper {PAPER_NAMES[v.selectedPaper]} Selected On-Chain — Reveal Window Active!</strong>
                <div className="small muted">
                  Decentralized entropy draw resolved. Submit your Shamir share for Paper {PAPER_NAMES[v.selectedPaper]} within {revealMinutesLeft} minutes to unlock the paper and prevent 0.50 ETH (50%) stake slashing.
                </div>
              </div>
            </div>
            <div className="mono small" style={{ fontWeight: "700", color: "var(--amber)", fontSize: "14px" }}>
              ⏱️ {fmtCountdown(revealTimeLeft)} ({revealMinutesLeft}m left)
            </div>
          </div>
        )}

        {/* Zero-Knowledge Security Notice */}
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "10px 14px",
            margin: "10px 0 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
          }}
        >
          <span style={{ fontSize: "18px" }}>🛡️</span>
          <div>
            <strong style={{ color: "var(--text)" }}>Zero-Knowledge Custodian Protocol:</strong>{" "}
            <span className="muted">
              You are uploading your <em>mathematical Shamir Key Share</em> (from <span className="mono">staff-{currentIndex}.json</span>), NOT the question paper. Staff custodians never hold plaintext questions, preventing pre-exam leakage.
            </span>
          </div>
        </div>

        {isPieceRevealed ? (
          <div style={{ background: "var(--mint-tint)", border: "1px solid var(--mint-border)", padding: "20px", borderRadius: "14px" }}>
            <div style={{ color: "var(--mint)", fontWeight: "600", fontSize: "16px", marginBottom: "6px" }}>
              ✓ You have fulfilled your custodian duty — 1.00 ETH Deposit Safe
            </div>
            <p className="muted small" style={{ margin: "0 0 12px" }}>
              Your key share is registered and cryptographically verified on the smart contract. You are completely exempt from any slashing penalty.
            </p>
            <div className="mono small muted">
              Verified for Paper: <b>Paper {v.paperSelected ? PAPER_NAMES[v.selectedPaper] : "A"}</b> · Share Quorum: <b>{v.piecesRevealed}/3</b>
            </div>

            {/* Quick Actions after Submission */}
            {!isUnlocked && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--mint-border)" }}>
                {currentIndex < 5 && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { window.location.hash = `#/staff/${currentIndex + 1}`; }}
                  >
                    Switch to Custodian #{currentIndex + 1} ➔
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleAutoSubmitQuorum}
                  disabled={submitting}
                >
                  ⚡ Auto-Submit Quorum (Staff 1–3)
                </button>
              </div>
            )}
            {isUnlocked && (
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--mint-border)" }}>
                <a className="btn btn-primary btn-sm" href="#/college">
                  Proceed to Examination Centre Portal ➔
                </a>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="muted small" style={{ marginBottom: "16px" }}>
              Select, drag & drop, or quick-load your confidential key file (<span className="mono">staff-{currentIndex}.json</span>) to submit your key share to the smart contract:
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <label className="btn btn-ghost">
                <FileIcon size={16} />
                {keyFile ? "Choose Different File" : `Select staff-${currentIndex}.json`}
                <input type="file" accept=".json,application/json" onChange={handleFileUpload} hidden />
              </label>

              <button className="btn btn-ghost btn-sm" onClick={handleQuickLoad} disabled={submitting}>
                ⚡ Quick-Load Demo Key (Staff #{currentIndex})
              </button>

              {keyFile && (
                <span className="mint-text inline-icon small" style={{ marginLeft: "8px" }}>
                  ✓ Key Loaded (Staff #{keyFile.staffIndex || currentIndex})
                </span>
              )}
            </div>

            {/* Live Cryptographic Key Share Inspector Card */}
            {keyFile && (
              <div className="key-inspector-card">
                <div className="key-inspector-header">
                  <div className="key-inspector-title">
                    <span>🔐</span>
                    <span>Cryptographic Key Share Container (Staff #{keyFile.staffIndex || currentIndex})</span>
                  </div>
                  <span className="pill pill-mint small mono">Decrypted in Memory</span>
                </div>

                <div className="key-shares-grid">
                  {["A", "B", "C"].map((pLetter, pIdx) => {
                    const isSelected = v.paperSelected && v.selectedPaper === pIdx;
                    const pieceHex = keyFile.pieces?.[pIdx] || "";
                    return (
                      <div key={pLetter} className={`share-piece-box ${isSelected ? "highlight" : ""}`}>
                        <div className="share-label">
                          <span>PAPER {pLetter} SHAMIR SHARE</span>
                          {isSelected ? (
                            <span className="mint-text">SELECTED ★</span>
                          ) : !v.paperSelected ? (
                            <span className="muted mono" style={{ fontSize: "10px" }}>CANDIDATE</span>
                          ) : null}
                        </div>
                        <div className="share-hex mono" title={pieceHex}>
                          {pieceHex ? `${pieceHex.slice(0, 10)}…${pieceHex.slice(-8)}` : "—"}
                        </div>
                        <div className="muted mono" style={{ fontSize: "10.5px", marginTop: "4px" }}>
                          32-Byte Secret Piece
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="seed-box">
                  <div>
                    <span className="muted mono small">ENTROPY SEED: </span>
                    <span className="mono" style={{ fontWeight: "600", color: "var(--text)" }}>
                      {keyFile.seed !== undefined ? `0x${BigInt(keyFile.seed).toString(16)}` : "N/A"}
                    </span>
                  </div>
                  <span className="mint-text mono small">✓ Valid Commit-Reveal Format</span>
                </div>

                <div className="mono small muted" style={{ marginTop: "8px", fontSize: "11px" }}>
                  {!v.paperSelected
                    ? "ℹ️ Candidate paper (A, B, or C) will be randomly drawn on Ethereum once 3 custodian seeds are submitted."
                    : `★ Paper ${PAPER_NAMES[v.selectedPaper]} was selected on-chain. Submitting this file reveals your Paper ${PAPER_NAMES[v.selectedPaper]} share.`}
                </div>
              </div>
            )}

            <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {isSeedRevealed && !v.paperSelected ? (
                <>
                  <button
                    className="btn btn-ghost btn-lg"
                    disabled
                    style={{ opacity: 0.8 }}
                  >
                    ✓ Seed Registered (Waiting for 3 Custodians)
                  </button>
                  {currentIndex < 5 && (
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => { window.location.hash = `#/staff/${currentIndex + 1}`; }}
                    >
                      Switch to Custodian #{currentIndex + 1} ➔
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-lg"
                    onClick={handleAutoSubmitQuorum}
                    disabled={submitting}
                  >
                    ⚡ Auto-Submit Quorum (Staff 1–3)
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleSubmitKey}
                    disabled={!keyFile || submitting}
                  >
                    {submitting
                      ? "Submitting to Blockchain..."
                      : v.paperSelected
                      ? `Submit Paper ${PAPER_NAMES[v.selectedPaper]} Share`
                      : "Submit Key to Smart Contract"}
                  </button>
                  {isSeedRevealed && (
                    <button
                      className="btn btn-ghost btn-lg"
                      onClick={handleAutoSubmitQuorum}
                      disabled={submitting}
                    >
                      ⚡ Auto-Submit Quorum (Staff 1–3)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: "14px" }}><Notice tone="red">{error}</Notice></div>}
        {success && <div style={{ marginTop: "14px" }}><Notice tone="mint">{success}</Notice></div>}
      </section>

      {/* Custodian Protocol Telemetry & Security Guarantees */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span className="eyebrow">PROTOCOL SECURITY ARCHITECTURE</span>
            <h2 className="card-title" style={{ margin: "2px 0 0" }}>Custodian Cryptographic Guarantees</h2>
          </div>
          <span className="pill pill-muted mono small">EVM Contract Verification</span>
        </div>

        <div className="credential-grid">
          <div className="credential-item">
            <div className="credential-icon">🛡️</div>
            <div className="credential-title">3-of-5 Shamir Secret Sharing</div>
            <p className="credential-desc">
              Your key share contains zero readable plaintext alone. The quadratic polynomial guarantees mathematical impossibility of reconstruction with fewer than 3 custodians.
            </p>
            <div className="credential-status mint-text mono">
              <span>✓ Polynomial Threshold (k=3, n=5)</span>
            </div>
          </div>

          <div className="credential-item">
            <div className="credential-icon">🥩</div>
            <div className="credential-title">On-Chain Staking Security</div>
            <p className="credential-desc">
              Each staff member stakes 1.00 ETH on contract deployment. Submitting invalid shares or failing to reveal within the challenge window triggers an automatic slashing penalty.
            </p>
            <div className="credential-status mint-text mono">
              <span>✓ 1.00 ETH Staked & Protected</span>
            </div>
          </div>

          <div className="credential-item">
            <div className="credential-icon">⚡</div>
            <div className="credential-title">Commit-Reveal Integrity</div>
            <p className="credential-desc">
              Before exam creation, a Keccak-256 fingerprint of your pieces was committed to ExamVault. The smart contract validates every submitted piece against this immutable commitment.
            </p>
            <div className="credential-status mint-text mono">
              <span>✓ Keccak-256 Validated</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

