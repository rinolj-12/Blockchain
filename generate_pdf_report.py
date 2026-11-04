#!/usr/bin/env python3
"""
Generates the comprehensive PDF demonstration report for Blockchain Exam Vault
with real, 100% full-height un-cropped frontend UI screenshots embedded via Base64.
"""

import os
import base64
import subprocess

def get_b64(filename):
    path = os.path.join("docs", "screenshots", filename)
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def build_html():
    img_admin_locked = get_b64("01_admin_locked_countdown.png")
    img_staff_locked = get_b64("02_staff_locked.png")
    img_college_locked = get_b64("03_college_locked.png")
    img_admin_unlocked = get_b64("04_admin_unlocked.png")
    img_college_unlocked = get_b64("05_college_unlocked.png")
    img_staff1_confirmed = get_b64("06_staff1_confirmed.png")
    img_staff4_slashed = get_b64("07_staff4_slashed.png")
    img_genesis = get_b64("08_genesis_setup.png")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Blockchain Exam Vault — Complete Frontend UI Operational Demonstration</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 6mm 8mm 6mm 8mm;
  }}

  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    line-height: 1.35;
    font-size: 8pt;
    margin: 0;
    padding: 0;
  }}

  .page {{
    page-break-after: always;
    height: 284mm;
    max-height: 284mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0;
  }}

  .page:last-child {{
    page-break-after: avoid;
  }}

  /* Header banner */
  .header-bar {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 3px;
    margin-bottom: 5px;
    flex-shrink: 0;
  }}
  .header-brand {{
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9pt;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.2px;
  }}
  .header-meta {{
    font-size: 7.5pt;
    color: #64748b;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }}

  /* Footer */
  .footer-bar {{
    padding-top: 3px;
    border-top: 1px solid #cbd5e1;
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    color: #64748b;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    flex-shrink: 0;
  }}

  /* Headings */
  h1 {{ font-size: 16pt; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }}
  h2 {{ font-size: 10.5pt; font-weight: 700; color: #0f172a; margin: 0 0 2px 0; }}
  p {{ margin: 0 0 4px 0; }}

  /* Badges */
  .badge {{
    display: inline-block;
    font-size: 6.5pt;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }}
  .badge-mint {{ background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }}
  .badge-amber {{ background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }}
  .badge-red {{ background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }}
  .badge-blue {{ background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }}

  /* Screenshot hero container - Fits 100% full height without cutoff */
  .screenshot-card {{
    border: 1.5px solid #0f172a;
    border-radius: 8px;
    overflow: hidden;
    background: #0c0f17;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    margin: 4px 0 6px 0;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .screenshot-img {{
    width: 100%;
    height: 100%;
    max-height: 206mm;
    object-fit: contain;
    display: block;
    background: #0c0f17;
  }}

  /* Explanatory callouts below screenshot */
  .callout-grid {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 2px;
    flex-shrink: 0;
  }}
  .callout-item {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 5px 8px;
  }}
  .callout-title {{
    font-weight: 700;
    font-size: 7pt;
    color: #0f172a;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
  }}
  .callout-desc {{
    font-size: 6.5pt;
    color: #475569;
    line-height: 1.3;
    margin: 0;
  }}
  .mono {{
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 6.5pt;
  }}
</style>
</head>
<body>

  <!-- ================================= PAGE 1: COVER & LIFECYCLE ARCHITECTURE ================================= -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">🔒 EXAMVAULT PROTOCOL · ZERO-TRUST ARCHITECTURE</div>
      <div class="header-meta">FULL UI OPERATIONAL AUDIT · v1.0.0</div>
    </div>

    <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
      <div style="border-left: 6px solid #0284c7; padding-left: 18px; margin-bottom: 16px;">
        <span class="badge badge-blue" style="margin-bottom: 6px;">100% Full-Page UI Screenshots</span>
        <h1 style="font-size: 22pt; margin: 4px 0 8px 0;">Blockchain Exam Vault</h1>
        <div style="font-size: 11pt; color: #475569; font-weight: 500; line-height: 1.4;">
          Complete End-to-End Visual Demonstration Across All 7 Protocol Lifecycle Phases
        </div>
      </div>

      <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
        <h2 style="font-size: 11pt; margin-bottom: 6px;">7-Phase Protocol Lifecycle Flow (Aligned with EXPLANATION.md)</h2>
        <p style="font-size: 8pt; color: #334155; margin-bottom: 10px;">
          The screenshots in this report document the authentic, full-length, un-cropped Web3 application in exact chronological sequence:
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px;">
            <b style="color: #0284c7;">Phase 1: Genesis Ledger Audit (<span class="mono">#/setup</span>)</b>
            <p style="font-size: 7pt; color: #64748b; margin: 2px 0 0;">Inspects genesis block deployments, 5.0 ETH total collateral staking, and Soulbound access token minting.</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px;">
            <b style="color: #0284c7;">Phase 2 & 3: Locked Countdown & Guards (<span class="mono">#/admin</span>, <span class="mono">#/staff</span>, <span class="mono">#/college</span>)</b>
            <p style="font-size: 7pt; color: #64748b; margin: 2px 0 0;">Monitors immutable time locks, sealed candidate fingerprints (A, B, C), and enforced pre-deadline download blocks.</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px;">
            <b style="color: #0284c7;">Phase 4: Entropy Reveal & Paper Draw (<span class="mono">#/admin</span>)</b>
            <p style="font-size: 7pt; color: #64748b; margin: 2px 0 0;">Custodians reveal secret seeds; contract computes deterministic XOR entropy to select Paper B on-chain.</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px;">
            <b style="color: #0284c7;">Phase 5: Key Quorum & Share Confirmation (<span class="mono">#/staff/1</span>)</b>
            <p style="font-size: 7pt; color: #64748b; margin: 2px 0 0;">Custodians submit Shamir pieces for Paper B; contract unlocks vault once 3-of-5 threshold is reached.</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px;">
            <b style="color: #0284c7;">Phase 6: Exam Centre Decrypt & Print (<span class="mono">#/college</span>)</b>
            <p style="font-size: 7pt; color: #64748b; margin: 2px 0 0;">Soulbound Token #1 verified, IPFS ciphertext fetched, AES key reassembled in browser RAM, and paper decrypted.</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px;">
            <b style="color: #0284c7;">Phase 7: Economic Slashing Settlement (<span class="mono">#/staff/4</span>)</b>
            <p style="font-size: 7pt; color: #64748b; margin: 2px 0 0;">Delinquent custodians who missed duties have 50% deposit (0.50 ETH) slashed and permanently locked in treasury.</p>
          </div>
        </div>
      </div>

      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px;">
        <h3 style="color: #065f46; margin: 0 0 3px 0; font-size: 8.5pt;">Complete Negative Security & Anti-Fraud Proofs Verified</h3>
        <p style="font-size: 7.5pt; color: #166534; margin: 0;">
          All negative attack vectors (<span class="mono">TooEarly</span>, <span class="mono">HashMismatch</span>, <span class="mono">NoToken</span>, <span class="mono">PaperLocked</span>, <span class="mono">Soulbound</span> transfer rejection, and <span class="mono">postpone</span> on threshold failure) passed with 89/89 automated tests.
        </p>
      </div>
    </div>

    <div class="footer-bar">
      <span>BLOCKCHAIN EXAM VAULT · FULL-PAGE UI DEMONSTRATION</span>
      <span>PAGE 1 OF 9</span>
    </div>
  </div>

  <!-- ================================= PAGE 2: PHASE 1 - GENESIS SETUP UI ================================= -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">🔒 EXAMVAULT PROTOCOL · PHASE 1: GENESIS AUDIT</div>
      <div class="header-meta">SCREEN 1: FULL LEDGER DEPLOYMENT & STAKING</div>
    </div>

    <div style="flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2>Genesis Audit Portal (<span class="mono">#/setup</span>) — Complete Screen</h2>
        <span class="badge badge-mint">Genesis Ledger Active</span>
      </div>
      <p style="color: #475569; font-size: 7.5pt;">
        Full-page blockchain transaction ledger from Block #1 through #14 showing smart contract deployments, 5 custodian registrations, 1.00 ETH staking escrows, access token minting, and sealed fingerprint commits.
      </p>
    </div>

    <div class="screenshot-card">
      <img src="data:image/png;base64,{img_genesis}" class="screenshot-img" alt="Genesis Setup Screen">
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-title">🏛️ Contract Deployment</div>
        <p class="callout-desc">Shows <span class="mono">ExamVault.sol</span> deployed at Block #1 with 0.5 ETH minimum stake, 120s seed window, and 600s reveal window.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">💰 5.0 ETH Collateral Escrow</div>
        <p class="callout-desc">Blocks #3–#7 verify that all 5 custodians deposited 1.00 ETH each, securing their commitment to submit timely key shares.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🔒 Soulbound Authorization</div>
        <p class="callout-desc">Block #14 logs the minting of ERC-5192 Soulbound Token #1 to the authenticated Government College of Engineering wallet.</p>
      </div>
    </div>

    <div class="footer-bar">
      <span>BLOCKCHAIN EXAM VAULT · FULL-PAGE UI DEMONSTRATION</span>
      <span>PAGE 2 OF 9</span>
    </div>
  </div>

  <!-- ================================= PAGE 3: PHASE 2/3 - ADMIN LOCKED UI ================================= -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">🔒 EXAMVAULT PROTOCOL · PHASE 2/3: CENTRAL CONTROLLER</div>
      <div class="header-meta">SCREEN 2: FULL PRE-EXAM LOCKED COUNTDOWN & HASHE</div>
    </div>

    <div style="flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2>Admin Portal — Locked Countdown (<span class="mono">#/admin</span>) — Complete Screen</h2>
        <span class="badge badge-amber">Locked Countdown (00:01:10)</span>
      </div>
      <p style="color: #475569; font-size: 7.5pt;">
        Un-cropped administrator control room: shows live monotonic countdown, 3-of-5 threshold quorum engine, candidate paper CIDs, all 15 sealed piece fingerprints, and EVM fast-forward testing tools.
      </p>
    </div>

    <div class="screenshot-card">
      <img src="data:image/png;base64,{img_admin_locked}" class="screenshot-img" alt="Admin Portal Locked Countdown">
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-title">⏱️ Monotonic Chain Clock</div>
        <p class="callout-desc">Live countdown synchronizes with Ethereum block timestamps. Any early reveal attempts are rejected with <span class="mono">TooEarly()</span>.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">📦 IPFS Candidate Papers</div>
        <p class="callout-desc">Full table displays CIDs and Keccak-256 hashes for candidate papers A, B, and C. Neither staff nor colleges know which is chosen.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🛡️ 15/15 Sealed Fingerprints</div>
        <p class="callout-desc">Lower ledger table confirms all 5 custodians have sealed their 3 candidate piece fingerprints and secret seed commitments.</p>
      </div>
    </div>

    <div class="footer-bar">
      <span>BLOCKCHAIN EXAM VAULT · FULL-PAGE UI DEMONSTRATION</span>
      <span>PAGE 3 OF 9</span>
    </div>
  </div>

  <!-- ================================= PAGE 4: PHASE 3 - STAFF LOCKED UI ================================= -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">🔒 EXAMVAULT PROTOCOL · PHASE 3: KEY CUSTODIAN WORKSTATION</div>
      <div class="header-meta">SCREEN 3: FULL PRE-DEADLINE DUTY & COMMITMENT VIEW</div>
    </div>

    <div style="flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2>Key Custodian 1 Portal — Locked Phase (<span class="mono">#/staff/1</span>) — Complete Screen</h2>
        <span class="badge badge-amber">Duties Locked Until Deadline</span>
      </div>
      <p style="color: #475569; font-size: 7.5pt;">
        Complete full-height Custodian 1 workstation: shows 1.00 ETH staked deposit, sealed cryptographic fingerprints for candidate papers A, B, C, upload file area, and locked submission buttons.
      </p>
    </div>

    <div class="screenshot-card">
      <img src="data:image/png;base64,{img_staff_locked}" class="screenshot-img" alt="Staff Portal Locked">
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-title">💼 1.00 ETH Staked Escrow</div>
        <p class="callout-desc">Confirms custodian has 1.00 ETH locked in contract storage, creating economic skin-in-the-game to guarantee timely participation.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🔐 Candidate Fingerprints</div>
        <p class="callout-desc">Displays Keccak-256 hashes of candidate Shamir shares for Papers A, B, and C. The custodian does not yet know which will be drawn.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🚫 Submission Guarded</div>
        <p class="callout-desc">Seed and piece submission buttons are completely locked with clear warning banners until the on-chain deadline is reached.</p>
      </div>
    </div>

    <div class="footer-bar">
      <span>BLOCKCHAIN EXAM VAULT · FULL-PAGE UI DEMONSTRATION</span>
      <span>PAGE 4 OF 9</span>
    </div>
  </div>

  <!-- ================================= PAGE 5: PHASE 3 - COLLEGE LOCKED UI ================================= -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">🔒 EXAMVAULT PROTOCOL · PHASE 3: EXAM CENTRE VENUE</div>
      <div class="header-meta">SCREEN 4: FULL PRE-EXAM ACCESS CONTROL & SECURITY CREDENTIALS</div>
    </div>

    <div style="flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2>College Portal — Locked State (<span class="mono">#/college</span>) — Complete Screen</h2>
        <span class="badge badge-amber">Awaiting 3-of-5 Custodian Keys</span>
      </div>
      <p style="color: #475569; font-size: 7.5pt;">
        Complete authorized college examination centre portal: shows Soulbound Token #1 verification, locked download status, 0/3 key quorum progress dial, and verified security credentials.
      </p>
    </div>

    <div class="screenshot-card">
      <img src="data:image/png;base64,{img_college_locked}" class="screenshot-img" alt="College Portal Locked">
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-title">🎓 ERC-5192 Soulbound #1</div>
        <p class="callout-desc">Verifies that the college wallet owns non-transferable Token #1, preventing credentials from being transferred, rented, or stolen.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🔒 Download Disabled</div>
        <p class="callout-desc">Download button is disabled with message <span class="mono">00:00:00 (LOCKED)</span>. Calling contract reverts with <span class="mono">PaperLocked()</span>.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">⭕ 0/3 Keys Collected</div>
        <p class="callout-desc">Quorum progress ring is at 0%. At least 3 independent key custodians must submit authentic pieces before decryption can occur.</p>
      </div>
    </div>

    <div class="footer-bar">
      <span>BLOCKCHAIN EXAM VAULT · FULL-PAGE UI DEMONSTRATION</span>
      <span>PAGE 5 OF 9</span>
    </div>
  </div>

  <!-- ================================= PAGE 6: PHASE 4 - ADMIN UNLOCKED UI ================================= -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">🔒 EXAMVAULT PROTOCOL · PHASE 4/5: CENTRAL CONTROLLER</div>
      <div class="header-meta">SCREEN 5: FULL CONSENSUS DRAW & 3/3 QUORUM UNLOCKED</div>
    </div>

    <div style="flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2>Admin Portal — Phase 3: Unlocked (<span class="mono">#/admin</span>) — Complete Screen</h2>
        <span class="badge badge-mint">Paper B Selected & Unlocked</span>
      </div>
      <p style="color: #475569; font-size: 7.5pt;">
        Full-height admin control room after deadline: Custodians 1, 2, 3 revealed seeds, Paper B selected via XOR entropy, 3 Shamir pieces submitted, and download audit log verified.
      </p>
    </div>

    <div class="screenshot-card">
      <img src="data:image/png;base64,{img_admin_unlocked}" class="screenshot-img" alt="Admin Portal Unlocked">
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-title">🎲 Paper B Selected</div>
        <p class="callout-desc">Determined mathematically on-chain: <span class="mono">keccak256(seed1 ^ seed2 ^ seed3) % 3</span>. Unbiasable and collusion-resistant.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">✓ 3/3 Quorum Ring</div>
        <p class="callout-desc">Holographic threshold engine dial glows mint with <span class="mono">UNLOCKED</span> badge. Threshold $k=3$ Shamir pieces are sealed in storage.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">📜 Immutable Audit Log</div>
        <p class="callout-desc">Records exact block height and timestamp of college download for regulatory verification and audit compliance.</p>
      </div>
    </div>

    <div class="footer-bar">
      <span>BLOCKCHAIN EXAM VAULT · FULL-PAGE UI DEMONSTRATION</span>
      <span>PAGE 6 OF 9</span>
    </div>
  </div>

  <!-- ================================= PAGE 7: PHASE 5 - STAFF CONFIRMED UI ================================= -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">🔒 EXAMVAULT PROTOCOL · PHASE 5: KEY CUSTODIAN PORTAL</div>
      <div class="header-meta">SCREEN 6: FULL KEY SHARE CONFIRMATION & STAKE PROTECTION</div>
    </div>

    <div style="flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2>Custodian 1 Portal — Share Confirmed (<span class="mono">#/staff/1</span>) — Complete Screen</h2>
        <span class="badge badge-mint">1.00 ETH Protected (Duty Fulfilled)</span>
      </div>
      <p style="color: #475569; font-size: 7.5pt;">
        Complete full-height Custodian 1 view: seed revealed, Paper B share verified against commitment, 1.00 ETH collateral fully protected, and direct link to exam centre decryption.
      </p>
    </div>

    <div class="screenshot-card">
      <img src="data:image/png;base64,{img_staff1_confirmed}" class="screenshot-img" alt="Staff 1 Confirmed Share">
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-title">✓ Share Confirmed</div>
        <p class="callout-desc">Disabled button reflects on-chain confirmation: <span class="mono">✓ Paper B Share Confirmed (1.00 ETH Protected)</span>.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🔒 1.00 ETH Secured</div>
        <p class="callout-desc">Because duties were fulfilled inside challenge windows, the full 1.00 ETH deposit is safe and unlocked for withdrawal.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🏫 Venue Decrypt Link</div>
        <p class="callout-desc">Provides a direct link to the Exam Centre screen to monitor live decryption and question paper printing.</p>
      </div>
    </div>

    <div class="footer-bar">
      <span>BLOCKCHAIN EXAM VAULT · FULL-PAGE UI DEMONSTRATION</span>
      <span>PAGE 7 OF 9</span>
    </div>
  </div>

  <!-- ================================= PAGE 8: PHASE 6 - COLLEGE UNLOCKED UI ================================= -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">🔒 EXAMVAULT PROTOCOL · PHASE 6: EXAM CENTRE VENUE</div>
      <div class="header-meta">SCREEN 7: FULL PAPER DECRYPTION & PLAINTEXT DELIVERY</div>
    </div>

    <div style="flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2>College Portal — Decryption Ready & Download (<span class="mono">#/college</span>) — Complete Screen</h2>
        <span class="badge badge-mint">Decryption Ready (Quorum Met)</span>
      </div>
      <p style="color: #475569; font-size: 7.5pt;">
        Complete full-height College view with 3-of-5 quorum reached: shows active Download & Decrypt action, IPFS hash integrity verification, zero-server in-memory WebCrypto reassembly, and full security credentials.
      </p>
    </div>

    <div class="screenshot-card">
      <img src="data:image/png;base64,{img_college_unlocked}" class="screenshot-img" alt="College Portal Decryption Ready">
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-title">🔓 Download & Decrypt Ready</div>
        <p class="callout-desc">Button illuminates mint: <span class="mono">🔓 Download & Decrypt Question Paper</span>. Invokes in-memory WebCrypto decryption.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🌐 IPFS Content Match</div>
        <p class="callout-desc">Ciphertext CID is retrieved from IPFS and matched byte-for-byte against the on-chain Keccak-256 fingerprint (<span class="mono">0xdf1984...</span>).</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🔑 Zero-Server In-Memory Key</div>
        <p class="callout-desc">AES-256 key is reassembled off-chain in local browser RAM via Shamir Lagrange interpolation over GF(256).</p>
      </div>
    </div>

    <div class="footer-bar">
      <span>BLOCKCHAIN EXAM VAULT · FULL-PAGE UI DEMONSTRATION</span>
      <span>PAGE 8 OF 9</span>
    </div>
  </div>

  <!-- ================================= PAGE 9: PHASE 7 - STAFF SLASHED UI ================================= -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">🔒 EXAMVAULT PROTOCOL · PHASE 7: POST-EXAM SETTLEMENT</div>
      <div class="header-meta">SCREEN 8: FULL ECONOMIC SLASHING & PENALTY ENFORCEMENT</div>
    </div>

    <div style="flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2>Custodian 4 Portal — Slashed Delinquency (<span class="mono">#/staff/4</span>) — Complete Screen</h2>
        <span class="badge badge-red">🚨 50% Deposit Slashed (-0.50 ETH)</span>
      </div>
      <p style="color: #475569; font-size: 7.5pt;">
        Complete full-height Delinquent Custodian 4 workstation: shows expired window alert, slashing breakdown (0.50 ETH forfeited to treasury), disabled revert-guard button, and cryptographic security architecture.
      </p>
    </div>

    <div class="screenshot-card">
      <img src="data:image/png;base64,{img_staff4_slashed}" class="screenshot-img" alt="Staff 4 Slashed Delinquency">
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-title">🚨 Window Expired Banner</div>
        <p class="callout-desc">Prominent alert: <span class="mono">SEED WINDOW EXPIRED — 50% STAKE (0.50 ETH) SUBJECT TO SLASHING</span>.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">💸 Economic Penalty</div>
        <p class="callout-desc">Deposit balance drops from 1.00 ETH to 0.50 ETH. The forfeited 0.50 ETH remains locked in smart contract treasury forever.</p>
      </div>
      <div class="callout-item">
        <div class="callout-title">🚫 Revert Crash Guard</div>
        <p class="callout-desc">Button is disabled as <span class="mono">🚨 Seed Window Expired (0.50 ETH Slashed)</span>, preventing unhandled revert crashes.</p>
      </div>
    </div>

    <div class="footer-bar">
      <span>BLOCKCHAIN EXAM VAULT · FULL-PAGE UI DEMONSTRATION</span>
      <span>PAGE 9 OF 9</span>
    </div>
  </div>

</body>
</html>
"""

def main():
    print("[1] Building HTML with 100% Full-Height Base64 Embedded Frontend Screenshots...")
    html_content = build_html()
    html_path = "docs/report.html"
    pdf_path = "Blockchain_Exam_Vault_Demonstration_Report.pdf"

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"    Written to {html_path} ({len(html_content)/1024:.1f} KB)")

    print("[2] Compiling PDF via headless Google Chrome...")
    cmd = [
        "google-chrome",
        "--headless=new",
        "--no-pdf-header-footer",
        "--print-to-pdf=" + pdf_path,
        html_path
    ]
    subprocess.run(cmd, check=True)
    
    file_size_kb = os.path.getsize(pdf_path) / 1024
    print(f"[3] PDF Generated Successfully: {pdf_path} ({file_size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
