import { useState, useEffect, useRef } from "react";
import { deployment, ipfsGateway, hasLiveDeployment, clearLiveDeployment } from "../lib/deployment.js";
import { CANDIDATE_PAPERS } from "../lib/papersData.js";
import { shortAddr } from "../lib/format.js";
import { checkNodeStatus, executeLiveGenesis, resetHardhatNode } from "../lib/liveDeployer.js";

// Detailed data for all 14 sequential blocks + the Paper Setter cryptographic phase
const LEDGER_STEPS = [
  {
    block: 0,
    phase: "genesis",
    title: "Block #0: Ethereum Genesis State",
    method: "hardfork.init()",
    category: "CHAIN_GENESIS",
    badge: "Genesis Block",
    badgeColor: "muted",
    summary: "Hardhat local EVM node initialized. Chain ID 31337 active with 20 pre-funded test accounts.",
    telemetry: {
      "Block Height": "#0",
      "Chain ID": "31337",
      "Gas Used": "0 Gwei",
      "Ledger State": "Empty / Awaiting Deployments",
    },
    visualHighlight: "genesis",
  },
  {
    block: 1,
    phase: "contracts",
    title: "Block #1: Smart Contract Deployment",
    method: "factory.deploy(ExamVault)",
    category: "SMART_CONTRACT",
    badge: "Contract Deployment",
    badgeColor: "mint",
    summary:
      "Admin deploys the immutable ExamVault.sol contract. During execution, it automatically deploys the ERC-5192 CollegeAccessToken sub-contract, ensuring only the vault can mint.",
    telemetry: {
      "Vault Address": deployment?.vault || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "Soulbound Token": deployment?.accessToken || "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be",
      "Deployer": shortAddr(deployment?.accounts?.admin || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
      "Bytecode": "Verified EVM Opcodes (Solidity 0.8.20)",
    },
    visualHighlight: "vault_ignite",
  },
  {
    block: 2,
    phase: "staff_reg",
    title: "Block #2: Staff Custodian #1 Registration",
    method: "vault.registerStaff(Staff 1)",
    category: "ACCESS_CONTROL",
    badge: "Staff Onboarding",
    badgeColor: "mint",
    summary: "Central Admin enrolls Staff Custodian #1 into the authorized threshold decryption ring.",
    telemetry: {
      "Custodian Index": "Staff #1 of 5",
      "Wallet Address": shortAddr(deployment?.accounts?.staff?.[0] || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
      "Quorum Role": "Key Share Holder",
      "On-Chain Status": "Registered ✓",
    },
    visualHighlight: "staff_1",
  },
  {
    block: 3,
    phase: "staff_reg",
    title: "Block #3: Staff Custodian #2 Registration",
    method: "vault.registerStaff(Staff 2)",
    category: "ACCESS_CONTROL",
    badge: "Staff Onboarding",
    badgeColor: "mint",
    summary: "Central Admin enrolls Staff Custodian #2 into the authorized threshold decryption ring.",
    telemetry: {
      "Custodian Index": "Staff #2 of 5",
      "Wallet Address": shortAddr(deployment?.accounts?.staff?.[1] || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"),
      "Quorum Role": "Key Share Holder",
      "On-Chain Status": "Registered ✓",
    },
    visualHighlight: "staff_2",
  },
  {
    block: 4,
    phase: "staff_reg",
    title: "Block #4: Staff Custodian #3 Registration",
    method: "vault.registerStaff(Staff 3)",
    category: "ACCESS_CONTROL",
    badge: "Staff Onboarding",
    badgeColor: "mint",
    summary: "Central Admin enrolls Staff Custodian #3 into the authorized threshold decryption ring.",
    telemetry: {
      "Custodian Index": "Staff #3 of 5",
      "Wallet Address": shortAddr(deployment?.accounts?.staff?.[2] || "0x90F79bf6EB2c4f870365E785982E1f101E93b906"),
      "Quorum Role": "Key Share Holder",
      "On-Chain Status": "Registered ✓",
    },
    visualHighlight: "staff_3",
  },
  {
    block: 5,
    phase: "staff_reg",
    title: "Block #5: Staff Custodian #4 Registration",
    method: "vault.registerStaff(Staff 4)",
    category: "ACCESS_CONTROL",
    badge: "Staff Onboarding",
    badgeColor: "mint",
    summary: "Central Admin enrolls Staff Custodian #4 into the authorized threshold decryption ring.",
    telemetry: {
      "Custodian Index": "Staff #4 of 5",
      "Wallet Address": shortAddr(deployment?.accounts?.staff?.[3] || "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"),
      "Quorum Role": "Key Share Holder",
      "On-Chain Status": "Registered ✓",
    },
    visualHighlight: "staff_4",
  },
  {
    block: 6,
    phase: "staff_reg",
    title: "Block #6: Staff Custodian #5 Registration",
    method: "vault.registerStaff(Staff 5)",
    category: "ACCESS_CONTROL",
    badge: "Ring Complete (5/5)",
    badgeColor: "mint",
    summary: "Staff Custodian #5 is registered. The 5-member custodian threshold group is now fully onboarded.",
    telemetry: {
      "Custodian Index": "Staff #5 of 5",
      "Wallet Address": shortAddr(deployment?.accounts?.staff?.[4] || "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"),
      "Quorum Quorum": "3-of-5 Required",
      "Decryption Ring": "100% Sealed (5/5)",
    },
    visualHighlight: "staff_5",
  },
  {
    block: 7,
    phase: "college_reg",
    title: "Block #7: Exam Center #1 Registration",
    method: "vault.registerCollege(College 1)",
    category: "EXAM_CENTER",
    badge: "Center Onboarding",
    badgeColor: "mint",
    summary: "Admin registers Govt. College of Engineering as an authorized exam center eligible to receive an access token.",
    telemetry: {
      "College Name": "Govt. College of Engineering",
      "College Address": shortAddr(deployment?.accounts?.colleges?.[0]?.address || "0x976EA74026E726554dB657fA54763abd0C3a0aa9"),
      "Assigned Account": "Account #6",
      "Access Token": "Eligible for Soulbound NFT",
    },
    visualHighlight: "college_1",
  },
  {
    block: 8,
    phase: "college_reg",
    title: "Block #8: Exam Center #2 Registration",
    method: "vault.registerCollege(College 2)",
    category: "EXAM_CENTER",
    badge: "Center Onboarding",
    badgeColor: "mint",
    summary: "Admin registers City Arts College (Control group testing for access denial without soulbound token).",
    telemetry: {
      "College Name": "City Arts College",
      "College Address": shortAddr(deployment?.accounts?.colleges?.[1]?.address || "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"),
      "Assigned Account": "Account #7",
      "Access Token": "Unfunded / No Token",
    },
    visualHighlight: "college_2",
  },
  {
    block: 8.5,
    phase: "crypto_papers",
    title: "Off-Chain Cryptography: Paper Setter Pipeline",
    method: "AES-256-GCM + Shamir(3, 5)",
    category: "CRYPTOGRAPHIC_PIPELINE",
    badge: "Zero-Knowledge Preparation",
    badgeColor: "amber",
    isSpecialPhase: true,
    summary:
      "Paper Setter encrypts sets A, B, and C with unique random 256-bit AES keys. Each key is split into 5 Shamir shares (threshold k=3). Shares are securely distributed to the 5 staff custodians, and encrypted files are uploaded to IPFS.",
    securityNote:
      "CRITICAL: The Paper Setter immediately destroys the master decryption keys and original plaintext question files. No single entity on earth possesses the exam questions.",
    telemetry: {
      "Cipher Algorithm": "AES-256-GCM Authenticated",
      "Threshold Scheme": "3-of-5 Shamir Secret Shares",
      "Candidate Sets": "3 Independent Exam Papers (A, B, C)",
      "IPFS Storage": "Content-Addressed (3 CIDs Pinned)",
    },
    visualHighlight: "paper_crypto",
  },
  {
    block: 9,
    phase: "staking",
    title: "Block #9: Custodian #1 Collateral Staking",
    method: "vault.connect(S1).stake{value: 1.0 ETH}()",
    category: "ECONOMIC_SECURITY",
    badge: "1.0 ETH Staked",
    badgeColor: "mint",
    summary: "Staff Custodian #1 deposits 1.00 ETH test collateral into the contract escrow to back their commitment.",
    telemetry: {
      "Staker": "Staff Custodian #1",
      "Deposit Amount": "1.00 ETH",
      "Escrow Balance": "1.00 ETH",
      "Slashing Rule": "Automated smart contract forfeiture",
    },
    visualHighlight: "stake_1",
  },
  {
    block: 10,
    phase: "staking",
    title: "Block #10: Custodian #2 Collateral Staking",
    method: "vault.connect(S2).stake{value: 1.0 ETH}()",
    category: "ECONOMIC_SECURITY",
    badge: "1.0 ETH Staked",
    badgeColor: "mint",
    summary: "Staff Custodian #2 deposits 1.00 ETH test collateral into the contract escrow.",
    telemetry: {
      "Staker": "Staff Custodian #2",
      "Deposit Amount": "1.00 ETH",
      "Escrow Balance": "2.00 ETH",
      "Slashing Rule": "Automated smart contract forfeiture",
    },
    visualHighlight: "stake_2",
  },
  {
    block: 11,
    phase: "staking",
    title: "Block #11: Custodian #3 Collateral Staking",
    method: "vault.connect(S3).stake{value: 1.0 ETH}()",
    category: "ECONOMIC_SECURITY",
    badge: "1.0 ETH Staked",
    badgeColor: "mint",
    summary: "Staff Custodian #3 deposits 1.00 ETH test collateral into the contract escrow.",
    telemetry: {
      "Staker": "Staff Custodian #3",
      "Deposit Amount": "1.00 ETH",
      "Escrow Balance": "3.00 ETH",
      "Slashing Rule": "Automated smart contract forfeiture",
    },
    visualHighlight: "stake_3",
  },
  {
    block: 12,
    phase: "staking",
    title: "Block #12: Custodian #4 Collateral Staking",
    method: "vault.connect(S4).stake{value: 1.0 ETH}()",
    category: "ECONOMIC_SECURITY",
    badge: "1.0 ETH Staked",
    badgeColor: "mint",
    summary: "Staff Custodian #4 deposits 1.00 ETH test collateral into the contract escrow.",
    telemetry: {
      "Staker": "Staff Custodian #4",
      "Deposit Amount": "1.00 ETH",
      "Escrow Balance": "4.00 ETH",
      "Slashing Rule": "Automated smart contract forfeiture",
    },
    visualHighlight: "stake_4",
  },
  {
    block: 13,
    phase: "staking",
    title: "Block #13: Custodian #5 Collateral Staking",
    method: "vault.connect(S5).stake{value: 1.0 ETH}()",
    category: "ECONOMIC_SECURITY",
    badge: "5.0 ETH Total Staked",
    badgeColor: "mint",
    summary: "Staff Custodian #5 deposits 1.00 ETH. Total escrow reaches 5.00 ETH! Economic game theory guarantees honesty.",
    telemetry: {
      "Staker": "Staff Custodian #5",
      "Deposit Amount": "1.00 ETH",
      "Total Escrow Shield": "5.00 ETH Collateral Active ✓",
      "Collateral Health": "100% Fully Collateralized",
    },
    visualHighlight: "stake_5",
  },
  {
    block: 14,
    phase: "token_mint",
    title: "Block #14: ERC-5192 Soulbound Token Minting",
    method: "vault.mintAccessToken(Govt College)",
    category: "ACCESS_TOKEN",
    badge: "Soulbound Token #1",
    badgeColor: "mint",
    summary:
      "Admin mints non-transferable Soulbound Token #1 to Govt. College of Engineering. The college is now verified on-chain to download and decrypt the paper once 3-of-5 staff upload keys.",
    telemetry: {
      "Token Standard": "ERC-721 / ERC-5192 (Minimal Soulbound)",
      "Token ID": "#1",
      "Recipient Center": "Govt. College of Engineering",
      "Transferability": "Permanently Locked (Non-Transferable)",
      "Genesis Status": "✨ Block #14 Sealed & Ready!",
    },
    visualHighlight: "soulbound_mint",
  },
];

const BLOCK_TO_INDEX = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  8.5: 9,
  9: 10,
  10: 11,
  11: 12,
  12: 13,
  13: 14,
  14: 15,
};

export default function GenesisSetup({ vault, refresh }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x or 2x
  const [inspectedPaper, setInspectedPaper] = useState(null);

  // Real-Time EVM Deployment state
  const [deployMode, setDeployMode] = useState("realtime"); // "realtime" or "walkthrough"
  const [nodeStatus, setNodeStatus] = useState({ checking: true, connected: false });
  const [resetFirst, setResetFirst] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("");
  const [liveTelemetryMap, setLiveTelemetryMap] = useState({});
  const [liveLogs, setLiveLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [hasLive, setHasLive] = useState(hasLiveDeployment());

  const activeStep = LEDGER_STEPS[stepIndex];
  const isFinalStep = stepIndex === LEDGER_STEPS.length - 1;
  const terminalRef = useRef(null);

  // Check node status on mount & interval
  const checkNode = async () => {
    setNodeStatus((prev) => ({ ...prev, checking: true }));
    const res = await checkNodeStatus();
    setNodeStatus({ checking: false, ...res });
  };

  useEffect(() => {
    checkNode();
    const interval = setInterval(checkNode, 6000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll log terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [liveLogs]);

  // Auto-play interval for Walkthrough mode only
  useEffect(() => {
    if (deployMode !== "walkthrough" || !isPlaying || isDeploying) return;

    if (stepIndex < LEDGER_STEPS.length - 1) {
      const delay = (activeStep.isSpecialPhase ? 4200 : 2500) / speed;
      const t = setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(t);
    } else {
      setIsPlaying(false);
    }
  }, [deployMode, isPlaying, isDeploying, stepIndex, speed, activeStep]);

  // Launch Live In-Browser Genesis
  const handleLaunchLiveGenesis = async () => {
    if (isDeploying) return;
    setIsDeploying(true);
    setIsPlaying(false);
    setDeployError(null);
    setLiveLogs([]);
    setShowLogs(true);
    setCurrentStatus("Connecting to Ethereum node at http://127.0.0.1:8545...");

    try {
      await executeLiveGenesis({
        resetFirst,
        onStepStart: (blockNum, msg) => {
          setCurrentStatus(msg);
          const idx = BLOCK_TO_INDEX[blockNum];
          if (idx !== undefined) setStepIndex(idx);
        },
        onStepComplete: (blockNum, telemetryData) => {
          setLiveTelemetryMap((prev) => ({
            ...prev,
            [blockNum]: telemetryData,
          }));
          const idx = BLOCK_TO_INDEX[blockNum];
          if (idx !== undefined) setStepIndex(idx);
        },
        onLog: (msg) => {
          setLiveLogs((prev) => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`]);
        },
      });

      setCurrentStatus("✨ Genesis deployment verified on-chain at Block #14!");
      setHasLive(true);
      await checkNode();
      if (refresh) refresh();
    } catch (err) {
      console.error("Live Genesis execution failed:", err);
      setDeployError(err?.message || "Deployment failed. Ensure local Hardhat node is running.");
      setCurrentStatus("Deployment encountered an error.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClearLive = () => {
    clearLiveDeployment();
    setHasLive(false);
    setLiveTelemetryMap({});
    setStepIndex(0);
    setCurrentStatus("Reverted to bundled snapshot deployment.");
    if (refresh) refresh();
  };

  // Visual state calculations
  const displayBlockNum = activeStep.block === 8.5 ? "8+" : activeStep.block;
  const isVaultIgnited = activeStep.block >= 1;
  const activeStaffCount =
    activeStep.block >= 6 ? 5 :
    activeStep.block >= 5 ? 4 :
    activeStep.block >= 4 ? 3 :
    activeStep.block >= 3 ? 2 :
    activeStep.block >= 2 ? 1 : 0;

  const stakedStaffCount =
    activeStep.block >= 13 ? 5 :
    activeStep.block >= 12 ? 4 :
    activeStep.block >= 11 ? 3 :
    activeStep.block >= 10 ? 2 :
    activeStep.block >= 9 ? 1 : 0;

  const isPapersEncrypted = activeStep.block >= 8.5;
  const isSoulboundMinted = activeStep.block >= 14;

  // Real-time telemetry resolution
  const activeTelemetry = liveTelemetryMap[activeStep.block] || activeStep.telemetry;
  const hasLiveReceipt = !!liveTelemetryMap[activeStep.block];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* 1. TOP CONTROLLER & REAL-TIME DEPLOYMENT SUITE */}
      <div
        className="card"
        style={{
          marginBottom: "16px",
          background: "linear-gradient(180deg, var(--surface) 0%, rgba(18, 18, 22, 0.95) 100%)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header Row: Title, Mode Switcher, Node Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            paddingBottom: "14px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className={`dot ${nodeStatus.connected ? "dot-mint" : ""}`} />
              <span className="mono small" style={{ color: "var(--accent)", fontWeight: "600", letterSpacing: "0.08em" }}>
                GENESIS ON-CHAIN CONTROL CENTER
              </span>
            </div>
            <h1 className="h1" style={{ fontSize: "20px", margin: 0, fontWeight: "600" }}>
              {deployMode === "realtime" ? "Real-Time EVM Genesis Deployer" : "Genesis Audit Walkthrough & Telemetry"}
            </h1>
          </div>

          {/* Mode Selector & Node Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Mode Switcher Tabs */}
            <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "8px", padding: "3px", border: "1px solid var(--border)" }}>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setDeployMode("realtime");
                  setIsPlaying(false);
                }}
                style={{
                  background: deployMode === "realtime" ? "var(--accent)" : "transparent",
                  color: deployMode === "realtime" ? "#000" : "var(--text-muted)",
                  fontWeight: deployMode === "realtime" ? "700" : "500",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              >
                ⚡ Live EVM Deploy
              </button>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setDeployMode("walkthrough");
                  setIsPlaying(true);
                }}
                style={{
                  background: deployMode === "walkthrough" ? "var(--accent)" : "transparent",
                  color: deployMode === "walkthrough" ? "#000" : "var(--text-muted)",
                  fontWeight: deployMode === "walkthrough" ? "700" : "500",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              >
                🎬 Walkthrough Replay
              </button>
            </div>

            {/* Node Status Indicator Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: nodeStatus.connected ? "rgba(10, 186, 115, 0.12)" : "rgba(235, 87, 87, 0.12)",
                border: `1px solid ${nodeStatus.connected ? "rgba(10, 186, 115, 0.3)" : "rgba(235, 87, 87, 0.3)"}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: nodeStatus.connected ? "var(--mint)" : "var(--danger, #eb5757)",
                  boxShadow: nodeStatus.connected ? "0 0 8px var(--mint)" : "none",
                }}
              />
              <span className="mono" style={{ color: nodeStatus.connected ? "var(--mint)" : "var(--danger, #eb5757)", fontWeight: "600" }}>
                {nodeStatus.checking
                  ? "Checking Node..."
                  : nodeStatus.connected
                  ? `EVM Active (Block #${nodeStatus.blockNumber})`
                  : "Node Offline"}
              </span>
              <button
                onClick={checkNode}
                className="btn btn-ghost btn-sm"
                style={{ padding: "0 4px", minHeight: "auto", fontSize: "11px", opacity: 0.8 }}
                title="Refresh connection"
              >
                ↻
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Action Bar */}
        {deployMode === "realtime" ? (
          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              {/* Main Action Button */}
              <button
                className="btn btn-primary"
                onClick={handleLaunchLiveGenesis}
                disabled={isDeploying || !nodeStatus.connected}
                style={{
                  padding: "9px 20px",
                  fontSize: "14px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: isDeploying ? "0 0 16px var(--accent)" : "0 4px 14px rgba(0,255,163,0.2)",
                  opacity: nodeStatus.connected ? 1 : 0.6,
                }}
              >
                {isDeploying ? (
                  <>
                    <span className="dot dot-mint" />
                    <span>Mining Block #{displayBlockNum}...</span>
                  </>
                ) : hasLive ? (
                  <>
                    <span>🚀 Re-Deploy Genesis Live</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Launch Real-Time Genesis on EVM</span>
                  </>
                )}
              </button>

              {/* Reset to Block 0 Checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "var(--text)" }}>
                <input
                  type="checkbox"
                  checked={resetFirst}
                  onChange={(e) => setResetFirst(e.target.checked)}
                  disabled={isDeploying}
                  style={{ cursor: "pointer", accentColor: "var(--accent)" }}
                />
                <span>Reset EVM to Block #0 First (Clean Chain)</span>
              </label>

              {/* Logs Drawer Toggle */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowLogs(!showLogs)}
                style={{ fontSize: "12px" }}
              >
                {showLogs ? "Hide Terminal Log ▲" : `View Live Terminal (${liveLogs.length}) ▼`}
              </button>

              {hasLive && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleClearLive}
                  disabled={isDeploying}
                  style={{ fontSize: "11px", color: "var(--muted)" }}
                  title="Reverts to the deployment.json generated by demo setup"
                >
                  Revert to Demo Snapshot
                </button>
              )}
            </div>

            {/* Live Block Height Display */}
            <div
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "6px 14px",
                textAlign: "right",
                minWidth: "140px",
              }}
            >
              <div className="mono small muted" style={{ fontSize: "10px", letterSpacing: "0.08em" }}>
                ACTIVE STAGE
              </div>
              <div className="mono" style={{ fontSize: "18px", fontWeight: "700", color: "var(--accent)" }}>
                Block #{displayBlockNum} / 14
              </div>
            </div>
          </div>
        ) : (
          /* Walkthrough Video Player Controls */
          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (isFinalStep) {
                    setStepIndex(0);
                    setIsPlaying(true);
                  } else {
                    setIsPlaying(!isPlaying);
                  }
                }}
              >
                {isFinalStep ? "Restart Walkthrough" : isPlaying ? "Pause Video" : "Play Walkthrough"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSpeed(speed === 1 ? 2 : 1)}
                title="Toggle playback speed"
              >
                {speed}x Speed
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsPlaying(false);
                  setStepIndex(LEDGER_STEPS.length - 1);
                }}
                disabled={isFinalStep}
              >
                Skip to Block #14
              </button>
              <span className="mono small muted" style={{ marginLeft: "8px" }}>
                Auto-advancing through 14 pre-mined blocks
              </span>
            </div>

            <div
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "6px 14px",
                textAlign: "right",
              }}
            >
              <div className="mono small muted" style={{ fontSize: "10px" }}>PLAYBACK HEIGHT</div>
              <div className="mono" style={{ fontSize: "18px", fontWeight: "700", color: "var(--accent)" }}>
                Block #{displayBlockNum}
              </div>
            </div>
          </div>
        )}

        {/* Live Progress Bar & Status Text */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
            <span className="mono muted">
              {currentStatus || (nodeStatus.connected ? "Ready to deploy or inspect 14 on-chain blocks." : "Waiting for local Hardhat node (run `npm run node`).")}
            </span>
            <span className="mono" style={{ color: "var(--accent)", fontWeight: "600" }}>
              {Math.round(((stepIndex + 1) / LEDGER_STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div style={{ height: "4px", background: "var(--surface-3)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${((stepIndex + 1) / LEDGER_STEPS.length) * 100}%`,
                background: isDeploying ? "linear-gradient(90deg, var(--accent), var(--mint))" : "var(--accent)",
                transition: "width 250ms ease",
              }}
            />
          </div>
        </div>

        {/* Error Alert if node is down or tx fails */}
        {deployError && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              background: "rgba(235, 87, 87, 0.15)",
              border: "1px solid rgba(235, 87, 87, 0.4)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#ff8585",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>⚠️ {deployError}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setDeployError(null)} style={{ padding: "0 6px" }}>
              ✕
            </button>
          </div>
        )}

        {/* Real-time Streaming Terminal Log Console */}
        {showLogs && (
          <div
            ref={terminalRef}
            style={{
              marginTop: "14px",
              background: "#080c10",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "12px",
              maxHeight: "180px",
              overflowY: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--mint)",
              lineHeight: "1.6",
            }}
          >
            <div style={{ color: "var(--muted)", marginBottom: "6px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "4px" }}>
              [HARDHAT EVM RPC STREAM: http://127.0.0.1:8545]
            </div>
            {liveLogs.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>Click "Launch Real-Time Genesis on EVM" to start on-chain execution stream...</div>
            ) : (
              liveLogs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        )}
      </div>

      {/* 2. THE MAIN STAGE: ON-CHAIN TOPOLOGY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "16px",
          alignItems: "stretch",
          marginBottom: "20px",
        }}
      >
        {/* LEFT COLUMN: INTERACTIVE VISUAL CANVAS */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-card)",
            padding: "20px",
            position: "relative",
            overflow: "hidden",
            minHeight: "460px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Central Reactor Visual (SVG) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              margin: "20px 0",
            }}
          >
            <svg
              viewBox="0 0 540 380"
              style={{ width: "100%", maxHeight: "360px", overflow: "visible" }}
            >
              <defs>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Energy Rays from Staff Custodians to Vault */}
              {[
                { x: 92, y: 108 },
                { x: 172, y: 78 },
                { x: 270, y: 64 },
                { x: 368, y: 78 },
                { x: 448, y: 108 },
              ].map((pos, idx) => {
                const isActive = activeStaffCount > idx;
                const isStaked = stakedStaffCount > idx;
                return (
                  <line
                    key={idx}
                    x1={pos.x}
                    y1={pos.y}
                    x2="270"
                    y2="205"
                    stroke={
                      isStaked
                        ? "var(--mint)"
                        : isActive
                        ? "var(--accent)"
                        : "var(--border)"
                    }
                    strokeWidth={isStaked ? "2.5" : isActive ? "1.5" : "1"}
                    strokeDasharray={isStaked ? "none" : isActive ? "4,4" : "2,6"}
                    opacity={isActive ? 0.9 : 0.25}
                  />
                );
              })}

              {/* College Access Link */}
              <line
                x1="105"
                y1="315"
                x2="270"
                y2="205"
                stroke={isSoulboundMinted ? "#F5B94A" : "var(--border)"}
                strokeWidth={isSoulboundMinted ? "2.5" : "1"}
                strokeDasharray={isSoulboundMinted ? "none" : "3,5"}
                opacity={isSoulboundMinted ? 0.9 : 0.25}
              />

              {/* IPFS Data Pipeline */}
              <line
                x1="435"
                y1="315"
                x2="270"
                y2="205"
                stroke={isPapersEncrypted ? "var(--mint)" : "var(--border)"}
                strokeWidth={isPapersEncrypted ? "2.5" : "1"}
                strokeDasharray={isPapersEncrypted ? "none" : "3,5"}
                opacity={isPapersEncrypted ? 0.9 : 0.25}
              />

              {/* ================= CENTRAL REACTOR: EXAMVAULT ================= */}
              <g transform="translate(270, 205)">
                <circle
                  r="56"
                  fill={isVaultIgnited ? "rgba(24, 20, 16, 0.95)" : "var(--surface-2)"}
                  stroke={isVaultIgnited ? "var(--accent)" : "var(--border)"}
                  strokeWidth={isVaultIgnited ? 3 : 1}
                  filter={isVaultIgnited ? "url(#neonGlow)" : "none"}
                />
                <circle
                  r="46"
                  fill="transparent"
                  stroke={isVaultIgnited ? "rgba(194, 128, 62, 0.55)" : "var(--border)"}
                  strokeWidth="1.5"
                  strokeDasharray="5,4"
                />
                <text textAnchor="middle" dy="-14" fill={isVaultIgnited ? "var(--accent)" : "var(--muted)"} fontSize="19">
                  🏛️
                </text>
                <text
                  textAnchor="middle"
                  dy="4"
                  fill={isVaultIgnited ? "var(--text)" : "var(--muted)"}
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  fontWeight="800"
                  letterSpacing="0.05em"
                >
                  EXAMVAULT
                </text>
                <rect
                  x="-36"
                  y="10"
                  width="72"
                  height="16"
                  rx="8"
                  fill={isVaultIgnited ? "rgba(32, 22, 14, 0.92)" : "rgba(24, 24, 28, 0.85)"}
                  stroke={isVaultIgnited ? "var(--mint-border)" : "var(--border)"}
                  strokeWidth="1"
                />
                <text
                  textAnchor="middle"
                  dy="21.5"
                  fill={isVaultIgnited ? "var(--mint)" : "var(--muted)"}
                  fontFamily="var(--font-mono)"
                  fontSize="8"
                  fontWeight="700"
                >
                  {isVaultIgnited ? (stakedStaffCount === 5 ? "5.0 ETH Escrow" : "Active Contract") : "Not Deployed"}
                </text>
              </g>

              {/* ================= 5 STAFF CUSTODIAN NODES ================= */}
              {[
                { x: 92, y: 108, label: "Staff 1" },
                { x: 172, y: 78, label: "Staff 2" },
                { x: 270, y: 64, label: "Staff 3" },
                { x: 368, y: 78, label: "Staff 4" },
                { x: 448, y: 108, label: "Staff 5" },
              ].map((pos, idx) => {
                const isRegistered = activeStaffCount > idx;
                const isStaked = stakedStaffCount > idx;
                return (
                  <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
                    {/* Floating Info Chip (Above Node) */}
                    <g transform="translate(0, -36)">
                      <rect
                        x="-33"
                        y="-14"
                        width="66"
                        height="26"
                        rx="6"
                        fill="rgba(18, 18, 22, 0.95)"
                        stroke={isStaked ? "rgba(194, 128, 62, 0.45)" : "rgba(255, 255, 255, 0.1)"}
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        y="-1"
                        fill={isRegistered ? "var(--text)" : "var(--muted)"}
                        fontFamily="var(--font-mono)"
                        fontSize="10"
                        fontWeight="700"
                      >
                        {pos.label}
                      </text>
                      <text
                        textAnchor="middle"
                        y="8.5"
                        fill={isStaked ? "var(--mint)" : isRegistered ? "var(--amber)" : "var(--muted)"}
                        fontFamily="var(--font-mono)"
                        fontSize="8.5"
                        fontWeight="600"
                      >
                        {isStaked ? "1.0 ETH ✓" : isRegistered ? "Ready" : "Empty"}
                      </text>
                    </g>

                    {/* Node Orb */}
                    <circle
                      r="22"
                      fill={isStaked ? "#22170f" : isRegistered ? "rgba(194, 128, 62, 0.15)" : "var(--surface-2)"}
                      stroke={isStaked ? "var(--mint)" : isRegistered ? "var(--accent)" : "var(--border)"}
                      strokeWidth={isStaked ? 2.5 : isRegistered ? 1.5 : 1}
                      filter={isStaked ? "url(#neonGlow)" : "none"}
                    />
                    <text textAnchor="middle" dy="5" fill={isRegistered ? "var(--text)" : "var(--muted)"} fontSize="13">
                      {isStaked ? "🔒" : isRegistered ? "🔑" : "⚪"}
                    </text>
                  </g>
                );
              })}

              {/* ================= COLLEGE ACCESS NODE ================= */}
              <g transform="translate(105, 315)">
                <circle
                  r="28"
                  fill={isSoulboundMinted ? "#241c0e" : "#121a22"}
                  stroke={isSoulboundMinted ? "#F5B94A" : "var(--border)"}
                  strokeWidth={isSoulboundMinted ? 2.5 : 1}
                  filter={isSoulboundMinted ? "url(#neonGlow)" : "none"}
                />
                <text textAnchor="middle" dy="-5" fill={isSoulboundMinted ? "#F5B94A" : "var(--muted)"} fontSize="14">
                  🏫
                </text>
                <text
                  textAnchor="middle"
                  dy="11"
                  fill={isSoulboundMinted ? "#F5B94A" : "var(--muted)"}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  fontWeight="800"
                >
                  {isSoulboundMinted ? "TOKEN #1" : "COLLEGE"}
                </text>
                <g transform="translate(0, 42)">
                  <rect
                    x="-44"
                    y="-10"
                    width="88"
                    height="20"
                    rx="6"
                    fill="rgba(18, 18, 22, 0.95)"
                    stroke={isSoulboundMinted ? "rgba(245, 185, 74, 0.4)" : "rgba(255, 255, 255, 0.1)"}
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    y="3.5"
                    fill={isSoulboundMinted ? "var(--text)" : "var(--muted)"}
                    fontSize="9.5"
                    fontFamily="var(--font-mono)"
                    fontWeight="600"
                  >
                    Govt. College
                  </text>
                </g>
              </g>

              {/* ================= IPFS STORAGE CONSTELLATION ================= */}
              <g transform="translate(435, 315)">
                <circle
                  r="28"
                  fill={isPapersEncrypted ? "#0e1f33" : "#0f1624"}
                  stroke={isPapersEncrypted ? "var(--mint)" : "var(--border)"}
                  strokeWidth={isPapersEncrypted ? 2 : 1}
                />
                <text textAnchor="middle" dy="-5" fill={isPapersEncrypted ? "var(--mint)" : "var(--muted)"} fontSize="14">
                  🌐
                </text>
                <text
                  textAnchor="middle"
                  dy="11"
                  fill={isPapersEncrypted ? "var(--mint)" : "var(--muted)"}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  fontWeight="800"
                >
                  IPFS CID
                </text>
                <g transform="translate(0, 42)">
                  <rect
                    x="-46"
                    y="-10"
                    width="92"
                    height="20"
                    rx="6"
                    fill="rgba(18, 18, 22, 0.95)"
                    stroke={isPapersEncrypted ? "rgba(194, 128, 62, 0.4)" : "rgba(255, 255, 255, 0.1)"}
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    y="3.5"
                    fill={isPapersEncrypted ? "var(--text)" : "var(--muted)"}
                    fontSize="9.5"
                    fontFamily="var(--font-mono)"
                    fontWeight="600"
                  >
                    Papers A, B, C
                  </text>
                </g>
              </g>
            </svg>
          </div>

          {/* Interactive Legend / Status Callout */}
          <div
            style={{
              background: "rgba(18, 18, 22, 0.85)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
              fontSize: "12px",
              zIndex: 2,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ color: isVaultIgnited ? "var(--mint)" : "var(--muted)" }}>
                ● Vault: {isVaultIgnited ? "Active" : "Offline"}
              </span>
              <span style={{ color: activeStaffCount === 5 ? "var(--mint)" : "var(--muted)" }}>
                ● Custodians: {activeStaffCount}/5
              </span>
              <span style={{ color: stakedStaffCount === 5 ? "var(--mint)" : "var(--muted)" }}>
                ● Collateral: {stakedStaffCount}.0 ETH
              </span>
              <span style={{ color: isSoulboundMinted ? "#F5B94A" : "var(--muted)" }}>
                ● Soulbound Token: {isSoulboundMinted ? "Minted (#1)" : "Pending"}
              </span>
            </div>
            <span className="mono small mint-text" style={{ fontWeight: "600" }}>
              {activeStep.category}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: ON-CHAIN TELEMETRY INSPECTOR */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            {/* Step Category & Live Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span className="eyebrow" style={{ color: "var(--accent)" }}>
                ON-CHAIN TELEMETRY · {activeStep.category}
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                {hasLiveReceipt && (
                  <span className="pill pill-mint mono small" style={{ fontWeight: "700" }}>
                    Live EVM Receipt ✓
                  </span>
                )}
                <span className={`pill pill-${activeStep.badgeColor} mono small`}>
                  {activeStep.badge}
                </span>
              </div>
            </div>

            {/* Title & Solidity Method */}
            <h2 style={{ fontSize: "20px", margin: "0 0 6px", fontWeight: "700" }}>
              {activeStep.title}
            </h2>
            <div
              className="mono"
              style={{
                background: "var(--surface-2)",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                color: "var(--mint)",
                marginBottom: "14px",
                display: "inline-block",
                border: "1px solid var(--border)",
              }}
            >
              {activeStep.method}
            </div>

            {/* Plain English Summary */}
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text)", margin: "0 0 16px" }}>
              {activeStep.summary}
            </p>

            {/* Security Highlight Box (Special for Paper Setter Stage) */}
            {activeStep.securityNote && (
              <div
                style={{
                  background: "var(--amber-tint)",
                  border: "1px solid var(--amber-border)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "var(--text)",
                }}
              >
                <div style={{ color: "var(--amber)", fontWeight: "700", marginBottom: "4px" }}>
                  🛡️ Zero-Knowledge Custodian Protocol
                </div>
                {activeStep.securityNote}
              </div>
            )}

            {/* Telemetry Key-Value Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
              {Object.entries(activeTelemetry).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    background: "var(--surface-2)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span className="mono muted">{key}</span>
                  <span className="mono" style={{ fontWeight: "600", color: "var(--text)" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Quick Action for Paper Setter (Inspect Plaintext Exam Questions) */}
          {activeStep.isSpecialPhase && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {CANDIDATE_PAPERS.map((p) => (
                  <button
                    key={p.id}
                    className="btn btn-ghost btn-sm"
                    onClick={() => setInspectedPaper(inspectedPaper?.id === p.id ? null : p)}
                    style={{
                      borderColor: inspectedPaper?.id === p.id ? "var(--mint)" : "var(--border)",
                      color: inspectedPaper?.id === p.id ? "var(--mint)" : "var(--text)",
                      fontSize: "11px",
                    }}
                  >
                    Set {p.id} Preview
                  </button>
                ))}
              </div>

              {inspectedPaper && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    background: "var(--surface-3)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    lineHeight: "1.5",
                  }}
                >
                  <div style={{ fontWeight: "700", color: "var(--mint)", marginBottom: "4px" }}>
                    {inspectedPaper.setName} — Questions:
                  </div>
                  {inspectedPaper.questions.slice(0, 3).map((q) => (
                    <div key={q.no} style={{ margin: "4px 0", color: "var(--text)" }}>
                      <b>{q.no}</b>: {q.text.slice(0, 95)}…
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
              paddingTop: "14px",
              borderTop: "1px solid var(--divider)",
            }}
          >
            <button
              className="btn btn-ghost btn-sm"
              disabled={stepIndex === 0}
              onClick={() => {
                setIsPlaying(false);
                setStepIndex((p) => Math.max(0, p - 1));
              }}
            >
              ◀ Previous
            </button>

            <span className="mono small muted">
              Step {stepIndex + 1} of {LEDGER_STEPS.length}
            </span>

            <button
              className="btn btn-ghost btn-sm"
              disabled={isFinalStep}
              onClick={() => {
                setIsPlaying(false);
                setStepIndex((p) => Math.min(LEDGER_STEPS.length - 1, p + 1));
              }}
            >
              Next Step ▶
            </button>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE 14-BLOCK LEDGER CONDUIT SCRUBBER */}
      <section className="card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h3 style={{ fontSize: "15px", margin: 0, fontWeight: "700" }}>
              Sequential Block Ledger Strip (Click any block to inspect state)
            </h3>
          </div>
          <span className="mono small muted">14 Consecutive On-Chain Blocks</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(68px, 1fr))",
            gap: "6px",
          }}
        >
          {LEDGER_STEPS.map((s, idx) => {
            const isCurrent = idx === stepIndex;
            const isPassed = idx < stepIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  setIsPlaying(false);
                  setStepIndex(idx);
                }}
                style={{
                  background: isCurrent ? "var(--accent-tint)" : isPassed ? "var(--surface-3)" : "var(--surface-2)",
                  border: isCurrent
                    ? "1px solid var(--accent)"
                    : isPassed
                    ? "1px solid var(--border-strong)"
                    : "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "6px 4px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "background-color 150ms ease, border-color 150ms ease",
                  color: isCurrent ? "var(--accent)" : isPassed ? "var(--text)" : "var(--text-muted)",
                }}
              >
                <div className="mono" style={{ fontSize: "11px", fontWeight: "700" }}>
                  {s.block === 8.5 ? "IPFS" : `#${s.block}`}
                </div>
                <div style={{ fontSize: "10px", marginTop: "2px", opacity: 0.8 }}>
                  {s.block === 0 ? "Genesis" : s.block === 1 ? "Deploy" : s.block <= 6 ? "Staff" : s.block <= 8 ? "Center" : s.block === 8.5 ? "Papers" : s.block <= 13 ? "Stake" : "Token"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. FINAL COMPLETION BANNER (Appears when Block 14 is reached) */}
      {isFinalStep && (
        <div
          className="card"
          style={{
            marginTop: "16px",
            border: "1px solid var(--accent-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="pill pill-mint mono small">Genesis Verified</span>
              <span className="mono small muted">Height: Block #14 Confirmed</span>
            </div>
            <h2 style={{ fontSize: "18px", margin: "0 0 4px", fontWeight: "600" }}>
              Vault Initialization Complete at Block #14
            </h2>
            <p className="muted small" style={{ margin: 0, maxWidth: "680px" }}>
              Contracts deployed, 5 staff registered, 3 candidate papers encrypted on IPFS, 5.00 ETH collateral locked, and Soulbound Token #1 minted to Govt. College. Ready to launch the examination countdown.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <a href="#/admin" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>
              Enter Central Admin Portal
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
