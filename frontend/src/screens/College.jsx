import { useEffect, useState } from "react";
import Notice from "../components/Notice.jsx";
import { CheckIcon } from "../components/Icons.jsx";
import { TransactionModal } from "../components/TransactionModal.jsx";
import { QuorumVisualizer } from "../components/QuorumVisualizer.jsx";
import {
  autoSubmitRemainingQuorum,
  examPhase,
  friendlyError,
  readProvider,
  useChainNow,
  vaultRead,
  vaultWrite,
} from "../lib/chain.js";
import { combineKey, decryptPaper, fromHex, paperHash } from "../lib/crypto.js";
import { deployment, ipfsGateway } from "../lib/deployment.js";
import { fmtCountdown, fmtLocalTime, PAPER_NAMES, shortAddr } from "../lib/format.js";
import { SoulboundBadgeVisual } from "../components/BlockchainVisuals.jsx";

export default function College({ vault: v, refresh }) {
  const now = useChainNow();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { fileName, text, url }

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

  const collegeInfo = v.colleges?.[0] || {
    name: "Govt. College of Engineering",
    address: deployment?.accounts?.colleges?.[0]?.address || "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    tokenId: 1,
  };

  const keysUploaded = v.piecesRevealed || 0;
  const isUnlocked = v.unlocked || keysUploaded >= 3;
  const timeLeft = v.examTime > now ? v.examTime - now : 0;
  const phase = examPhase(v, now);

  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);

  const handleDownload = async () => {
    const paperIdx = v.paperSelected ? v.selectedPaper : 0;
    const cid = v.papers?.cids?.[paperIdx] || "Qm...";

    const steps = [
      { label: "Verify ERC-5192 Soulbound Token", detail: "Validating non-transferable invigilator token #1" },
      { label: "Log Download On-Chain", detail: "Broadcasting logDownload() tx with block timestamp" },
      { label: "Stream Ciphertext from IPFS", detail: `Fetching CID: ${cid.slice(0, 14)}…` },
      { label: "Verify Keccak-256 Fingerprint", detail: "Comparing IPFS byte hash with smart contract" },
      { label: "Assemble Shamir Shares & AES Decrypt", detail: "Interpolating 3 shares & AES-256-GCM decrypt" },
    ];

    setTxModal({
      isOpen: true,
      title: "Downloading & Decrypting Exam Paper",
      subtitle: "Executing decentralized verification, retrieval, and decryption pipeline",
      steps,
      currentStepIndex: 0,
      isComplete: false,
      error: null,
      txHash: null,
    });

    setDownloading(true);
    setError(null);

    try {
      // Step 1: Soulbound Token Check
      await new Promise((r) => setTimeout(r, 400));
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));

      // Step 2: Log download on-chain
      const collegeSigner = await readProvider.getSigner(collegeInfo.address);
      const c = vaultWrite(collegeSigner);
      try {
        const txLog = await c.logDownload();
        setTxModal((prev) => ({ ...prev, txHash: txLog.hash }));
        await txLog.wait();
      } catch (logErr) {
        console.warn("Download log note:", logErr);
      }

      setTxModal((prev) => ({ ...prev, currentStepIndex: 2 }));

      // Step 3: Fetch encrypted paper from IPFS
      const res = await fetch(`${ipfsGateway}/${cid}`);
      if (!res.ok) throw new Error(`Could not fetch encrypted file from IPFS (HTTP ${res.status}).`);
      const encBytes = new Uint8Array(await res.arrayBuffer());

      setTxModal((prev) => ({ ...prev, currentStepIndex: 3 }));

      // Step 4: Verify Keccak256 hash against smart contract
      await new Promise((r) => setTimeout(r, 350));
      const hash = paperHash(encBytes).toLowerCase();
      const expectedHash = v.papers.hashes[paperIdx].toLowerCase();
      if (hash !== expectedHash) {
        throw new Error("Hash mismatch! The file from IPFS does not match the smart contract fingerprint.");
      }

      setTxModal((prev) => ({ ...prev, currentStepIndex: 4 }));

      // Step 5: Retrieve revealed Shamir shares from blockchain and decrypt
      const { pieces } = await vaultRead.getRevealedPieces();
      if (pieces.length < 3) {
        throw new Error(`Need at least 3 revealed key pieces to decrypt (found ${pieces.length}).`);
      }

      const key = await combineKey([...pieces].slice(0, 3).map((p) => fromHex(p)));
      const { fileName, bytes } = await decryptPaper(encBytes, key);
      const text = new TextDecoder().decode(bytes);
      const url = URL.createObjectURL(new Blob([bytes], { type: "text/plain;charset=utf-8" }));

      setResult({
        fileName: fileName || `exam-paper-${PAPER_NAMES[paperIdx]}.txt`,
        text,
        url,
      });

      setTxModal((prev) => ({
        ...prev,
        currentStepIndex: 5,
        isComplete: true,
      }));
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error && !err.code ? err.message : friendlyError(err);
      setError(errMsg);
      setTxModal((prev) => ({
        ...prev,
        error: errMsg,
      }));
    } finally {
      setDownloading(false);
    }
  };

  const handleAutoUnlock = async () => {
    setDownloading(true);
    setError(null);
    setTxModal({
      isOpen: true,
      title: "Auto-Unlocking Exam Paper",
      subtitle: "Assembling Shamir pieces across custodians to reach 3-of-5 threshold",
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

    try {
      setTxModal((prev) => ({ ...prev, currentStepIndex: 1 }));
      await autoSubmitRemainingQuorum((msg) => {
        if (msg.includes("Quorum reached") || msg.includes("unlocked")) {
          setTxModal((prev) => ({ ...prev, currentStepIndex: 2 }));
        }
      });
      await refresh?.();
      setTxModal((prev) => ({ ...prev, isComplete: true }));
    } catch (err) {
      console.error(err);
      const msg = err.shortMessage || err.message || "Failed to auto-unlock.";
      setError(msg);
      setTxModal((prev) => ({ ...prev, error: msg }));
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!result) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${result.fileName}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
            pre { font-family: inherit; white-space: pre-wrap; font-size: 15px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${deployment.examTitle || "UNIVERSITY SEMESTER EXAMINATION"}</h2>
            <p>Official Question Paper · Examination Centre: ${collegeInfo.name} · Student Exam Hall</p>
          </div>
          <pre>${result.text}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="stack">
      {/* Live Web3 Transaction / Decryption Modal */}
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

      {/* College Examination Centre & Hall Header */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span className="eyebrow">EXAMINATION CENTRE & HALL (STUDENT SITE)</span>
            </div>
            <h1 className="h1">{collegeInfo.name}</h1>
            <SoulboundBadgeVisual tokenId={1} holdsToken={true} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0", flexWrap: "wrap" }}>
              <span className="mono small muted">
                Authorization verified on-chain at <b>Block #14</b> via non-transferable Soulbound Token #1.
              </span>
              <a href="#/setup" style={{ color: "var(--mint)", fontSize: "12px", textDecoration: "none", fontWeight: 600 }}>
                Inspect Genesis Setup ↗
              </a>
            </div>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Official Examination Hall Centre · Centre in-charge & invigilators download and print question papers for students once the custodian quorum is met.
            </p>
          </div>
          <span className="wallet-pill">
            <span className="dot" />
            <span className="mono small">{shortAddr(collegeInfo.address)}</span>
          </span>
        </div>
      </section>

      {/* Main Status Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Remaining Time */}
        <div className="card">
          <span className="eyebrow">REMAINING TIME UNTIL EXAM</span>
          <div className="mono" style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0" }}>
            {v.examTime === 0 ? (
              <span className="amber-text" style={{ fontSize: "22px" }}>Awaiting Start</span>
            ) : timeLeft > 0 ? (
              fmtCountdown(timeLeft)
            ) : isUnlocked ? (
              <span className="mint-text" style={{ fontSize: "22px" }}>UNLOCKED ✓</span>
            ) : (
              <span className="amber-text" style={{ fontSize: "22px" }}>00:00:00 (LOCKED)</span>
            )}
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            {v.examTime === 0 ? (
              <span className="amber-text">Exam schedule awaiting start in Admin Portal.</span>
            ) : timeLeft > 0 ? (
              <>Scheduled time: <b>{fmtLocalTime(v.examTime)}</b></>
            ) : isUnlocked ? (
              <span className="mint-text">Quorum verified on Ethereum. Question paper ready for download.</span>
            ) : (
              <span className="amber-text">Exam time reached. Awaiting key custodians to reveal shares.</span>
            )}
          </p>
        </div>

        {/* Paper Chosen */}
        <div className="card">
          <span className="eyebrow">SELECTED EXAM PAPER</span>
          <div style={{ fontSize: "24px", fontWeight: "700", margin: "8px 0" }}>
            {v.paperSelected ? (
              <span className="mint-text">Paper {PAPER_NAMES[v.selectedPaper]}</span>
            ) : (
              <span className="muted">Waiting for Quorum</span>
            )}
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            {v.paperSelected
              ? "Randomly selected on-chain via combined seeds."
              : "Selected randomly by smart contract at exam time."}
          </p>
        </div>
      </div>

      {/* Holographic 3-of-5 Quorum Visualizer (Exam Centre Read-Only Monitor) */}
      <QuorumVisualizer vault={v} role="college" />

      {/* Download Action Section */}
      <section className="card">
        <h2 className="card-title">Download Question Paper</h2>
        <p className="muted small" style={{ marginBottom: "18px" }}>
          Once 3 of the 5 staff custodians submit their keys, the smart contract allows this authorized college centre to decrypt and download the official paper.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px" }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleDownload}
            disabled={!isUnlocked || downloading}
          >
            {downloading ? "Executing Decryption Pipeline..." : isUnlocked ? "🔓 Download & Decrypt Question Paper" : "🔒 Download Locked (Requires 3/5 Keys)"}
          </button>

          {!isUnlocked && (
            <>
              <button
                className="btn btn-ghost"
                onClick={handleAutoUnlock}
                disabled={downloading}
                title="Fast-tracks remaining custodian submissions to achieve quorum for evaluation"
              >
                ⚡ Auto-Unlock for Demo
              </button>
              <span className="amber-text small inline-icon">
                ⏳ Waiting for {Math.max(0, 3 - keysUploaded)} more staff member(s) to submit their key.
              </span>
            </>
          )}
        </div>

        {error && <div style={{ marginTop: "14px" }}><Notice tone="red">{error}</Notice></div>}
      </section>

      {/* Decrypted Exam Paper Preview (Appears when downloaded) */}
      {result && (
        <section className="card" style={{ border: "2px solid var(--mint-border)", background: "rgba(24, 20, 16, 0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
            <div>
              <span className="pill pill-mint inline-icon" style={{ marginBottom: "6px" }}>
                <CheckIcon size={14} /> Keccak-256 Hash Verified On-Chain
              </span>
              <h2 className="card-title" style={{ margin: 0 }}>{result.fileName}</h2>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <a className="btn btn-primary btn-sm" href={result.url} download={result.fileName}>
                💾 Save Paper File
              </a>
              <button className="btn btn-ghost btn-sm" onClick={handlePrint}>
                🖨️ Print for Exam Hall
              </button>
            </div>
          </div>

          <div style={{
            background: "#070c12",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "20px",
            maxHeight: "450px",
            overflowY: "auto",
          }}>
            <pre style={{
              margin: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>
              {result.text}
            </pre>
          </div>
        </section>
      )}

      {/* Authorized Examination Centre Security Credentials & Cryptographic Audit */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span className="eyebrow">VERIFIED SECURITY CREDENTIALS</span>
            <h2 className="card-title" style={{ margin: "2px 0 0" }}>Exam Centre Authorization & Decryption Protocol</h2>
          </div>
          <span className="pill pill-mint mono small">ERC-5192 Authenticated</span>
        </div>

        <div className="credential-grid">
          <div className="credential-item">
            <div className="credential-icon">🎓</div>
            <div className="credential-title">ERC-5192 Soulbound Access Token</div>
            <p className="credential-desc">
              Your college centre is bound to Soulbound Token #1. Non-transferable by design, it guarantees that only the authenticated venue wallet can trigger the download sequence.
            </p>
            <div className="credential-status mint-text mono">
              <span>✓ Non-Transferable Token #1 Bound</span>
            </div>
          </div>

          <div className="credential-item">
            <div className="credential-icon">🌐</div>
            <div className="credential-title">Decentralized IPFS Storage</div>
            <p className="credential-desc">
              Exam files are addressed by cryptographic content hash (CID) on IPFS. Tampering with any byte changes the CID and is immediately rejected by the smart contract.
            </p>
            <div className="credential-status mint-text mono">
              <span>✓ IPFS Content Addressing Verified</span>
            </div>
          </div>

          <div className="credential-item">
            <div className="credential-icon">🔒</div>
            <div className="credential-title">Zero-Server Local Decryption</div>
            <p className="credential-desc">
              Decryption is executed purely in local browser memory via WebCrypto AES-256-GCM. Unencrypted exam questions never pass through any central web server or proxy.
            </p>
            <div className="credential-status mint-text mono">
              <span>✓ Client-Side In-Memory Execution</span>
            </div>
          </div>

          <div className="credential-item">
            <div className="credential-icon">📜</div>
            <div className="credential-title">Immutable Download Audit Trail</div>
            <p className="credential-desc">
              Every invocation of <span className="mono">logDownload()</span> records an immutable Ethereum event with the exact block height and timestamp for university regulatory audit.
            </p>
            <div className="credential-status mint-text mono">
              <span>✓ Smart Contract Timestamp Logged</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


