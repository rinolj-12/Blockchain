import { useState, useEffect, useRef } from "react";
import { deployment, ipfsGateway } from "../lib/deployment.js";
import { CANDIDATE_PAPERS } from "../lib/papersData.js";
import { shortAddr } from "../lib/format.js";

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
    summary: "Central Admin enrolls Staff Custodian #1 (0x7099...) into the authorized threshold decryption ring.",
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
    summary: "Central Admin enrolls Staff Custodian #2 (0x3C44...) into the authorized threshold decryption ring.",
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
    summary: "Central Admin enrolls Staff Custodian #3 (0x90F7...) into the authorized threshold decryption ring.",
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
    summary: "Central Admin enrolls Staff Custodian #4 (0x15d3...) into the authorized threshold decryption ring.",
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
    badge: "Staff Onboarding",
    badgeColor: "mint",
    summary: "Central Admin enrolls Staff Custodian #5 (0x9965...). All 5 custodian seats are now officially filled on Ethereum.",
    telemetry: {
      "Custodian Index": "Staff #5 of 5",
      "Wallet Address": shortAddr(deployment?.accounts?.staff?.[4] || "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"),
      "Quorum Ring": "5 of 5 Seats Filled (3 Required to Unlock)",
      "On-Chain Status": "Registered ✓",
    },
    visualHighlight: "staff_5",
  },
  {
    block: 7,
    phase: "college_reg",
    title: "Block #7: Exam Center Accreditation",
    method: "vault.registerCollege(Govt College)",
    category: "EXAM_CENTER",
    badge: "Center Accredited",
    badgeColor: "mint",
    summary: "Admin authorizes Govt. College of Engineering as a legitimate examination venue eligible to receive invigilator access.",
    telemetry: {
      "College Name": "Govt. College of Engineering",
      "Wallet Address": shortAddr(deployment?.accounts?.colleges?.[0]?.address || "0x976EA74026E726554dB657fA54763abd0C3a0aa9"),
      "Accreditation": "Authorized Exam Center #1",
      "On-Chain Status": "Registered ✓",
    },
    visualHighlight: "college_1",
  },
  {
    block: 8,
    phase: "college_reg",
    title: "Block #8: Secondary College Registration",
    method: "vault.registerCollege(City Arts College)",
    category: "EXAM_CENTER",
    badge: "Center Registered",
    badgeColor: "muted",
    summary: "Admin registers City Arts College without access tokens, demonstrating that unregistered/tokenless institutions are denied access.",
    telemetry: {
      "College Name": "City Arts College",
      "Wallet Address": shortAddr(deployment?.accounts?.colleges?.[1]?.address || "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"),
      "Access Token": "None (Demonstrates Access Control)",
      "On-Chain Status": "Registered ✓",
    },
    visualHighlight: "college_2",
  },
  {
    block: 8.5,
    isSpecialPhase: true,
    phase: "paper_setter",
    title: "Special Stage: Paper Setter Cryptographic Pipeline",
    method: "AES256_GCM + IPFS_Pin + Shamir_Split(k=3, n=5)",
    category: "CRYPTOGRAPHY & IPFS",
    badge: "Paper Setter & IPFS",
    badgeColor: "amber",
    summary:
      "The University Paper Setter encrypts Papers A, B, and C with AES-256-GCM. Ciphertext blobs are pinned to IPFS, and the AES key is mathematically split into 5 Shamir shares (staff-1.json to staff-5.json). Plaintext is deleted.",
    securityNote:
      "CRITICAL SECURITY PROOF: Staff custodians ONLY hold mathematical Shamir key fragments. Staff NEVER have access to the question paper, preventing any insider leaks!",
    telemetry: {
      "Candidate Papers": "3 Sets (A: Algorithmic Foundations, B: Trees & Sorting, C: DP & Tries)",
      "Encryption": "AES-256-GCM (Authenticated 256-bit Cipher)",
      "Storage": "IPFS Decentralized Content-Addressed CIDv1",
      "Shamir Threshold": "3-of-5 Split (Distributed to S1–S5)",
    },
    visualHighlight: "paper_split",
  },
  {
    block: 9,
    phase: "staking",
    title: "Block #9: Custodian #1 Collateral Staking",
    method: "vault.connect(S1).stake{value: 1.0 ETH}()",
    category: "ECONOMIC_SECURITY",
    badge: "1.0 ETH Staked",
    badgeColor: "mint",
    summary: "Staff Custodian #1 deposits 1.00 ETH test collateral into the contract escrow. Slashing penalty enforces timely reveal.",
    telemetry: {
      "Staker": "Staff Custodian #1",
      "Deposit Amount": "1.00 ETH",
      "Escrow Balance": "1.00 ETH",
      "Slashing Rule": "Forfeited if offline or submitting false seeds",
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

export default function GenesisSetup({ vault, refresh }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1); // 1x or 2x
  const [inspectedPaper, setInspectedPaper] = useState(null);
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(null);

  const activeStep = LEDGER_STEPS[stepIndex];
  const isFinalStep = stepIndex === LEDGER_STEPS.length - 1;

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;

    if (stepIndex < LEDGER_STEPS.length - 1) {
      const delay = (activeStep.isSpecialPhase ? 4200 : 2500) / speed;
      const t = setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(t);
    } else {
      setIsPlaying(false);
    }
  }, [isPlaying, stepIndex, speed, activeStep]);

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

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Genesis Audit Control Bar */}
      <div
        className="card"
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="dot" />
            <span className="mono small" style={{ color: "var(--accent)", fontWeight: "600", letterSpacing: "0.08em" }}>
              GENESIS LEDGER AUDIT
            </span>
          </div>
          <h1 className="h1" style={{ fontSize: "20px", margin: 0, fontWeight: "600" }}>
            Genesis Blockchain Walkthrough & Telemetry
          </h1>
        </div>

        {/* Live Block Height Digits & Scrubber */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "6px 14px",
              textAlign: "center",
              minWidth: "120px",
            }}
          >
            <div className="mono small muted" style={{ fontSize: "10px", letterSpacing: "0.08em" }}>
              LEDGER HEIGHT
            </div>
            <div
              className="mono"
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "var(--accent)",
              }}
            >
              Block #{displayBlockNum}
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
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
              {isFinalStep ? "Restart" : isPlaying ? "Pause" : "Play"}
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
            <a href="#/admin" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
              Enter Admin
            </a>
          </div>
        </div>
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
            {/* SVG Interactive Topology Diagram */}
            <svg
              viewBox="0 0 540 380"
              style={{ width: "100%", maxHeight: "360px", overflow: "visible" }}
            >
              <defs>
                {/* Glowing Laser Filter */}
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Staking Laser Gradient */}
                <linearGradient id="laserBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0B132B" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Laser Staking Conduits from 5 Custodians to Center Core */}
              {[
                { x: 90, y: 80, idx: 1 },
                { x: 190, y: 40, idx: 2 },
                { x: 350, y: 40, idx: 3 },
                { x: 450, y: 80, idx: 4 },
                { x: 480, y: 200, idx: 5 },
              ].map((pos) => {
                const isStaked = stakedStaffCount >= pos.idx;
                const isRegistered = activeStaffCount >= pos.idx;
                return (
                  <g key={pos.idx}>
                    {/* Connection Conduit Line */}
                    <line
                      x1={pos.x}
                      y1={pos.y}
                      x2={270}
                      y2={220}
                      stroke={isStaked ? "var(--mint)" : isRegistered ? "var(--border)" : "#1a2530"}
                      strokeWidth={isStaked ? 2.5 : 1}
                      strokeDasharray={isStaked ? "none" : "4 4"}
                      filter={isStaked ? "url(#neonGlow)" : "none"}
                      opacity={isRegistered ? 0.9 : 0.25}
                    />

                    {/* Animated Energy Packet on Staking */}
                    {isStaked && (
                      <circle cx={(pos.x + 270) / 2} cy={(pos.y + 220) / 2} r="3" fill="#60A5FA">
                        <animate
                          attributeName="r"
                          values="2;4;2"
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Conduit to College Node (Bottom-Left) */}
              <line
                x1={100}
                y1={310}
                x2={270}
                y2={220}
                stroke={isSoulboundMinted ? "#F5B94A" : "var(--border)"}
                strokeWidth={isSoulboundMinted ? 2.5 : 1}
                strokeDasharray={isSoulboundMinted ? "none" : "4 4"}
                filter={isSoulboundMinted ? "url(#neonGlow)" : "none"}
              />

              {/* Conduit to IPFS Storage (Bottom-Right) */}
              <line
                x1={440}
                y1={310}
                x2={270}
                y2={220}
                stroke={isPapersEncrypted ? "var(--mint)" : "var(--border)"}
                strokeWidth={isPapersEncrypted ? 2 : 1}
                strokeDasharray={isPapersEncrypted ? "none" : "4 4"}
              />

              {/* ================= CENTRAL VAULT CORE ================= */}
              <g transform="translate(270, 220)">
                {/* Outer Rotating Radar Ring */}
                <circle
                  r="78"
                  fill="none"
                  stroke={isVaultIgnited ? "rgba(59, 130, 246, 0.35)" : "rgba(255,255,255,0.05)"}
                  strokeWidth="1.5"
                  strokeDasharray="14 10"
                >
                  {isVaultIgnited && (
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0"
                      to="360"
                      dur="14s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>

                {/* Inner Concentric Teeth Ring */}
                <circle
                  r="62"
                  fill="none"
                  stroke={isVaultIgnited ? "rgba(59, 130, 246, 0.6)" : "rgba(255,255,255,0.1)"}
                  strokeWidth="2"
                  strokeDasharray="6 6"
                >
                  {isVaultIgnited && (
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="360"
                      to="0"
                      dur="9s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>

                {/* Vault Shield Core Disc */}
                <circle
                  r="48"
                  fill={isVaultIgnited ? "#0f1c36" : "#121a22"}
                  stroke={isVaultIgnited ? "var(--mint)" : "var(--border)"}
                  strokeWidth="2.5"
                  filter={isVaultIgnited ? "url(#neonGlow)" : "none"}
                />

                {/* Core Vault Hologram Graphic */}
                <text
                  textAnchor="middle"
                  dy="-8"
                  fill={isVaultIgnited ? "var(--mint)" : "var(--muted)"}
                  fontFamily="var(--font-mono)"
                  fontSize="12"
                  fontWeight="700"
                >
                  EXAMVAULT
                </text>
                <text
                  textAnchor="middle"
                  dy="8"
                  fill={isVaultIgnited ? "#e8eef3" : "var(--muted)"}
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  fontWeight="600"
                >
                  {stakedStaffCount > 0 ? `${stakedStaffCount}.0 ETH` : isVaultIgnited ? "ACTIVE" : "OFFLINE"}
                </text>
                <text
                  textAnchor="middle"
                  dy="22"
                  fill="var(--mint)"
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                >
                  {isSoulboundMinted ? "SEALED ✓" : isVaultIgnited ? "DEPLOYED" : "AWAITING"}
                </text>
              </g>

              {/* ================= 5 CUSTODIAN ORBS ================= */}
              {[
                { x: 90, y: 80, label: "S1", name: "Custodian #1", idx: 1 },
                { x: 190, y: 40, label: "S2", name: "Custodian #2", idx: 2 },
                { x: 350, y: 40, label: "S3", name: "Custodian #3", idx: 3 },
                { x: 450, y: 80, label: "S4", name: "Custodian #4", idx: 4 },
                { x: 480, y: 200, label: "S5", name: "Custodian #5", idx: 5 },
              ].map((pos) => {
                const isRegistered = activeStaffCount >= pos.idx;
                const isStaked = stakedStaffCount >= pos.idx;
                return (
                  <g key={pos.idx} transform={`translate(${pos.x}, ${pos.y})`}>
                    {/* Outer Ring */}
                    <circle
                      r="22"
                      fill={isStaked ? "#10233d" : isRegistered ? "#131f33" : "#0d1318"}
                      stroke={isStaked ? "var(--mint)" : isRegistered ? "var(--mint-border)" : "var(--border)"}
                      strokeWidth={isStaked ? 2 : 1}
                      filter={isStaked ? "url(#neonGlow)" : "none"}
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill={isRegistered ? "var(--mint)" : "var(--muted)"}
                      fontFamily="var(--font-mono)"
                      fontSize="11"
                      fontWeight="700"
                    >
                      {pos.label}
                    </text>
                    <text
                      textAnchor="middle"
                      dy="32"
                      fill="var(--muted)"
                      fontFamily="var(--font-mono)"
                      fontSize="9"
                    >
                      {isStaked ? "1.0 ETH ✓" : isRegistered ? "Ready" : "Empty"}
                    </text>
                  </g>
                );
              })}

              {/* ================= COLLEGE ACCESS NODE ================= */}
              <g transform="translate(100, 310)">
                <circle
                  r="28"
                  fill={isSoulboundMinted ? "#2a2110" : "#121a22"}
                  stroke={isSoulboundMinted ? "#F5B94A" : "var(--border)"}
                  strokeWidth={isSoulboundMinted ? 2.5 : 1}
                  filter={isSoulboundMinted ? "url(#neonGlow)" : "none"}
                />
                <text textAnchor="middle" dy="-4" fill={isSoulboundMinted ? "#F5B94A" : "var(--muted)"} fontSize="14">
                  🏫
                </text>
                <text
                  textAnchor="middle"
                  dy="10"
                  fill={isSoulboundMinted ? "#F5B94A" : "var(--muted)"}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  fontWeight="700"
                >
                  {isSoulboundMinted ? "TOKEN #1" : "COLLEGE"}
                </text>
                <text textAnchor="middle" dy="38" fill="var(--muted)" fontSize="9" fontFamily="var(--font-mono)">
                  Govt. College
                </text>
              </g>

              {/* ================= IPFS STORAGE CONSTELLATION ================= */}
              <g transform="translate(440, 310)">
                <circle
                  r="28"
                  fill={isPapersEncrypted ? "#10233d" : "#0f1624"}
                  stroke={isPapersEncrypted ? "var(--mint)" : "var(--border)"}
                  strokeWidth={isPapersEncrypted ? 2 : 1}
                />
                <text textAnchor="middle" dy="-4" fill={isPapersEncrypted ? "var(--mint)" : "var(--muted)"} fontSize="14">
                  🌐
                </text>
                <text
                  textAnchor="middle"
                  dy="10"
                  fill={isPapersEncrypted ? "var(--mint)" : "var(--muted)"}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  fontWeight="700"
                >
                  IPFS CID
                </text>
                <text textAnchor="middle" dy="38" fill="var(--muted)" fontSize="9" fontFamily="var(--font-mono)">
                  Papers A, B, C
                </text>
              </g>
            </svg>
          </div>

          {/* Interactive Legend / Status Callout */}
          <div
            style={{
              background: "rgba(10, 18, 24, 0.85)",
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

        {/* Right Column: On-Chain Telemetry */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            {/* Step Category & Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span className="eyebrow" style={{ color: "var(--accent)" }}>
                ON-CHAIN TELEMETRY · {activeStep.category}
              </span>
              <span className={`pill pill-${activeStep.badgeColor} mono small`}>
                {activeStep.badge}
              </span>
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
              {Object.entries(activeStep.telemetry).map(([key, val]) => (
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
                    className={`btn ${inspectedPaper?.id === p.id ? "btn-primary" : "btn-ghost"} btn-sm`}
                    style={{ flex: 1, fontSize: "11px" }}
                    onClick={() => setInspectedPaper(inspectedPaper?.id === p.id ? null : p)}
                  >
                    Set {p.id} {inspectedPaper?.id === p.id ? "▲" : "▼"}
                  </button>
                ))}
              </div>

              {inspectedPaper && (
                <div
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--mint-border)",
                    borderRadius: "10px",
                    padding: "12px",
                    marginTop: "10px",
                    fontSize: "12px",
                    animation: "fadeIn 0.25s ease",
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
