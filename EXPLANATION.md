# Blockchain Exam Vault — Complete Project Explanation & Technical Reference

> **A decentralized, zero-trust examination management platform.**  
> Built with Solidity smart contracts, Shamir's Secret Sharing threshold cryptography, AES-256-GCM symmetric encryption, IPFS decentralized storage, and Soulbound access tokens.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [The Real-World Problem & Why Centralized Systems Fail](#2-the-real-world-problem--why-centralized-systems-fail)
3. [Core Technical Concepts (Explained with Real-World Analogies)](#3-core-technical-concepts-explained-with-real-world-analogies)
   - [3.1 AES-256-GCM Symmetric Encryption](#31-aes-256-gcm-symmetric-encryption)
   - [3.2 Shamir's Secret Sharing (3-of-5 Threshold Cryptography)](#32-shamirs-secret-sharing-3-of-5-threshold-cryptography)
   - [3.3 The Commit-Reveal Scheme](#33-the-commit-reveal-scheme)
   - [3.4 IPFS (InterPlanetary File System) & CIDs](#34-ipfs-interplanetary-file-system--cids)
   - [3.5 Soulbound Access Tokens (ERC-721 + ERC-5192)](#35-soulbound-access-tokens-erc-721--erc-5192)
   - [3.6 Keccak-256 Cryptographic Fingerprinting](#36-keccak-256-cryptographic-fingerprinting)
   - [3.7 Multi-Party Pseudo-Random Paper Selection](#37-multi-party-pseudo-random-paper-selection)
   - [3.8 Staking & Economic Slashing (Skin in the Game)](#38-staking--economic-slashing-skin-in-the-game)
4. [End-to-End System Architecture](#4-end-to-end-system-architecture)
5. [The Complete Exam Lifecycle (Step-by-Step Flow)](#5-the-complete-exam-lifecycle-step-by-step-flow)
6. [Smart Contracts In-Depth Reference](#6-smart-contracts-in-depth-reference)
   - [6.1 ExamVault.sol](#61-examvaultsol)
   - [6.2 CollegeAccessToken.sol](#62-collegeaccesstokensol)
   - [6.3 Complete Error Reference Table](#63-complete-error-reference-table)
7. [Shared Cryptography Library (shared/vaultCrypto.mjs)](#7-shared-cryptography-library-sharedvaultcryptomjs)
   - [7.1 Dual-Environment WebCrypto Architecture](#71-dual-environment-webcrypto-architecture)
   - [7.2 EXV1 Binary Envelope Specification](#72-exv1-binary-envelope-specification)
   - [7.3 Exported Functions Reference](#73-exported-functions-reference)
8. [Scripts & CLI Automation Suite](#8-scripts--cli-automation-suite)
   - [8.1 scripts/prepare-papers.mjs](#81-scriptsprepare-papersmjs)
   - [8.2 scripts/demo-setup.mjs](#82-scriptsdemo-setupmjs)
   - [8.3 scripts/demo-reveal.mjs](#83-scriptsdemo-revealmjs)
   - [8.4 scripts/deploy.cjs](#84-scriptsdeploycjs)
   - [8.5 scripts/verify-hash.mjs](#85-scriptsverify-hashmjs)
9. [Frontend Web Application Architecture](#9-frontend-web-application-architecture)
   - [9.1 Architecture & State Flow](#91-architecture--state-flow)
   - [9.2 User Screens (Admin, Genesis, Staff, College)](#92-user-screens-admin-genesis-staff-college)
   - [9.3 Reusable Visual Components](#93-reusable-visual-components)
10. [Testing Suite & Quality Assurance](#10-testing-suite--quality-assurance)
11. [Security Analysis & Threat Matrix](#11-security-analysis--threat-matrix)
12. [Known Limitations & Future Roadmap](#12-known-limitations--future-roadmap)
13. [Step-by-Step Setup & How-to-Run Guide](#13-step-by-step-setup--how-to-run-guide)
14. [Complete Project File Tree](#14-complete-project-file-tree)
15. [Comprehensive Technical Glossary](#15-comprehensive-technical-glossary)

---

## 1. Executive Summary

The **Blockchain Exam Vault** is an enterprise-grade cryptographic protocol designed to completely eliminate question paper leaks in university and standardized competitive examinations.

### The Core Idea in 30 Seconds:
1. **Three candidate papers (A, B, C)** are drafted weeks prior to an exam.
2. Each paper is strongly encrypted using a military-grade symmetric cipher (**AES-256-GCM**) with a unique 256-bit key. The encrypted files (ciphertexts) are uploaded to a decentralized, public file network (**IPFS**).
3. The AES decryption keys are split into 5 pieces using **Shamir's Secret Sharing (3-of-5 threshold)** and distributed among 5 independent examination officials. **The master keys are immediately deleted from all disks and RAM.**
4. The smart contract on the blockchain records the unchangeable fingerprints (**keccak256 hashes**) and IPFS addresses (**CIDs**) of the encrypted papers, along with the exam start time.
5. Each staff member deposits financial collateral (**stake**) and commits cryptographic hashes of their pieces.
6. When the exam time strikes:
   - Staff reveal secret random seeds. The contract XORs these seeds together to randomly choose which paper (A, B, or C) will be used. No single person could have predicted or manipulated this choice.
   - Staff have a 10-minute window to reveal their secret share for the chosen paper only.
   - Once any **3 of the 5 staff members** submit their valid shares on-chain, the threshold is met.
7. Authorized examination centers (colleges) holding a non-transferable **Soulbound NFT** log their download on the blockchain, fetch the encrypted paper from IPFS, check its cryptographic hash, reconstruct the AES key from the 3 revealed shares, and decrypt the official question paper right as students sit for the test.
8. Any official who fails to submit their share within the deadline is automatically **slashed (losing 50% of their staked deposit)**.

---

## 2. The Real-World Problem & Why Centralized Systems Fail

### 2.1 The Crisis of Examination Leaks
Every year, worldwide competitive examinations and university tests face catastrophic integrity breaches:
- **Physical transit vulnerability**: Paper question sheets printed days in advance must be transported in trunks and courier trucks. Seals are broken, papers photographed with smartphones, and trunks resealed.
- **Insider threats**: Corrupt examination controllers, printing press workers, computer system administrators, or couriers accept bribes to leak questions hours or days ahead of time.
- **Black-market distribution**: Leaked papers circulate on messaging apps (Telegram, WhatsApp) within minutes, compromising the future of millions of students and causing millions of dollars in exam cancellation and re-testing costs.

### 2.2 Why Centralized Databases Fail
Many organizations attempt to digitize exam distribution using centralized servers (e.g., password-protected PDFs hosted on AWS S3 or a private university portal). This fails because:
1. **Root Administrator Privilege**: Any database administrator, cloud DevOps engineer, or system manager with root credentials can bypass access control, download the PDF, or extract the encryption key.
2. **Clock Manipulation**: Centralized servers maintain their own system clocks. A corrupt administrator can alter server time or disable time checks to release the paper early.
3. **Pervasive Single Point of Failure**: If the central server is compromised, the entire examination security collapses.
4. **No Verifiable Audit Trail**: In centralized databases, database logs can be deleted, altered, or backdated after an insider leak.

### 2.3 The Blockchain Guarantee
By moving access control, cryptographic verification, and time-locks to an autonomous smart contract:
- **No Single Point of Trust**: The contract has no backdoor, no master password, and no admin override. Even the contract deployer (the university chancellor) cannot open a paper early.
- **Mathematical Enforcement**: The contract strictly checks `block.timestamp`. Revealing before `examTime` is physically impossible—the transaction unconditionally reverts.
- **Economic Penalties (Slashing)**: Officials face real financial consequences for negligence or collusion.
- **Immutable Public Accountability**: Every registration, stake, commitment, reveal, and download is permanently recorded on the blockchain ledger for public auditing.

---

## 3. Core Technical Concepts (Explained with Real-World Analogies)

### 3.1 AES-256-GCM Symmetric Encryption
- **Plain English Analogy**: Imagine placing an exam paper inside a heavy titanium safe that can only be unlocked by a specific 32-tooth brass key. Even if you place this safe in the middle of a crowded public railway station (the public IPFS network), nobody can see inside or tamper with the contents without the exact key. Furthermore, the safe has a tamper-detection wax seal (GCM tag): if anyone attempts to scratch or modify even a single microgram of the metal, the key will refuse to turn.
- **How the Code Uses It**:
  - The project uses the browser and Node.js standard `WebCrypto` API (`crypto.subtle`).
  - It generates a 256-bit (32-byte) cryptographically secure random key.
  - It encrypts the paper under **Galois/Counter Mode (GCM)** with a 12-byte initialization vector (IV) and a 16-byte authentication tag.
  - The resulting file envelope is tagged with the magic bytes `EXV1`.

### 3.2 Shamir's Secret Sharing (3-of-5 Threshold Cryptography)
- **Plain English Analogy**: Suppose a pirate captain has a treasure map. If he gives the full map to one first mate, that mate might kill the others and take the gold. If he cuts the map into 5 pieces like a jigsaw puzzle, losing even 1 piece means the treasure is lost forever. Instead, he uses a mathematical magic spell: he creates 5 unique magical stones. Any single stone looks like meaningless pebbles. Any two stones together still look like meaningless pebbles. But the moment **any three stones** are placed together on an altar, the complete treasure map materializes instantly!
- **The Mathematics**:
  - Invented by cryptographer Adi Shamir in 1979 based on polynomial interpolation.
  - A 2-degree polynomial curve $f(x) = a x^2 + b x + K$ requires exactly 3 points $(x, y)$ to uniquely determine the curve and solve for $K = f(0)$ (the secret key).
  - Knowing only 2 points leaves infinite possible parabolas passing through those points, meaning **zero bits of information** about the secret are leaked.
- **How the Code Uses It**:
  - Uses the audited `shamir-secret-sharing` library operating over Galois Field $GF(2^8)$.
  - 5 shares are generated for each paper (A, B, C). Each of the 5 staff members holds 1 share per paper.
  - The master AES key is wiped from memory (`key.fill(0)`). Only the shares remain.

```
       Polynomial Curve: f(x) = a*x^2 + b*x + SecretKey
       
       y ^
         |                * Share 3 (Staff 3)
         |     * Share 1 (Staff 1)
         |                                * Share 5 (Staff 5)
         |           * Share 2 (Staff 2)
  Secret | * f(0)
     Key +------------------------------------------------> x
           0     1     2     3     4     5
           
   * Any 3 points -> Reconstruct the exact curve -> Recover f(0) (Key)
   * Any 1 or 2 points -> Infinite possible curves -> 0% information leaked!
```

### 3.3 The Commit-Reveal Scheme
- **Plain English Analogy**: Imagine a secret bidding contest. If bidders say their bids out loud, later bidders can cheat based on earlier numbers. Instead, each bidder writes their secret bid on a card, puts it into a tamper-evident wax-sealed envelope, and drops it into a transparent glass lockbox. The deadline passes. Now, everyone opens their envelopes. If someone tries to substitute their card with a different one, the wax seal fingerprint does not match and they are instantly disqualified.
- **Cryptographic Properties**:
  - **Hiding**: A cryptographic hash `keccak256(data)` reveals nothing about `data`.
  - **Binding**: You cannot find another `data'` that produces the exact same hash.
- **How the Code Uses It**:
  - **Before Exam**: Staff upload commitments of their pieces:
    ```solidity
    commitment = keccak256(abi.encode(vaultAddress, staffAddress, paperIndex, pieceBytes));
    ```
  - Including `vaultAddress` prevents replaying commitments across different exam contracts.
  - Including `staffAddress` prevents a malicious official from copying another official's revealed piece.
  - **After Exam**: Staff reveal their actual piece bytes. The contract hashes the submitted bytes on-chain and verifies that it exactly equals the previously recorded commitment.

### 3.4 IPFS (InterPlanetary File System) & CIDs
- **Plain English Analogy**: Traditional web links (like `https://university.edu/papers/paperA.pdf`) are location-based: they tell you *where* to find a file. If the university replaces the file with a corrupted one, the link still works. IPFS is content-based: it identifies a file by *what it contains*—its cryptographic fingerprint (Content Identifier or **CID**). If someone changes even a single period inside the document, the CID completely changes.
- **How the Code Uses It**:
  - Encrypted papers are uploaded either to a local IPFS directory (`frontend/public/ipfs/`) or to Pinata IPFS cloud.
  - The smart contract stores the immutable CID strings (`string[3] public paperCids`).
  - Anyone in the world can download the ciphertext file from IPFS, but it is completely unreadable without the AES key.

### 3.5 Soulbound Access Tokens (ERC-721 + ERC-5192)
- **Plain English Analogy**: A regular NFT (like a Bored Ape) can be sold or sent to anyone on OpenSea. A **Soulbound Token** is like an official government-issued passport or university accreditation badge permanently bound to an institution's identity: it can never be sold, transferred, loaned, or traded.
- **How the Code Uses It**:
  - Implemented in `contracts/CollegeAccessToken.sol` conforming to the **ERC-5192** Minimal Soulbound specification.
  - The `ExamVault` contract mints one token to each accredited examination center (college).
  - Any transfer attempt (`transferFrom`, `safeTransferFrom`, `approve`) unconditionally reverts with custom error `Soulbound()`.
  - When a college logs a download on-chain, the contract checks that `msg.sender` owns the soulbound token.

### 3.6 Keccak-256 Cryptographic Fingerprinting
- **Plain English Analogy**: An unforgeable digital DNA test. You feed any file (1 kilobyte or 1 gigabyte) into the algorithm, and it produces a unique 32-byte (64 hexadecimal character) string.
- **How the Code Uses It**:
  - Stored in `ExamVault._paperHashes`.
  - When colleges download the ciphertext from IPFS, they compute its keccak256 hash locally and verify it against the on-chain value. If an IPFS gateway or malicious proxy tried to serve a modified file, the hash check fails instantly.

### 3.7 Multi-Party Pseudo-Random Paper Selection
- **Plain English Analogy**: How do 5 people roll a fair die without trusting each other? If one person rolls, they could use a weighted die. Instead, all 5 people privately pick a random number, write it down, and seal it in an envelope. Once the exam starts, everyone opens their envelopes. All 5 numbers are mathematically combined (XORed). The final combined number determines whether Paper A, B, or C is picked. Even if 4 of the 5 people are corrupt and colluding, as long as just 1 person picked a truly random number, the outcome is completely unpredictable!
- **How the Code Uses It**:
  - Each staff member generates a random 256-bit seed and commits its hash before exam time.
  - After exam time, staff reveal their seeds. The contract accumulates them:
    ```solidity
    _seedAccumulator ^= seed; // Bitwise XOR of all revealed seeds
    ```
  - Once quorum is reached, `selectPaper()` computes:
    ```solidity
    selectedPaper = uint8(uint256(keccak256(abi.encode(_seedAccumulator))) % PAPER_COUNT);
    ```

### 3.8 Staking & Economic Slashing (Skin in the Game)
- **Plain English Analogy**: When you rent an expensive apartment, you pay a security deposit. If you keep the apartment in good condition, you get your full deposit back. If you smash the windows, the landlord keeps your deposit.
- **How the Code Uses It**:
  - Each staff member must stake at least `minStake` (e.g., 0.5 ETH or 1.0 ETH) before they are allowed to submit commitments.
  - If a staff member fails to reveal their seed during the seed window or fails to reveal their piece during the reveal window, anyone in the public can call `penalise(staff)`.
  - The contract slashes **50% (5,000 basis points)** of their stake. Slashed funds remain locked in the contract forever (`slashedTotal`).

---

## 4. End-to-End System Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                    EXAMINATION CREATION (OFFLINE)                                  |
|                                                                                                    |
|   +-------------------+  +-------------------+  +-------------------+                              |
|   |   Paper A (.md)   |  |   Paper B (.md)   |  |   Paper C (.md)   |   3 Candidate Question       |
|   +---------+---------+  +---------+---------+  +---------+---------+   Papers                     |
|             |                      |                      |                                        |
|             v                      v                      v                                        |
|      [AES-256 Key A]        [AES-256 Key B]        [AES-256 Key C]  3 Independent 256-bit Keys     |
|             |                      |                      |                                        |
|             +----------------------+----------------------+                                        |
|             |                                             |                                        |
|             v (Encrypt into EXV1 Envelope)                v (Split via Shamir Secret Sharing)      |
|   +-------------------+                         +-----------------------------------------------+  |
|   | 3 Ciphertexts     |                         | 5 Key Shares for A, 5 for B, 5 for C          |  |
|   | Uploaded to IPFS  |                         | Distributed to 5 Staff Members (3-of-5 Quorum)|  |
|   +---------+---------+                         +-----------------------+-----------------------+  |
|             |                                                           |                          |
|             | CIDs & Hashes                                             | Private Shares           |
+-------------|-----------------------------------------------------------|--------------------------+
              |                                                           |
              v                                                           v
+----------------------------------------------------------------------------------------------------+
|                                 ETHEREUM SMART CONTRACT (ExamVault.sol)                             |
|                                                                                                    |
|   [Phase 1: Admin Setup]                                                                           |
|   - registerStaff(5 addresses)                                                                     |
|   - registerCollege(colleges) -> mintAccessToken() [Soulbound ERC-721 / ERC-5192]                  |
|   - setExam(examTime, paperHashes[3], paperCids[3])                                                |
|                                                                                                    |
|   [Phase 2: Before Exam Time]                                                                      |
|   - Staff call stake() (>= minStake ETH)                                                           |
|   - Staff call commitPieces(keccak256(vault, staff, paper, piece)[3])                             |
|   - Staff call commitSeed(keccak256(vault, staff, seed))                                           |
|                                                                                                    |
|   [Phase 3: At Exam Time (block.timestamp >= examTime)]                                           |
|   - Staff call revealSeed(seed) -> XOR accumulated                                                |
|   - selectPaper() -> keccak256(_seedAccumulator) % 3 -> (Picks Paper A, B, or C)                   |
|                                                                                                    |
|   [Phase 4: Reveal Window (within 10 minutes)]                                                     |
|   - Staff call revealPiece(piece) for the SELECTED paper only                                      |
|   - 3rd valid piece emitted -> PaperUnlocked event fired!                                          |
|                                                                                                    |
|   [Phase 5: Post-Exam Resolution]                                                                  |
|   - Honest staff call withdrawStake() -> Stake refunded                                           |
|   - Anyone calls penalise(delinquentStaff) -> 50% Stake Slashed & Locked Forever                   |
+----------------------------------------------------------------------------------------------------+
              |                                                           |
              | Verified Revealed Shares & CIDs                           | Soulbound Download Log
              v                                                           v
+----------------------------------------------------------------------------------------------------+
|                                 COLLEGE EXAM CENTER (DECRYPTION CLIENT)                            |
|                                                                                                    |
|   1. College checks Soulbound Token ID via Web3 wallet.                                            |
|   2. Calls logDownload() on-chain -> Immutable timestamp logged.                                   |
|   3. Fetches encrypted ciphertext from IPFS using CID.                                             |
|   4. Computes keccak256(ciphertext) -> Confirms exact match with on-chain paperHash.               |
|   5. Reads 3 revealed Shamir pieces from contract via getRevealedPieces().                         |
|   6. Reconstructs AES-256 key: combineKey([share1, share2, share3]).                               |
|   7. Decrypts EXV1 envelope client-side -> Prints / displays official question paper to students!  |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. The Complete Exam Lifecycle (Step-by-Step Flow)

### Phase 1: Genesis Deployment & Authority Registration
1. **Deploy Contract**: The university administrator deploys `ExamVault.sol`, configuring:
   - `minStake`: Minimum deposit required from each official (e.g., `0.5 ether`).
   - `seedWindow`: Window after exam time to reveal random seeds (e.g., `120 seconds`).
   - `revealWindow`: Window after paper selection to reveal key shares (e.g., `600 seconds` / 10 minutes).
   - Internally, `ExamVault` automatically deploys an instance of `CollegeAccessToken.sol`.
2. **Register Staff**: The admin registers exactly 5 staff wallet addresses via `registerStaff()`. Each is assigned an index $1 \dots 5$.
3. **Register Colleges & Mint Tokens**: The admin registers authorized college examination centers via `registerCollege()` and calls `mintAccessToken(collegeAddress)` to grant each college its non-transferable Soulbound credential.

### Phase 2: Paper Preparation & Key Splitting (Offline)
1. The paper setter authors 3 distinct question papers (`paper-A.md`, `paper-B.md`, `paper-C.md`) with equal difficulty.
2. The setter executes `node scripts/prepare-papers.mjs`:
   - Generates three 32-byte AES keys ($K_A, K_B, K_C$).
   - Encrypts each paper into an `EXV1` binary envelope.
   - Computes `keccak256` fingerprints of the 3 encrypted files.
   - Uploads ciphertexts to IPFS and captures their CIDs.
   - Splits each key into 5 Shamir shares with threshold 3.
   - Wipes master keys $K_A, K_B, K_C$ from RAM.
   - Generates private files `demo-data/secrets/staff-1.json` through `staff-5.json`.

### Phase 3: Vault Locking & Staff Staking
1. **Set Exam**: Admin calls `setExam(examTime, paperHashes, paperCids)`. This can only be called **once**. From this second onward, exam parameters are permanently frozen.
2. **Staff Deposit Stake**: Each staff member calls `stake{value: 1 ether}()`.
3. **Staff Commit Hashes**:
   - Each staff member calls `commitPieces([commitA, commitB, commitC])`.
   - Each staff member calls `commitSeed(seedCommit)`.
   - All commits must complete before `examTime`.

### Phase 4: Exam Time & Unbiased Random Selection
1. At `block.timestamp >= examTime`:
   - Staff reveal their secret random seeds via `revealSeed(seed)`.
   - The contract verifies that `seedCommitment(vault, staff, seed) == s.seedCommit`.
   - Each valid seed is XORed into `_seedAccumulator`.
2. **Paper Selection Trigger**:
   - Once all committed seeds are revealed (or when `seedWindow` expires with at least 3 seeds revealed), anyone calls `selectPaper()`.
   - The contract hashes the accumulator and picks:
     ```solidity
     selectedPaper = uint8(uint256(keccak256(abi.encode(_seedAccumulator))) % PAPER_COUNT);
     ```
   - `PaperSelected(paperIndex, timestamp)` event is broadcast across the network.

### Phase 5: Quorum Unlocking (10-Minute Reveal Window)
1. Staff now know which paper was selected (e.g., Paper B).
2. Within `revealWindow` (10 minutes), each staff member calls `revealPiece(pieceForSelectedPaper)`.
3. The contract verifies that `pieceCommitment(...) == s.pieceCommits[selectedPaper]`.
4. As soon as the 3rd staff member reveals their piece, the contract emits `PaperUnlocked(selectedPaper, block.timestamp)`.

### Phase 6: College Download & Client-Side Decryption
1. An exam superintendent at an authorized college connects their wallet to the College Portal.
2. The portal checks for the Soulbound NFT.
3. The college submits `logDownload()` on-chain.
4. The browser fetches the encrypted file from IPFS.
5. The browser verifies `keccak256(downloadedBytes) == onChainHash`.
6. The browser calls `getRevealedPieces()` on the contract to obtain the 3 public shares.
7. The browser calls `combineKey(shares)` to reconstruct the 32-byte AES key.
8. The browser calls `decryptPaper(ciphertext, key)` and displays the decrypted exam paper.

### Phase 7: Post-Exam Slashing & Stake Return
1. Once duty windows expire (`dutiesOver() == true`):
   - Honest staff who fulfilled both duties call `withdrawStake()` and receive their full 1.0 ETH deposit.
   - Any staff member who failed to reveal their seed or piece is penalized. Anyone can trigger `penalise(delinquentStaff)`.
   - 50% of the delinquent staff member's deposit is slashed and permanently locked in the contract.

---

## 6. Smart Contracts In-Depth Reference

### 6.1 `ExamVault.sol`

#### Configuration Constants
| Name | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `STAFF_COUNT` | `uint8` | `5` | Exactly 5 staff officials participate in the quorum. |
| `THRESHOLD` | `uint8` | `3` | Minimum number of shares required to reconstruct the key. |
| `PAPER_COUNT` | `uint8` | `3` | Exactly 3 candidate papers (0 = A, 1 = B, 2 = C). |
| `PENALTY_BPS` | `uint16` | `5000` | Penalty in basis points (5000 bps = 50.00% of deposit). |

#### Immutable State Variables
| Name | Type | Description |
| :--- | :--- | :--- |
| `admin` | `address` | Address of the contract deployer (university authority). |
| `minStake` | `uint256` | Minimum wei required for staff to participate (e.g., 0.5 ETH). |
| `seedWindow` | `uint64` | Duration in seconds after `examTime` to reveal seeds (e.g., 120s). |
| `revealWindow` | `uint64` | Duration in seconds after paper selection to reveal key shares (e.g., 600s). |
| `accessToken` | `CollegeAccessToken` | Contract address of the Soulbound access token NFT. |

#### Storage State Variables
| Name | Type | Description |
| :--- | :--- | :--- |
| `_staffList` | `address[]` | Array of registered staff addresses in order of registration. |
| `_staff` | `mapping(address => Staff)` | Struct containing staff registration, index, stake, and commitments. |
| `_collegeList` | `address[]` | Array of registered college addresses. |
| `_colleges` | `mapping(address => College)` | Struct containing college registration status, token ID, and name. |
| `examTime` | `uint64` | Unix timestamp when the exam starts (0 indicates not yet set). |
| `_paperHashes` | `bytes32[3]` | Keccak-256 cryptographic hashes of ciphertexts A, B, and C. |
| `_paperCids` | `string[3]` | IPFS content identifiers (CIDs) of ciphertexts A, B, and C. |
| `seedsCommitted` | `uint8` | Count of staff members who committed random seeds. |
| `seedsRevealed` | `uint8` | Count of staff members who successfully revealed their seed. |
| `_seedAccumulator`| `uint256` | Running bitwise XOR of all revealed seeds. |
| `paperSelected` | `bool` | True once `selectPaper()` has executed. |
| `selectedPaper` | `uint8` | Index (0, 1, or 2) of the chosen question paper. |
| `selectedAt` | `uint64` | Unix timestamp when `selectPaper()` executed. |
| `piecesRevealed` | `uint8` | Count of staff who revealed valid shares for the chosen paper. |
| `_revealedPiece` | `mapping(address => bytes)` | Stores the revealed Shamir share bytes for each staff address. |
| `postponed` | `bool` | True if quorum failed and the exam was formally aborted. |
| `slashedTotal` | `uint256` | Total wei slashed from negligent staff, locked permanently. |
| `_downloads` | `Download[]` | Audit log of college download events. |

#### Core Functions

##### 1. `registerStaff(address staff)`
- **Access**: `onlyAdmin`, `beforeExamSet`
- **Purpose**: Registers an official as one of the 5 keyholders.
- **Validations**: Reverts if address is zero, address is admin, address is already registered, or 5 staff are already registered.

##### 2. `registerCollege(address college, string calldata name)`
- **Access**: `onlyAdmin`, `beforeExamSet`
- **Purpose**: Registers an examination center institution by name and wallet address.

##### 3. `setExam(uint64 time, bytes32[3] calldata paperHashes, string[3] calldata paperCids)`
- **Access**: `onlyAdmin`, `beforeExamSet`
- **Purpose**: Immutably commits the exam timestamp and the fingerprints/CIDs of the 3 candidate papers.
- **Validations**: Requires exactly 5 registered staff, `time > block.timestamp`, non-zero hashes, and non-empty CIDs.

##### 4. `mintAccessToken(address college)`
- **Access**: `onlyAdmin`
- **Purpose**: Mints the non-transferable Soulbound NFT to a registered college.

##### 5. `stake()`
- **Access**: `onlyStaff`, `payable`
- **Purpose**: Staff deposit collateral prior to the exam time.
- **Validations**: `msg.value > 0`, `block.timestamp < examTime`.

##### 6. `commitPieces(bytes32[3] calldata commits)`
- **Access**: `onlyStaff`
- **Purpose**: Staff commit hashes of their 3 key pieces ($A, B, C$).
- **Validations**: `examTime != 0`, `block.timestamp < examTime`, `stake >= minStake`, not already committed.

##### 7. `commitSeed(bytes32 commit)`
- **Access**: `onlyStaff`
- **Purpose**: Staff commit the hash of their secret 256-bit random seed.
- **Validations**: `examTime != 0`, `block.timestamp < examTime`, `stake >= minStake`, not already committed.

##### 8. `revealSeed(uint256 seed)`
- **Access**: `onlyStaff`, `notPostponed`
- **Purpose**: Reveals the secret random seed during the seed window.
- **Timing**: `examTime <= block.timestamp < examTime + seedWindow`.
- **Validations**: Reverts if paper already selected, not committed, already revealed, or `seedCommitment(vault, staff, seed) != s.seedCommit`.
- **Mechanics**: XORs the seed into `_seedAccumulator ^= seed` and increments `seedsRevealed`.

##### 9. `selectPaper()`
- **Access**: Public (callable by anyone), `notPostponed`
- **Purpose**: Deterministically computes the selected paper using the accumulated seed entropy.
- **Timing**: Can be called immediately if all committed seeds have been revealed (`seedsRevealed == seedsCommitted`), OR after `seedWindow` expires if at least `THRESHOLD` (3) seeds were revealed.
- **Formula**: `selectedPaper = uint8(uint256(keccak256(abi.encode(_seedAccumulator))) % PAPER_COUNT)`.

##### 10. `revealPiece(bytes calldata piece)`
- **Access**: `onlyStaff`, `notPostponed`
- **Purpose**: Submits the Shamir share for the *chosen* paper only.
- **Timing**: `selectedAt <= block.timestamp < selectedAt + revealWindow`.
- **Validations**: Reverts if paper not yet selected, window closed, not committed, already revealed, or `pieceCommitment(vault, staff, selectedPaper, piece) != s.pieceCommits[selectedPaper]`.
- **Mechanics**: Increments `piecesRevealed`. When `piecesRevealed == THRESHOLD`, emits `PaperUnlocked`.

##### 11. `logDownload()`
- **Access**: Public (called by college wallet)
- **Purpose**: Logs an immutable on-chain record that an authorized college accessed the paper.
- **Validations**: Reverts if caller has no token, caller does not own the token, or the paper is not yet unlocked (`!isUnlocked()`).

##### 12. `penalise(address staff)`
- **Access**: Public (callable by any bounty hunter or student)
- **Purpose**: Slashes 50% of the stake of any staff member who skipped their seed or piece duties.
- **Timing**: Callable only after duties have ended (`dutiesOver() == true`).

##### 13. `withdrawStake()`
- **Access**: `onlyStaff`
- **Purpose**: Allows staff to retrieve their collateral after the exam. If the staff member missed a duty, the 50% penalty is slashed automatically before sending the remainder.

##### 14. `postpone()`
- **Access**: Public, `notPostponed`
- **Purpose**: Formally marks the exam as aborted if fewer than 3 seeds or fewer than 3 pieces were submitted before duty windows closed.

---

### 6.2 `CollegeAccessToken.sol`

`CollegeAccessToken` is an ERC-721 token that strictly implements the **ERC-5192 Minimal Soulbound NFTs** standard.

#### Key Mechanics:
1. **Vault Ownership**: The contract is owned by the deploying `ExamVault`. Only the vault can invoke `mint(address to)`.
2. **Transfer Locking**: In OpenZeppelin v5, all token transfers, mints, and burns route through the internal `_update` function:
   ```solidity
   function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
       if (_ownerOf(tokenId) != address(0)) revert Soulbound();
       return super._update(to, tokenId, auth);
   }
   ```
   If the token already has an owner (`_ownerOf(tokenId) != address(0)`), any transfer or burn attempt reverts with `Soulbound()`. Only fresh mints (`from == address(0)`) are allowed.
3. **Approval Rejection**: `approve()` and `setApprovalForAll()` unconditionally revert with `Soulbound()`, ensuring tokens cannot be escrowed on secondary marketplaces.
4. **Interface Support**: Implements `supportsInterface(0xb45a3c0e)` for ERC-5192 standard detection.

---

### 6.3 Complete Error Reference Table

The contracts utilize gas-efficient Solidity custom errors rather than verbose error strings:

| Error Name | Contract | Trigger Condition |
| :--- | :--- | :--- |
| `NotAdmin()` | `ExamVault` | Caller is not the registered admin address. |
| `NotStaff()` | `ExamVault` | Caller is not a registered staff address. |
| `NotCollege()` | `ExamVault` | Target address is not a registered college. |
| `ExamAlreadySet()` | `ExamVault` | Attempted to call setup functions after `setExam()` has run. |
| `ExamNotSet()` | `ExamVault` | Attempted an operation before `setExam()` was configured. |
| `TooManyStaff()` | `ExamVault` | Attempted to register more than 5 staff. |
| `NotEnoughStaff()` | `ExamVault` | Attempted to call `setExam()` before 5 staff were registered. |
| `AlreadyRegistered()` | `ExamVault` | Address was previously registered as staff or college. |
| `InvalidAddress()` | `ExamVault` | Address is `address(0)` or matches the admin address. |
| `TimeNotInFuture()` | `ExamVault` | `examTime <= block.timestamp`. |
| `InvalidPaper()` | `ExamVault` | Paper hash is `bytes32(0)` or IPFS CID string is empty. |
| `StakeTooLow()` | `ExamVault` | Staff member's stake deposit is less than `minStake`. |
| `ZeroDeposit()` | `ExamVault` | Staff member called `stake()` with 0 wei value. |
| `AlreadyCommitted()` | `ExamVault` | Staff member attempted to submit commitments twice. |
| `TooLate()` | `ExamVault` | Attempted to stake or commit after `examTime`. |
| `TooEarly()` | `ExamVault` | Attempted an action before the prerequisite timestamp was reached. |
| `NotCommitted()` | `ExamVault` | Staff attempted to reveal a seed or piece without committing first. |
| `AlreadyRevealed()` | `ExamVault` | Staff attempted to reveal their seed or piece a second time. |
| `HashMismatch()` | `ExamVault` | Revealed seed or piece does not match the stored commitment hash. |
| `NotEnoughSeeds()` | `ExamVault` | `selectPaper()` called with fewer than 3 revealed seeds. |
| `AlreadySelected()` | `ExamVault` | `selectPaper()` called when a paper is already selected. |
| `NotSelected()` | `ExamVault` | Staff called `revealPiece()` before `selectPaper()` completed. |
| `WindowClosed()` | `ExamVault` | Attempted to reveal seed or piece after the respective window elapsed. |
| `HasToken()` | `ExamVault` | Admin attempted to mint a token to a college that already has one. |
| `NoToken()` | `ExamVault` | College attempted `logDownload()` without owning a Soulbound token. |
| `PaperLocked()` | `ExamVault` | College attempted `logDownload()` before quorum unlocked the paper. |
| `ExamPostponedErr()`| `ExamVault` | Operation attempted after the exam was postponed. |
| `NothingToPenalise()`| `ExamVault`| Target staff member fulfilled all duties or was already slashed. |
| `DutiesNotOver()` | `ExamVault` | Attempted to penalize or withdraw before duty windows expired. |
| `AlreadyWithdrawn()`| `ExamVault` | Staff attempted to withdraw stake twice. |
| `TransferFailed()` | `ExamVault` | ETH refund transfer to staff wallet failed. |
| `Soulbound()` | `CollegeAccessToken` | Attempted to transfer, burn, or approve a soulbound access NFT. |

---

## 7. Shared Cryptography Library (`shared/vaultCrypto.mjs`)

### 7.1 Dual-Environment WebCrypto Architecture
To guarantee that identical cryptographic operations run seamlessly in both **Node.js** (backend scripts, tests) and **modern web browsers** (Vite frontend), `vaultCrypto.mjs` is built exclusively on top of standard W3C WebCrypto (`globalThis.crypto.subtle`). It avoids environment-specific Node `crypto` modules.

### 7.2 `EXV1` Binary Envelope Specification
When question papers are encrypted, they are packed into an authenticated binary structure:

```
+-----------------------------------------------------------------------------------------+
|                                EXV1 BINARY ENVELOPE FORMAT                               |
+-------------------+--------------------+------------------------------------------------+
| Magic Bytes (4B)  | IV Vector (12B)    | AES-256-GCM Ciphertext Payload                 |
| 0x45 0x58 0x56 0x31 | Random Salt Vector | + 16-byte Authentication Tag Tagged at End     |
| ("EXV1")          |                    |                                                |
+-------------------+--------------------+------------------------------------------------+
                                         |
                                         v Decrypted Inner Payload Format
                    +--------------------+-------------------------+----------------------+
                    | Filename Len (2B)  | UTF-8 Filename Bytes    | Raw Paper Content    |
                    | Big-Endian uint16  | (e.g. "paper-A.md")     | (e.g. Markdown text) |
                    +--------------------+-------------------------+----------------------+
```

- **Magic Prefix (`EXV1`)**: Allows any client to instantly confirm whether a file is an official encrypted vault paper.
- **Filename preservation**: The original filename and extension are encrypted *inside* the payload, preventing metadata leakage while ensuring the college client restores the exact file upon decryption.

### 7.3 Exported Functions Reference

#### `generateKey()`
- **Output**: `Promise<Uint8Array>` (32 cryptographically random bytes).

#### `encryptPaper(plainBytes, fileName, key)`
- **Inputs**: File byte array, original filename string, 32-byte AES key.
- **Output**: `Promise<Uint8Array>` (`EXV1` binary envelope).

#### `decryptPaper(encBytes, key)`
- **Inputs**: `EXV1` binary envelope, 32-byte AES key.
- **Output**: `Promise<{ fileName: string, bytes: Uint8Array }>`
- **Behavior**: Verifies magic bytes, extracts IV, decrypts and validates GCM authentication tag. Throws descriptive error if tampered with or if incorrect key is used.

#### `splitKey(key, shares = 5, threshold = 3)`
- **Inputs**: 32-byte AES key, total share count, threshold count.
- **Output**: `Promise<Uint8Array[]>` (Array of 5 byte arrays, each 33 bytes in size).

#### `combineKey(shares)`
- **Inputs**: Array of at least 2 shares (Uint8Array or hex strings).
- **Output**: `Promise<Uint8Array>` (Reconstructed 32-byte AES key).

#### `paperHash(encBytes)`
- **Output**: `0x`-prefixed 64-hex-character `keccak256` string of the ciphertext.

#### `seedCommitment(vault, staff, seed)`
- **Output**: `keccak256(abi.encode(["address", "address", "uint256"], [vault, staff, seed]))`.

#### `pieceCommitment(vault, staff, paper, piece)`
- **Output**: `keccak256(abi.encode(["address", "address", "uint8", "bytes"], [vault, staff, paper, piece]))`.

#### `cidForBytes(bytes)`
- **Output**: Computes IPFS `CIDv1` using raw binary codec (`0x55`) and SHA2-256 multihash. Matches the exact CID generated by `ipfs add --cid-version=1 --raw-leaves`.

---

## 8. Scripts & CLI Automation Suite

### 8.1 `scripts/prepare-papers.mjs`
Used by the exam setter to encrypt candidate papers and partition keys.
- **Usage**:
  ```bash
  node scripts/prepare-papers.mjs [--papers a,b,c] [--staff 0x..,0x..(5)] [--out demo-data] [--ipfs local|pinata]
  ```
- **Execution Flow**:
  1. Reads three markdown papers from `papers/paper-[A,B,C].md`.
  2. Generates three distinct 256-bit AES keys.
  3. Encrypts each paper into an `EXV1` envelope.
  4. Uploads ciphertext to `frontend/public/ipfs/` (local) or Pinata cloud (if `PINATA_JWT` is set).
  5. Partitions keys into 5 Shamir shares each.
  6. **Zeroizes master keys**: Invokes `key.fill(0)` and sets pointer to null.
  7. Writes public metadata to `demo-data/papers.json` and private staff credentials to `demo-data/secrets/staff-1..5.json`.

### 8.2 `scripts/demo-setup.mjs`
Automates the complete pre-exam setup on a local Hardhat blockchain node.
- **Usage**:
  ```bash
  npm run demo:setup           # Standard setup with auto-commit
  npm run demo:setup -- --no-commit # Setup without commits (allows committing from UI)
  ```
- **Execution Flow**:
  - Connects to local JSON-RPC node (`127.0.0.1:8545`).
  - Deploys `ExamVault` and linked `CollegeAccessToken`.
  - Registers accounts 1 through 5 as staff.
  - Registers accounts 6 and 7 as colleges; mints Soulbound token to account 6.
  - Executes `preparePapers()`.
  - Sets exam time to `now + 120 seconds`.
  - Deposits 1.0 ETH stake from each of the 5 staff wallets.
  - Submits piece commitments and seed commitments for all 5 staff.
  - Updates `frontend/src/deployment.json` with contract addresses and timestamps.

### 8.3 `scripts/demo-reveal.mjs`
Simulates exam day operations from seed reveal through decryption and slashing.
- **Usage**:
  ```bash
  npm run demo:reveal                                  # Waits for real exam time
  npm run demo:reveal -- --fast --penalise --download  # Instant demonstration
  ```
- **Flags**:
  - `--fast`: Uses Hardhat EVM mining RPC calls (`evm_increaseTime`, `evm_mine`) to skip clock wait times.
  - `--staff 1,2,3`: Specifies which staff members reveal their shares (default: staff 1, 2, 3; leaving staff 4 and 5 delinquent).
  - `--download`: Impersonates College 6 (token holder) to log download, verify hash, combine shares, and decrypt paper; also demonstrates College 7 (no token) being rejected.
  - `--penalise`: Waits for duty window expiration and triggers `penalise()` on staff 4 and 5, slashing 0.5 ETH each.

### 8.4 `scripts/deploy.cjs`
Lightweight deployer for public Ethereum testnets (e.g., Sepolia).
- Reads `MIN_STAKE`, `SEED_WINDOW`, and `REVEAL_WINDOW` from `.env`.
- Uses `DEPLOYER_PRIVATE_KEY` and `SEPOLIA_RPC_URL`.
- Outputs deployed addresses for verification on Etherscan.

### 8.5 `scripts/verify-hash.mjs`
Standalone command-line cryptographic verification tool.
- **Usage**:
  ```bash
  node scripts/verify-hash.mjs <encryptedFile> <expected0xHash>
  node scripts/verify-hash.mjs --cid <cid> <expected0xHash>
  ```
- Computes `keccak256` of target file and exits with code `0` on match or `1` on mismatch.

---

## 9. Frontend Web Application Architecture

### 9.1 Architecture & State Flow
The user interface is built as a single-page application using **React 19**, **Vite**, and **ethers.js v6**.
- **Global Web3 State (`src/lib/wallet.jsx`)**: Context provider managing wallet connections, chain ID detection, balance tracking, and transaction status modals.
- **Real-Time Polling (`src/lib/chain.js`)**: Periodically queries the contract state (current phase, stake status, seed reveals, quorum counter, unlocked state).

```
                      +-----------------------------+
                      |         React Portal        |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                       |                       |
             v                       v                       v
     +---------------+       +---------------+       +---------------+
     | Admin Portal  |       | Staff Portal  |       | College Portal|
     |  (Deployer)   |       |  (Officials)  |       |  (Exam Center)|
     +-------+-------+       +-------+-------+       +-------+-------+
             |                       |                       |
             +-----------------------+-----------------------+
                                     | ethers.js v6
                                     v
                       +---------------------------+
                       |   Ethereum Node / Vault   |
                       +---------------------------+
```

### 9.2 User Screens

#### 1. Genesis Setup (`screens/GenesisSetup.jsx`)
- Initial onboarding wizard for deploying fresh instances on testnets.
- Configures minimum stake, window durations, and registers initial staff keys.

#### 2. Admin Dashboard (`screens/Admin.jsx`)
- Displays real-time contract parameters, total staked ETH, and current exam phase.
- Allows registering staff, registering colleges, minting soulbound tokens, and calling `setExam()`.

#### 3. Staff Portal (`screens/Staff.jsx`)
- Authenticates the connected wallet against `_staff[address]`.
- Displays staff index ($1 \dots 5$), staking balance, and commitment status.
- Provides one-click action buttons to deposit stake, commit pieces/seeds, reveal seed at exam time, and submit Shamir shares during the reveal window.

#### 4. College Portal (`screens/College.jsx`)
- Checks connected wallet for `CollegeAccessToken`.
- Displays live countdown to exam time.
- Once unlocked: provides a single-click button to call `logDownload()`, fetch ciphertext from IPFS, verify hash, reconstruct AES key from on-chain shares, and render the decrypted paper on screen.

### 9.3 Reusable Visual Components
- **`QuorumVisualizer.jsx`**: Renders 5 animated interactive circles representing the 5 keyholders. Displays real-time visual badges for:
  - Yellow: Staked & Committed.
  - Blue: Seed Revealed.
  - Green: Piece Revealed (Quorum Reached).
  - Red: Slashed / Delinquent.
- **`Header.jsx`**: Global navbar with network indicator, wallet connection button, and contract address badge.
- **`PaperVaultSection.jsx`**: Displays cards for Candidate Papers A, B, and C with on-chain hashes and IPFS CIDs.
- **`BlockchainVisuals.jsx`**: Visual status blocks illustrating block height, contract balance, and slashed funds.
- **`TransactionModal.jsx`**: Clean popup showing pending wallet approvals, hash links, and confirmation states.

---

## 10. Testing Suite & Quality Assurance

The codebase includes an exhaustive test suite executed via Hardhat and Mocha/Chai.

```
Total Test Cases: 89 Passing (0 Failing)
- Smart Contract Suite (test/ExamVault.test.cjs): 72 Tests
- Cryptography Suite (test/crypto.test.cjs):       17 Tests
```

### Key Behaviors Validated in `ExamVault.test.cjs`:
- ✅ Deployer is admin; non-admins cannot invoke admin functions (`NotAdmin`).
- ✅ Registering duplicate staff, invalid addresses, or exceeding 5 staff reverts.
- ✅ `setExam()` cannot be called before 5 staff are registered or with non-future timestamps.
- ✅ `setExam()` cannot be called a second time (`ExamAlreadySet`).
- ✅ Staff cannot stake 0 ETH or stake after `examTime`.
- ✅ Commitments cannot be submitted without meeting `minStake`.
- ✅ Seeds and pieces cannot be revealed prior to `examTime` (`TooEarly`).
- ✅ Submitting a modified seed or modified piece reverts with `HashMismatch`.
- ✅ Submitting a duplicate reveal reverts with `AlreadyRevealed`.
- ✅ `selectPaper()` correctly accumulates XOR entropy and computes deterministic modulo.
- ✅ Exactly 3 valid revealed pieces emits `PaperUnlocked`.
- ✅ Colleges without Soulbound tokens cannot call `logDownload()` (`NoToken`).
- ✅ Colleges cannot call `logDownload()` before quorum is met (`PaperLocked`).
- ✅ Delinquent staff are slashed by exactly 50% (`5000 bps`) when `penalise()` is called.
- ✅ Postponement works as expected if quorum fails.

### Key Behaviors Validated in `crypto.test.cjs`:
- ✅ AES-256-GCM encryption roundtrips files correctly preserving original filenames.
- ✅ GCM authentication fails if ciphertext or tag is modified by even 1 byte.
- ✅ All 10 unique 3-share combinations from a 5-share split successfully reconstruct the key: `C(5, 3) = 5! / (3! * 2!) = 10 combinations`.
- ✅ Any 2 shares fail to reconstruct the key.
- ✅ Off-chain `seedCommitment()` and `pieceCommitment()` produce the exact same hashes as Solidity's `abi.encode` implementation.
- ✅ Local IPFS CID calculation matches standard IPFS v1 raw sha2-256 leaves.

---

## 11. Security Analysis & Threat Matrix

| Threat / Attack Vector | Severity | Mitigation in Architecture |
| :--- | :---: | :--- |
| **Admin leaks paper early** | Critical | **Mitigated**: Admin never receives encryption keys or key shares. The contract rejects reveal transactions before `examTime`. `setExam()` is one-time only. |
| **Staff collude early (1 or 2 staff)** | High | **Mitigated**: Shamir threshold is 3. Two shares leak zero mathematical information about the key. |
| **Malicious official submits fake share** | High | **Mitigated**: Commit-reveal pattern. The contract checks `keccak256(piece)` against the pre-committed hash. A fake share reverts with `HashMismatch`. |
| **Replaying another official's share** | Medium | **Mitigated**: Commitment formulas explicitly bind both `address(vault)` and `msg.sender`. A copied share yields a hash mismatch. |
| **Ciphertext swapped on IPFS server** | Critical | **Mitigated**: On-chain keccak256 hash is immutable. Client checks `keccak256(downloadedBytes) == onChainHash` and GCM tag verifies ciphertext integrity. |
| **Unaccredited party downloads paper** | Medium | **Mitigated**: `logDownload()` strictly requires ownership of an un-transferable Soulbound NFT (ERC-5192). |
| **Selling / transferring college access** | High | **Mitigated**: `CollegeAccessToken` reverts on all transfer and approval calls (`Soulbound()`). |
| **Staff no-show / refusal to reveal** | Medium | **Mitigated**: Economic staking. Delinquent staff are slashed 50% of their deposit, and quorum requires only 3 of 5 staff. |
| **Last-revealer seed withholding bias** | Low | **Mitigated**: `selectPaper()` waits for the full seed window if not all seeds are in; withholding a seed triggers 50% slashing penalty; all 3 candidate papers are created to equal quality standards. |
| **Decryption key leaked from blockchain**| High | **Mitigated**: The master AES key is never transmitted or stored on-chain. Only individual shares are revealed after the exam starts. |

---

## 12. Known Limitations & Future Roadmap

### Current Limitations:
1. **Public Post-Exam Shares**: Once 3 shares are posted on the public blockchain, anyone with an Ethereum node can reconstruct the key. While the exam has already begun at this point, colleges are the intended recipients.
2. **Pre-Upload Setter Leak**: If the human paper setter leaks the questions prior to running the encryption script, no blockchain can prevent that human failure.
3. **Demo Seed Simplification**: In the test script `prepare-papers.mjs`, seeds are generated together for demonstration convenience. In production, each official generates their seed in their own local browser.
4. **Block Timestamp Drift**: Ethereum block timestamps can vary by up to 12-15 seconds. Reveal windows are set to minutes (e.g., 2 to 10 minutes) to absorb this variance.

### Future Roadmap:
- **Chainlink VRF Integration**: Replace multi-party XOR seed accumulation with a provably fair Chainlink Verifiable Random Function (VRF) oracle on Sepolia.
- **Asymmetric College Encryption**: Encrypt the 3 Shamir shares with the public keys of each accredited college, so only college private keys can reconstruct the master key even after reveal.
- **Penalty Redistribution**: Automatically distribute slashed collateral to honest staff members as a bonus rather than locking it permanently in the contract.
- **Zero-Knowledge Proofs (zk-SNARKs)**: Allow staff to prove they possess a valid Shamir share without revealing the raw bytes on-chain.

---

## 13. Step-by-Step Setup & How-to-Run Guide

### Prerequisites
- **Node.js**: Version 20.0.0 or higher.
- **npm**: Version 9.0.0 or higher.
- **Operating System**: Linux (Ubuntu recommended), macOS, or Windows WSL2.

### Step 1: Install Dependencies
```bash
cd /home/rinolj/Desktop/Blockchain-pro
npm install
```

### Step 2: Compile Smart Contracts
```bash
npm run compile
```
*Compiles `ExamVault.sol` and `CollegeAccessToken.sol` via Hardhat and builds JSON artifacts.*

### Step 3: Run Full Automated Test Suite
```bash
npm test
```
*Executes all 89 test cases across contract and cryptography suites.*

### Step 4: Run the Complete Local Demo (Terminal Walkthrough)

Open **two terminal windows**:

#### Terminal 1: Start Local Hardhat Blockchain
```bash
npm run node
```
*Starts a standalone Ethereum JSON-RPC node on `127.0.0.1:8545` with 20 pre-funded test accounts.*

#### Terminal 2: Run Setup & Exam Day Simulation
First, run the automated setup:
```bash
npm run demo:setup
```
*Deploys contracts, registers staff and colleges, encrypts papers, deposits 1 ETH stakes, and posts commitments.*

Next, simulate exam day with instant clock jump and college download:
```bash
npm run demo:reveal -- --fast --penalise --download
```
*Jumps chain time, reveals seeds, selects paper, reveals 3 key pieces, executes college download and local decryption, and slashes delinquent staff 4 and 5.*

### Step 5: Launch the React Web Portal
```bash
npm run dev
```
Open your browser to `http://localhost:5173`.
- Navigate between **Admin**, **Staff**, and **College** portals.
- Connect with MetaMask or imported Hardhat test accounts.

---

## 14. Complete Project File Tree

```
Blockchain-pro/
├── contracts/
│   ├── ExamVault.sol            # Main time-lock and threshold vault contract (459 lines)
│   └── CollegeAccessToken.sol   # Soulbound ERC-721 / ERC-5192 access token (55 lines)
├── shared/
│   └── vaultCrypto.mjs          # Universal WebCrypto AES, Shamir, hash & CID engine (167 lines)
├── scripts/
│   ├── prepare-papers.mjs       # Offline paper encryption and Shamir key splitter (198 lines)
│   ├── demo-setup.mjs           # Local blockchain orchestrator for pre-exam setup (329 lines)
│   ├── demo-reveal.mjs          # Exam day reveal, unlock, download, and slashing runner (360 lines)
│   ├── deploy.cjs               # Testnet (Sepolia) deployment script (34 lines)
│   ├── verify-hash.mjs          # CLI fingerprint verification utility (42 lines)
│   └── d-env.cjs                # Environment helper script
├── papers/
│   ├── paper-A.md               # Candidate Question Paper A (Data Structures)
│   ├── paper-B.md               # Candidate Question Paper B (Data Structures)
│   └── paper-C.md               # Candidate Question Paper C (Data Structures)
├── test/
│   ├── ExamVault.test.cjs       # 72 Hardhat smart contract unit and integration tests
│   └── crypto.test.cjs          # 17 cryptographic and CLI unit tests
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Admin.jsx        # Admin dashboard for registering and monitoring
│   │   │   ├── Staff.jsx        # Staff portal for staking, committing, and revealing
│   │   │   ├── College.jsx      # College portal for verification, download, and decryption
│   │   │   └── GenesisSetup.jsx # Wizard for deploying new vaults
│   │   ├── components/
│   │   │   ├── Header.jsx       # Global navigation bar
│   │   │   ├── QuorumVisualizer.jsx # Interactive 3-of-5 threshold circles
│   │   │   ├── PaperVaultSection.jsx # Candidate paper cards
│   │   │   ├── BlockchainVisuals.jsx# Status indicators and metrics
│   │   │   └── TransactionModal.jsx # Web3 transaction prompt modal
│   │   ├── lib/
│   │   │   ├── chain.js         # Contract interaction and polling logic
│   │   │   ├── crypto.js        # Re-export of shared vaultCrypto for browser
│   │   │   └── wallet.jsx       # Web3 wallet connection context provider
│   │   ├── App.jsx              # Main React router and layout
│   │   └── deployment.json      # Deployed contract addresses and live configuration
│   ├── public/
│   │   └── ipfs/                # Local mock IPFS directory for ciphertexts
│   └── index.html               # Main frontend entry HTML
├── docs/
│   └── REPORT.md                # Academic project report and gas benchmarks
├── hardhat.config.cjs           # Hardhat configuration (Solidity 0.8.28, networks)
├── package.json                 # Project dependencies and script shortcuts
├── .env.example                 # Template for RPC URLs, private keys, and parameters
└── EXPLANATION.md               # (This document) Definitive technical reference
```

---

## 15. Comprehensive Technical Glossary

- **AES-256-GCM**: Advanced Encryption Standard with a 256-bit key operating in Galois/Counter Mode. Provides symmetric encryption with authenticated data integrity.
- **Basis Points (bps)**: A unit equal to one-hundredth of a percentage point ($1  bps = 0.01\%$). In this project, $5000  bps = 50\%$.
- **CID (Content Identifier)**: A unique, self-describing cryptographic label used in IPFS to locate and identify files based on their cryptographic hash rather than their location.
- **Commit-Reveal Scheme**: A two-phase cryptographic protocol where a party submits a hash of their secret first, and later reveals the secret itself, preventing front-running and alteration.
- **ERC-5192**: An Ethereum standard for Minimal Soulbound NFTs that emits `Locked` events and disables transfers.
- **ERC-721**: The standard Ethereum specification for Non-Fungible Tokens (NFTs).
- **EVM (Ethereum Virtual Machine)**: The decentralized runtime environment that executes smart contracts across the Ethereum network.
- **Galois Field GF($2^8$)**: A finite mathematical field with 256 elements used by AES and Shamir Secret Sharing to perform arithmetic operations on bytes without overflow.
- **Hardhat**: A leading Ethereum development environment for compiling, deploying, and testing smart contracts.
- **Initialization Vector (IV)**: A random 12-byte salt passed into AES-GCM to ensure that encrypting the same plaintext twice produces completely different ciphertexts.
- **IPFS**: InterPlanetary File System, a peer-to-peer decentralized storage network.
- **Keccak-256**: The cryptographic hash function standardized as SHA-3, natively supported as a precompiled primitive in Solidity.
- **Modifier**: A Solidity language construct used to modify the behavior of functions (e.g., enforcing access controls like `onlyAdmin` or `onlyStaff`).
- **Multihash**: A self-describing cryptographic hash format used inside IPFS CIDs.
- **Precompiled Contract**: Optimized built-in cryptographic functions on the Ethereum virtual machine.
- **Quorum**: The minimum threshold of participants required to take an official action (in this vault, 3 of 5 staff members).
- **Secret Sharing**: Cryptographic algorithms that divide a secret into shares such that only authorized subsets of shares can reconstruct the original secret.
- **Shamir's Secret Sharing**: A specific threshold secret sharing scheme invented by Adi Shamir utilizing polynomial interpolation over finite fields.
- **Slashing**: The automatic forfeiture of staked cryptocurrency collateral as a penalty for violating protocol rules or missing deadlines.
- **Soulbound Token (SBT)**: A non-fungible token permanently bound to a single wallet address that cannot be transferred, sold, or approved.
- **Stake**: A deposit of cryptocurrency held in escrow by a smart contract to ensure honest participation.
- **Time-Lock**: A cryptographic or smart contract condition that prevents access to an asset or secret until a specific timestamp has passed.
- **WebCrypto**: The standardized W3C cryptographic JavaScript API available natively in modern web browsers and Node.js via `globalThis.crypto.subtle`.
- **Zero-Trust**: A security architecture principle asserting that no user, administrator, or node should be implicitly trusted; every action must be mathematically verified.
