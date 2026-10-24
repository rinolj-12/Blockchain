# 🛡️ ExamVault: Time-Locked Blockchain Exam Paper Protection

A decentralized, tamper-proof examination paper distribution and time-lock system built on **Ethereum (Solidity 0.8.28)**, **Shamir's Secret Sharing (3-of-5 threshold)**, **AES-256-GCM envelope encryption**, **ERC-5192 Minimal Soulbound Access Tokens**, and **Decentralized IPFS Storage**.

> **The 30-Second Viva Pitch:**  
> *"Traditional examination systems rely on centralized trust: whoever has access to the database or admin password can leak the paper early. ExamVault eliminates human trust entirely. The exam papers are encrypted with AES-256-GCM and stored on IPFS. The decryption key is split into 5 Shamir shares. The Ethereum smart contract acts as an immutable cryptographic time-lock: it mathematically rejects key submissions before the exam deadline, selects a random candidate paper on-chain, and unlocks the paper only when a 3-of-5 custodian quorum is reached. Only accredited exam centres holding a non-transferable ERC-5192 Soulbound Token can decrypt the paper in browser memory."*

---

## 📌 Problem & Cryptographic Solution

| Attack Vector / Failure in Traditional Systems | How ExamVault Solves It Cryptographically |
|---|---|
| **Centralized Database Leak:** A corrupt sysadmin or university database breach leaks the question paper days before the exam. | **Zero Plaintext Storage:** Question papers are encrypted client-side by the Paper Setter with AES-256-GCM before distribution. The plaintext is deleted. Neither the smart contract nor IPFS ever stores unencrypted questions. |
| **Single Keyholder Compromise:** If one custodian is bribed or hacked, the paper is leaked. | **3-of-5 Shamir's Secret Sharing:** The AES decryption key is split into 5 mathematical shares. Reconstructing the key requires any 3 shares. Having 1 or 2 shares reveals mathematically zero information about the key. |
| **Insider Custodian Threat:** Staff members leak questions ahead of time. | **Custodians Never See the Paper:** Staff custodians only receive mathematical 32-byte Shamir shares (`staff-1.json` to `staff-5.json`). They have never seen or possessed the question paper! |
| **Premature Paper Release:** Central authority opens the exam 1 hour early. | **EVM Time-Lock Enforcement:** The deadline is locked immutably into Ethereum state. The contract's `revealPiece()` strictly checks `require(block.timestamp >= examTime)`. No transaction can bypass block timestamps. |
| **Custodian Inactivity or Dishonesty:** A custodian fails to reveal their share or submits false keys. | **1.0 ETH Collateral Staking & Slashing:** Custodians stake 1.0 ETH into smart contract escrow. Dishonest or delinquent custodians forfeit their collateral via automated smart contract slashing. |
| **Paper Leak to Unauthorized Colleges:** Credentials shared or forwarded to unauthorized exam centers. | **ERC-5192 Soulbound Access Tokens:** Exam centers receive non-transferable Soulbound tokens (ERC-721 + ERC-5192). Transfers and approvals unconditionally revert on-chain. Only authenticated venue wallets can invoke `logDownload()`. |
| **Server-Side Interception:** A proxy or web server intercepts the decrypted paper in transit. | **Zero-Server Client-Side Decryption:** Decryption occurs entirely inside local browser memory via the native WebCrypto API. Unencrypted questions never travel over the network. |

---

## 🌐 Dedicated Portals & Direct Links

The portal supports both clean paths (`/admin`, `/setup`, `/staff/1`, `/college`) and hash-based URLs (`#/admin`, `#/setup`, `#/staff/1`, `#/college`). You can navigate directly to any view:

| Portal Role | Direct Browser Link | Description |
|---|---|---|
| 🎬 **Genesis Setup & Audit** | [`http://localhost:5173/#/setup`](http://localhost:5173/#/setup) | **Interactive Blockchain Ledger Audit:** Step-through the Hardhat EVM genesis (Block #0) through Block #14 and inspect the Paper Setter's cryptographic pipeline. |
| 🏛️ **Central Admin** | [`http://localhost:5173/#/admin`](http://localhost:5173/#/admin) | **University Controller:** Schedule and lock exam deadline on-chain, monitor live countdown, inspect candidate paper sets (A/B/C), view real-time Quorum Visualizer, and trigger instant EVM time-warps. |
| 👥 **Key Custodian #1 (Staff)** | [`http://localhost:5173/#/staff/1`](http://localhost:5173/#/staff/1) | Exam board custodian 1: quick-load demo share, inspect 32-byte secret pieces in memory, and submit share to smart contract. |
| 👥 **Key Custodian #2 (Staff)** | [`http://localhost:5173/#/staff/2`](http://localhost:5173/#/staff/2) | Exam board custodian 2: quick-load demo share, inspect 32-byte secret pieces in memory, and submit share to smart contract. |
| 👥 **Key Custodian #3 (Staff)** | [`http://localhost:5173/#/staff/3`](http://localhost:5173/#/staff/3) | Exam board custodian 3: quick-load demo share, inspect 32-byte secret pieces in memory, and reach the 3-of-5 unlock quorum. |
| 👥 **Key Custodian #4 (Staff)** | [`http://localhost:5173/#/staff/4`](http://localhost:5173/#/staff/4) | Exam board custodian 4: redundant threshold keyholder. |
| 👥 **Key Custodian #5 (Staff)** | [`http://localhost:5173/#/staff/5`](http://localhost:5173/#/staff/5) | Exam board custodian 5: redundant threshold keyholder. |
| 🏫 **Exam Centre / Hall** | [`http://localhost:5173/#/college`](http://localhost:5173/#/college) | **Verified Exam Venue (Govt. College):** Holding Soulbound Token #1. Logs download on-chain, fetches ciphertext from IPFS, verifies Keccak-256 hash, decrypts client-side, and formats for physical printing. |

---

## 🔍 On-Chain Lifecycle: The 14 Blocks of Genesis Setup

During setup (`npm run demo:setup`), the Ethereum blockchain advances through **14 deterministic blocks**, establishing the zero-trust environment:

```
[Block #0: EVM Genesis] ──> [Block #1: ExamVault.sol Deploy] ──> [Blocks #2-6: Staff 1-5 Onboard]
                                                                        │
┌───────────────────────────────────────────────────────────────────────┘
▼
[Block #7: Govt College Accredited] ──> [Block #8: City Arts (Tokenless)]
                                                │
┌───────────────────────────────────────────────┘
▼
[Special Stage: Paper Setter AES-256 + IPFS + Shamir Split (Off-Chain)]
                                                │
┌───────────────────────────────────────────────┘
▼
[Blocks #9-13: 5.0 ETH Collateral Escrow Staked (1.0 ETH/Staff)] ──> [Block #14: ERC-5192 Soulbound Token Minted]
```

1. **Block #0 (EVM Genesis):** Local Ethereum network initialized with Chain ID 31337 and 20 funded test accounts.
2. **Block #1 (Contract Deployment):** Central Admin deploys [ExamVault.sol](file:///home/rinolj/Desktop/Blockchain-pro/contracts/ExamVault.sol), which automatically spawns the [CollegeAccessToken.sol](file:///home/rinolj/Desktop/Blockchain-pro/contracts/CollegeAccessToken.sol) ERC-5192 contract.
3. **Blocks #2 to #6 (Staff Custodian Enrollment):** Five independent staff keyholders are registered (`vault.registerStaff()`).
4. **Block #7 (Accredited Exam Centre):** Govt. College of Engineering is authorized on-chain.
5. **Block #8 (Secondary College):** City Arts College is registered without an access token (proves unauthorized centres are blocked).
6. **Special Stage (Paper Setter Cryptographic Pipeline):**
   * Three candidate papers (Paper A: Algorithmic Foundations, Paper B: Sorting & Advanced Trees, Paper C: Dynamic Programming & Tries) are encrypted with AES-256-GCM.
   * Ciphertext blobs are pinned to IPFS, generating deterministic CIDv1 identifiers.
   * AES keys are mathematically split into 5 Shamir shares (`staff-1.json` to `staff-5.json`).
   * Plaintext question files are deleted. Staff custodians only receive mathematical key fragments.
7. **Blocks #9 to #13 (Collateral Staking):** Staff Custodians 1 through 5 each deposit 1.00 ETH collateral into the contract escrow (`vault.stake{value: 1.0 ETH}()`), establishing a 5.00 ETH total economic security shield.
8. **Block #14 (Soulbound Token Mint):** Non-transferable ERC-5192 Token #1 is minted to Govt. College of Engineering.

> 💡 **Interactive Visualizer:** You can watch and audit this entire 14-block sequence step-by-step with telemetry and candidate paper previews at [`http://localhost:5173/#/setup`](http://localhost:5173/#/setup).

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **OS**: Linux (Ubuntu tested), macOS, or Windows WSL

### 2. Install Dependencies
Run these once from the project root:

```bash
npm install                      # Install smart contract, Hardhat, and cryptographic libraries
npm --prefix frontend install    # Install React 19, Vite, and frontend portal dependencies
```

### 3. Run the System (3 Terminals)

Open three terminal windows:

#### Terminal 1: Start the Local Ethereum Blockchain
```bash
npm run node
```
*Spawns a local Ethereum node (Hardhat Network) with 20 funded accounts listening on `http://127.0.0.1:8545`.*

#### Terminal 2: Deploy & Setup Genesis State
```bash
npm run demo:setup
```
*Deploys the contracts, encrypts Papers A, B, and C, splits Shamir shares, enrolls staff, stakes 5.0 ETH collateral, and mints Soulbound Token #1 (sealing Blocks 1–14). The exam schedule is left ready to be launched directly from the Admin Portal!*  
*(Tip: To start the 120-second timer immediately from CLI instead, run `npm run demo:setup -- --start`).*

#### Terminal 3: Start the Web Portal
```bash
npm run portal
```
*Launches the Vite dev server at **`http://localhost:5173`**.*

---

## 🎯 Step-by-Step Viva Demonstration Walkthrough

Follow this 4-step sequence during project evaluation to showcase all security guarantees:

### Step 1: Genesis Ledger Audit
1. Navigate to **[`http://localhost:5173/#/setup`](http://localhost:5173/#/setup)**.
2. Explain the 14 sequential on-chain blocks to the examiner:
   * Show the deployment of the vault and the ERC-5192 Soulbound contract.
   * Highlight the **Special Stage (Paper Setter Cryptography)**: click to inspect candidate papers A, B, and C, pointing out their IPFS CIDs and Keccak-256 fingerprints.
   * Emphasize the **5.0 ETH Staked Collateral** escrow protecting against custodian delinquency.
3. Click **"Go to Admin Portal"** (or let the auto-redirect proceed).

### Step 2: Admin Portal & Countdown Initiation
1. Navigate to **[`http://localhost:5173/#/admin`](http://localhost:5173/#/admin)**.
2. Show the examiner:
   * Exam Title: *Data Structures & Algorithms (CS501)*.
   * Status: **NOT SET (Ready to Schedule)**.
   * Quorum Visualizer showing 5 registered, collateralized custodians.
3. Select duration (default **2 minutes**) and click **"🚀 Start Countdown"**:
   * A multi-step Web3 transaction modal appears, executing `vault.setExam()` and committing the 5 custodian hashes on-chain.
   * The live countdown begins ticking.
4. *(Optional for Viva speed)*: Click **"⚡ Fast-Forward to Deadline"** to instantly advance EVM block time by 122 seconds without waiting.

### Step 3: Custodians Upload Keys (Reaching 3-of-5 Quorum)
1. Open **Staff 1** ([`http://localhost:5173/#/staff/1`](http://localhost:5173/#/staff/1)):
   * Click **"⚡ Quick-Load Demo Key"** → notice the live **Key Share Inspector** displaying the 32-byte secret pieces for Papers A, B, and C decrypted in browser memory.
   * Click **"Submit Key to Smart Contract"** → status turns to `✓ Key Uploaded & Verified`.
2. Open **Staff 2** ([`http://localhost:5173/#/staff/2`](http://localhost:5173/#/staff/2)) (or use the top-right role switcher):
   * Click **"⚡ Quick-Load Demo Key"** → click **"Submit Key to Smart Contract"**.
   * Progress displays `2 / 5 Keys Submitted`.
3. Open **Staff 3** ([`http://localhost:5173/#/staff/3`](http://localhost:5173/#/staff/3)):
   * Click **"⚡ Quick-Load Demo Key"** → click **"Submit Key to Smart Contract"**.
   * **Quorum Reached!** Notice the instant status transition: **Threshold Reached (3 of 5)! Exam Paper is UNLOCKED!**

### Step 4: Exam Centre Downloads & Decrypts
1. Navigate to **[`http://localhost:5173/#/college`](http://localhost:5173/#/college)**:
   * Show that the venue holds **Soulbound Token #1 (Govt. College of Engineering)**.
   * The status badge displays **🔓 UNLOCKED (3/5 Keys Verified)**.
2. Click **"🔓 Download & Decrypt Question Paper"**:
   * The browser executes the cryptographic pipeline:
     1. Invokes `logDownload()` on Ethereum to record an immutable audit event.
     2. Fetches the AES-256-GCM ciphertext from IPFS via its content CID.
     3. Computes the Keccak-256 hash of the downloaded payload and compares it with the on-chain fingerprint.
     4. Combines the 3 Shamir shares via polynomial Lagrange interpolation to reconstruct the AES-256 key.
     5. Decrypts the paper client-side and renders the full examination paper!
3. Click **"🖨️ Print for Exam Hall"**:
   * Demonstrates production-grade CSS print formatting for exam hall distribution.

---

## 🧠 System Architecture & Cryptography

```
                                  ┌──────────────────────────────────────────────┐
                                  │           Paper Setter Pipeline              │
                                  │  - Writes Candidate Papers (A, B, C)        │
                                  │  - Encrypts via AES-256-GCM (fresh IVs)      │
                                  │  - Splits AES Key into 5 Shamir Shares       │
                                  │  - Computes Keccak-256 Hashes & IPFS CIDs    │
                                  │  - Deletes Plaintext Papers                  │
                                  └───────────────┬────────────────┬─────────────┘
                     Ciphertext Blobs             │                │ Hashes, CIDs,
                     (Content Addressed)          ▼                │ & Key Commitments
                                          ┌──────────────┐         ▼
                                          │ IPFS Storage │  ┌────────────────────────────────────────┐
                                          └───────┬──────┘  │ Ethereum Smart Contract (ExamVault.sol)│
                                                  │         │  - Immutable Exam Deadline             │
                                                  │         │  - Keccak-256 Hashes & IPFS CIDs       │
                                                  │         │  - Staff Key Commitments & Stakes      │
                                                  │         │  - On-Chain Seed XOR Entropy           │
                                                  │         │  - ERC-5192 Soulbound Access Tokens    │
                                                  │         │  - 3-of-5 Quorum Unlock Logic          │
                                                  │         └──────────────────┬─────────────────────┘
                                           fetch  │                            │ verify & combine
                                                  ▼                            ▼
                                          ┌──────────────────────────────────────────────────────────┐
                                          │ Web Browser Portal (Client-Side In-Memory Execution)     │
                                          │  1. Check Soulbound Token #1 ownership                   │
                                          │  2. Invoke logDownload() on-chain                        │
                                          │  3. Fetch IPFS ciphertext & verify Keccak-256 hash       │
                                          │  4. Reconstruct AES key from 3 Shamir shares (Lagrange)  │
                                          │  5. Decrypt paper client-side via WebCrypto API          │
                                          │  6. Render examination paper & print layout              │
                                          └──────────────────────────────────────────────────────────┘
```

### Core Cryptographic Building Blocks:

1. **Authenticated AES-256-GCM Envelope:**
   * Each paper is encrypted with a unique 256-bit symmetric key using Galois/Counter Mode (GCM).
   * Generates a 128-bit authentication tag ensuring confidentiality and tamper resistance.
   * Stored in custom envelope format (`EXV1` binary header).

2. **3-of-5 Shamir's Secret Sharing (Polynomial Threshold):**
   * The 32-byte AES key is treated as the secret $S = f(0)$ of a random 2nd-degree polynomial over Galois Field $GF(2^8)$:
     $$f(x) = S + a_1 x + a_2 x^2$$
   * Five distinct evaluations $f(1), f(2), f(3), f(4), f(5)$ are distributed to Custodians 1–5.
   * Any 3 custodians can reconstruct $f(0)$ via Lagrange polynomial interpolation:
     $$S = \sum_{j=1}^{3} y_j \prod_{m \neq j} \frac{-x_m}{x_j - x_m}$$
   * Any 2 custodians possess insufficient information: every candidate key remains equally probable.

3. **Smart Contract Cryptographic Time-Lock:**
   * The exam deadline (`examTime`) is stored in contract storage.
   * The function `revealPiece()` enforces `require(block.timestamp >= examTime)`.
   * Miner timestamp manipulation is bounded to $\pm 15$ seconds on Ethereum, making early reveals mathematically impossible.

4. **ERC-5192 Minimal Soulbound Tokens:**
   * Extends ERC-721 with the `locked(tokenId)` interface.
   * All transfer functions (`transferFrom`, `safeTransferFrom`, `approve`, `setApprovalForAll`) unconditionally revert.
   * Guarantees non-transferable access rights directly tied to the accredited college wallet.

5. **Tamper-Evident IPFS Content Addressing:**
   * Files are identified by their cryptographic hash (CIDv1 `raw/sha256` in base32).
   * Modifying even a single bit changes the CID and hash, causing the on-chain Keccak-256 verification to fail.

---

## 📁 Repository Structure

```
Blockchain-pro/
├── contracts/                        # Solidity Smart Contracts
│   ├── ExamVault.sol                 # Core vault: time-locks, commitments, quorum, slashing
│   └── CollegeAccessToken.sol        # ERC-5192 Minimal Soulbound Token contract
├── shared/                           # Cryptographic Core (Universal JS/Node/Browser)
│   └── vaultCrypto.mjs               # AES-256-GCM, Shamir 3-of-5, Keccak-256, IPFS CIDv1
├── scripts/                          # Automated Deployment & CLI Tools
│   ├── demo-setup.mjs                # Deploys contracts, encrypts papers, prepares demo (Blocks 0-14)
│   ├── prepare-papers.mjs            # Paper Setter helper: AES encryption & Shamir split
│   ├── demo-reveal.mjs               # Scripted CLI key reveal, slashing, and download demo
│   ├── verify-hash.mjs               # Verification script proving hash mismatch detection
│   └── d-env.cjs                     # Cross-platform environment loader
├── papers/                           # Sample Question Papers
│   ├── paper-A.md                    # Set A: Algorithmic Foundations
│   ├── paper-B.md                    # Set B: Sorting & Advanced Trees
│   └── paper-C.md                    # Set C: Dynamic Programming & Tries
├── test/                             # Automated Test Suite (89 tests)
│   ├── ExamVault.test.cjs            # Smart contract unit tests
│   └── crypto.test.cjs               # Cryptographic unit tests
├── frontend/                         # React 19 + Vite Web Application
│   ├── src/
│   │   ├── screens/
│   │   │   ├── GenesisSetup.jsx      # Interactive 14-block ledger audit & paper inspector
│   │   │   ├── Admin.jsx             # Central Admin portal (schedule, Quorum, fast-forward)
│   │   │   ├── Staff.jsx             # Key Custodian portal (quick-load, share inspector)
│   │   │   └── College.jsx           # Exam Centre portal (download, client decrypt, print)
│   │   ├── components/
│   │   │   ├── Header.jsx            # Portal navigation & live block height pill
│   │   │   ├── BlockchainVisuals.jsx # Soulbound badge & cryptographic visuals
│   │   │   ├── QuorumVisualizer.jsx  # Real-time 3-of-5 threshold quorum ring
│   │   │   ├── PaperVaultSection.jsx # Candidate paper preview & CID inspector
│   │   │   ├── TransactionModal.jsx  # Multi-step Web3 transaction dialog
│   │   │   ├── Notice.jsx            # Alert banners
│   │   │   ├── StatusPill.jsx        # State pills
│   │   │   └── Icons.jsx             # Custom SVG icons
│   │   ├── lib/
│   │   │   ├── chain.js              # Ethers.js contract interactions & state hooks
│   │   │   ├── crypto.js             # Client-side WebCrypto AES-GCM & Shamir combiner
│   │   │   ├── format.js             # Timestamp, ETH, and address formatters
│   │   │   ├── papersData.js         # Candidate paper syllabus data
│   │   │   └── wallet.jsx            # Multi-account demo wallet provider
│   │   ├── styles.css                # Dark-mode styling, glassmorphism & print CSS
│   │   └── App.jsx                   # Route dispatcher
│   └── public/
│       ├── demo-secrets/             # Quick-load custodian keys (staff-1.json .. 5.json)
│       └── ipfs/                     # Mock IPFS gateway directory for offline testing
├── hardhat.config.cjs                # Hardhat EVM configuration (Solidity 0.8.28)
└── package.json                      # Root scripts and dependencies
```

---

## 🧪 Automated Test Suite (89 Tests)

ExamVault includes a comprehensive automated test suite verifying every smart contract invariant, cryptographic property, and edge case:

```bash
npm test
```

### PRD Success Criteria & Test Traceability Matrix:

| PRD Success Criterion | Automated Test Verification (`npm test`) | Result |
|---|---|:---:|
| **Premature Reveal Rejection** | `ExamVault › piece reveal › Revealing a piece before exam time fails`<br>`ExamVault › seed reveal › Revealing a seed before exam time fails` | ✅ PASS |
| **Invalid Piece Rejection** | `ExamVault › piece reveal › A wrong piece is rejected`<br>`ExamVault › piece reveal › a piece for a non-selected paper is rejected`<br>`ExamVault › piece reveal › another staff's piece can't be replayed` | ✅ PASS |
| **3-of-5 Threshold Unlock** | `ExamVault › piece reveal › 3 valid pieces unlock the paper`<br>`vaultCrypto › Shamir 3-of-5 › any 3 of 5 shares rebuild the key and decrypt (all 10 combinations)` | ✅ PASS |
| **2-of-5 Zero Knowledge** | `vaultCrypto › Shamir 3-of-5 › 2 shares do not give the key` | ✅ PASS |
| **Collateral Slashing** | `ExamVault › penalties & stake withdrawal › A staff member who misses the window loses part of their deposit` | ✅ PASS |
| **Unauthorized Access Denial** | `ExamVault › colleges & downloads › A college without a token cannot download` | ✅ PASS |
| **Soulbound Non-Transferability** | `ExamVault › soulbound access token › transferFrom / safeTransferFrom / approve / setApprovalForAll all revert` | ✅ PASS |
| **Tamper-Evidence Detection** | `vaultCrypto › hash check › scripts/verify-hash.mjs exits 0 on original, 1 on edited copy`<br>`vaultCrypto › AES-256-GCM envelope › fails when one ciphertext byte is flipped` | ✅ PASS |

---

## 🎓 Viva Questions & Answers (Examiner Defense Cheat Sheet)

#### Q1: Is the plaintext examination paper ever stored on the blockchain?
> **Answer:** **Never.** Public blockchains are transparent; storing plaintext would leak the paper to anyone running a node. The blockchain only stores:
> 1. The **Keccak-256 hash** of the encrypted file.
> 2. The **IPFS CID** pointing to the encrypted blob.
> 3. The **cryptographic commitments** of the custodians.  
> The paper is decrypted strictly inside the authenticated college's local browser memory using WebCrypto after quorum is achieved.

#### Q2: What prevents 2 dishonest staff members from colluding to leak the paper early?
> **Answer:** Under Shamir's $(3, 5)$ Secret Sharing threshold scheme, the polynomial is of degree 2 ($f(x) = S + a_1 x + a_2 x^2$). Determining the constant term $S$ (the AES key) requires at least 3 points. With only 2 points, for every possible key $K$, there exists a valid polynomial passing through those 2 points and $(0, K)$. Thus, possessing 2 shares gives **strictly zero mathematical advantage** over pure guessing.

#### Q3: Why does the system advance through 14 blocks during setup?
> **Answer:** Setup establishes an immutable on-chain record for every participant:
> * Block 1 deploys the vault and ERC-5192 contracts.
> * Blocks 2–6 register the 5 staff custodians.
> * Blocks 7–8 register the exam centres.
> * Blocks 9–13 record the 1.0 ETH collateral deposit per custodian into escrow.
> * Block 14 mints Soulbound Access Token #1.  
> Every security credential and collateral deposit is permanently auditable on the blockchain.

#### Q4: Can the university administrator open or change the paper early?
> **Answer:** **No.** 
> 1. The admin does not hold the Shamir key shares once distributed.
> 2. The smart contract's `revealPiece()` function enforces `require(block.timestamp >= examTime)`, which reverts any transaction attempted before the deadline.
> 3. `setExam()` can only be called once, making the deadline and file hashes permanent and tamper-proof.

#### Q5: Why use an ERC-5192 Soulbound Token instead of a regular password or API key?
> **Answer:** Passwords and API keys can be shared, forwarded, or stolen. An ERC-5192 Soulbound Token is permanently bound to the exam centre's Ethereum address. The token's smart contract explicitly overrides all transfer and approval functions to revert, ensuring that only the accredited venue wallet can authenticate and decrypt.

#### Q6: How does economic game theory prevent custodians from disappearing during the exam?
> **Answer:** Each custodian must stake **1.0 ETH collateral** during setup. If a custodian fails to submit their share within the reveal window, the smart contract automatically slashes 50% of their collateral. Furthermore, honest custodians can only withdraw their full deposit once their duties are fulfilled.

#### Q7: How does client-side decryption work if there is no central server?
> **Answer:** The college portal runs as a decentralized Single Page Application. It uses the browser's native `window.crypto.subtle` API to decrypt the AES-256-GCM ciphertext entirely in volatile RAM. The plaintext is never sent over HTTP, stored on disk, or routed through any intermediary server.

#### Q8: How is the physical question paper distributed in the exam hall?
> **Answer:** The College portal includes a dedicated **"🖨️ Print for Exam Hall"** action with customized print stylesheets (`@media print`) that strip away all Web3 UI elements, generating a clean, standardized, printed question paper ready for immediate distribution to exam hall students.

---

## 📜 License & Academic Integrity

This project was developed for academic research and demonstration purposes.  
Licensed under the **MIT License**.
