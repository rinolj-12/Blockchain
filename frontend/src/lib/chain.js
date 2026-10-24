// Everything that talks to the blockchain: providers, contracts, the polling
// hook that keeps a snapshot of the vault state, and custom-error decoding.
import { useCallback, useEffect, useRef, useState } from "react";
import { Contract, Interface, JsonRpcProvider, Network } from "ethers";
import { deployment } from "./deployment.js";
import { pieceCommitment, seedCommitment } from "./crypto.js";

export const POLL_MS = 2500;

// ------------------------------------------------------------------ providers & contracts

function resolveRpcUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  if (typeof window !== "undefined" && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      try {
        const u = new URL(rawUrl);
        if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
          u.hostname = host;
          return u.toString();
        }
      } catch { /* use raw */ }
    }
  }
  return rawUrl;
}

const activeRpcUrl = deployment ? resolveRpcUrl(deployment.rpcUrl) : null;

/** Read-only provider straight to the RPC node, so the portal works with no wallet. */
export const readProvider = deployment
  ? new JsonRpcProvider(activeRpcUrl, Network.from(deployment.chainId), { staticNetwork: true, cacheTimeout: -1 })
  : null;

const vaultAbi = deployment?.abi?.ExamVault ?? [];
const tokenAbi = deployment?.abi?.CollegeAccessToken ?? [];

export const vaultIface = new Interface(vaultAbi);
const tokenIface = new Interface(tokenAbi);

export const vaultRead = deployment ? new Contract(deployment.vault, vaultAbi, readProvider) : null;
const tokenRead = deployment ? new Contract(deployment.accessToken, tokenAbi, readProvider) : null;

/** ExamVault connected to a signer, for sending transactions. */
export function vaultWrite(signer) {
  return new Contract(deployment.vault, vaultAbi, signer);
}

// ------------------------------------------------------------------ state snapshot

// Hardhat demos fast-forward time (evm_increaseTime), so the chain clock can be
// ahead of the wall clock. We remember the largest gap seen and add it to Date.now().
let chainClockOffset = 0;
let immutables = null; // values that never change: read once
let startTime = null; // timestamp of the deploy block, for the dial's progress ring

async function loadImmutables() {
  if (!immutables) {
    const [admin, minStake, seedWindow, revealWindow] = await Promise.all([
      vaultRead.admin(),
      vaultRead.minStake(),
      vaultRead.seedWindow(),
      vaultRead.revealWindow(),
    ]);
    immutables = { admin, minStake, seedWindow: Number(seedWindow), revealWindow: Number(revealWindow) };
  }
  if (startTime === null) {
    const block = deployment.deployBlock != null ? await readProvider.getBlock(Number(deployment.deployBlock)) : null;
    startTime = block ? Number(block.timestamp) : 0;
  }
  return immutables;
}

/** Reads everything the screens need in one go (ethers batches the RPC calls). */
export async function loadVaultState() {
  const fixed = await loadImmutables();
  const [
    examTime,
    seedsCommitted,
    seedsRevealed,
    paperSelected,
    selectedPaper,
    selectedAt,
    piecesRevealed,
    postponed,
    slashedTotal,
    unlocked,
    dutiesOver,
    staffList,
    collegeList,
    papers,
    downloads,
    block,
  ] = await Promise.all([
    vaultRead.examTime(),
    vaultRead.seedsCommitted(),
    vaultRead.seedsRevealed(),
    vaultRead.paperSelected(),
    vaultRead.selectedPaper(),
    vaultRead.selectedAt(),
    vaultRead.piecesRevealed(),
    vaultRead.postponed(),
    vaultRead.slashedTotal(),
    vaultRead.isUnlocked(),
    vaultRead.dutiesOver(),
    vaultRead.getStaffList(),
    vaultRead.getCollegeList(),
    vaultRead.getPapers(),
    vaultRead.getDownloads(),
    readProvider.getBlock("latest"),
  ]);

  const staff = await Promise.all(
    staffList.map(async (address) => {
      const [s, commits] = await Promise.all([vaultRead.getStaff(address), vaultRead.getPieceCommits(address)]);
      return {
        address,
        index: Number(s.index),
        stake: s.stake,
        piecesCommitted: s.piecesCommitted,
        seedCommitted: s.seedCommitted,
        seedRevealed: s.seedRevealed,
        pieceRevealed: s.pieceRevealed,
        penalised: s.penalised,
        withdrawn: s.withdrawn,
        pieceCommits: [...commits],
        // Same rule as ExamVault.missedDuty()
        missedDuty: !s.seedRevealed || (paperSelected && !s.pieceRevealed),
      };
    }),
  );

  const colleges = await Promise.all(
    collegeList.map(async (address) => {
      const [c, balance] = await Promise.all([vaultRead.getCollege(address), tokenRead.balanceOf(address)]);
      return { address, name: c.name, tokenId: Number(c.tokenId), holdsToken: balance > 0n };
    }),
  );

  let revealed = { who: [], pieces: [] };
  if (piecesRevealed > 0n) {
    const r = await vaultRead.getRevealedPieces();
    revealed = { who: [...r.who], pieces: [...r.pieces] };
  }

  const chainNow = Number(block.timestamp);
  chainClockOffset = Math.max(chainClockOffset, chainNow - Date.now() / 1000);

  return {
    ...fixed,
    startTime,
    examTime: Number(examTime),
    seedsCommitted: Number(seedsCommitted),
    seedsRevealed: Number(seedsRevealed),
    paperSelected,
    selectedPaper: Number(selectedPaper),
    selectedAt: Number(selectedAt),
    piecesRevealed: Number(piecesRevealed),
    postponed,
    slashedTotal,
    unlocked,
    dutiesOver,
    staff,
    colleges,
    papers: { hashes: [...papers.hashes], cids: [...papers.cids] },
    downloads: downloads.map((d) => ({ college: d.college, tokenId: Number(d.tokenId), time: Number(d.time) })),
    revealed,
    blockNumber: block.number,
  };
}

// Multi-tab real-time event bus
const vaultChannel = typeof window !== "undefined" && window.BroadcastChannel ? new BroadcastChannel("examvault_channel") : null;

export function broadcastStateChange(toastData = null) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("examvault:refresh", { detail: toastData }));
    if (toastData) {
      window.dispatchEvent(new CustomEvent("examvault:toast", { detail: toastData }));
    }
    try {
      vaultChannel?.postMessage({ type: "refresh", timestamp: Date.now(), toast: toastData });
    } catch { /* channel closed or unsupported */ }
  }
}

export function broadcastToast(title, message, tone = "mint", icon = "🛡️") {
  broadcastStateChange({
    id: `${Date.now()}-${Math.random()}`,
    title,
    message,
    tone,
    icon,
  });
}

/** Hook for listening to multi-tab HUD toasts across all portals */
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const toast = e.detail;
      if (!toast) return;
      setToasts((prev) => [...prev.slice(-3), toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500);
    };

    window.addEventListener("examvault:toast", handleToast);
    return () => window.removeEventListener("examvault:toast", handleToast);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return { toasts, removeToast };
}

/** Polls the vault every POLL_MS. `refresh()` reloads right away (e.g. after a tx). */
export function useVaultState() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const s = await loadVaultState();
      if (alive.current) {
        setState(s);
        setError(null);
      }
    } catch (e) {
      if (alive.current) setError(e);
    }
  }, []);

  useEffect(() => {
    if (!vaultRead) return undefined;
    alive.current = true;
    let timer;
    const tick = async () => {
      await refresh();
      if (alive.current) timer = setTimeout(tick, POLL_MS);
    };
    tick();

    const handleExternalRefresh = () => {
      refresh();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("examvault:refresh", handleExternalRefresh);
      if (vaultChannel) {
        vaultChannel.onmessage = (e) => {
          if (e.data?.type === "refresh") {
            refresh();
            if (e.data.toast) {
              window.dispatchEvent(new CustomEvent("examvault:toast", { detail: e.data.toast }));
            }
          }
        };
      }
    }

    return () => {
      alive.current = false;
      clearTimeout(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("examvault:refresh", handleExternalRefresh);
      }
    };
  }, [refresh]);

  return { state, error, refresh };
}

/** Current chain time in unix seconds, ticking every second. */
export function useChainNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000 + chainClockOffset));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000 + chainClockOffset)), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ------------------------------------------------------------------ phase helpers

/** "NOT SET" | "LOCKED" | "PICKING" | "REVEALING" | "UNLOCKED" | "POSTPONED" */
export function examPhase(s, now) {
  if (!s || s.examTime === 0) return "NOT SET";
  if (s.postponed) return "POSTPONED";
  if (s.unlocked) return "UNLOCKED";
  if (s.paperSelected) return "REVEALING";
  if (now >= s.examTime) return "PICKING";
  return "LOCKED";
}

/** Same rule as ExamVault.selectPaper(). */
export function canSelectPaper(s, now) {
  if (!s || s.examTime === 0 || s.paperSelected || s.postponed || now < s.examTime) return false;
  if (s.seedsRevealed < 3) return false;
  return s.seedsRevealed === s.seedsCommitted || now >= s.examTime + s.seedWindow;
}

/** Label for an address: Admin, Staff N, college name or Viewer. */
export function roleOf(address, s) {
  if (!address || !s) return "Viewer";
  const a = address.toLowerCase();
  if (s.admin.toLowerCase() === a) return "Admin";
  const st = s.staff.find((x) => x.address.toLowerCase() === a);
  if (st) return `Staff ${st.index}`;
  const c = s.colleges.find((x) => x.address.toLowerCase() === a);
  if (c) return c.name || "College";
  return "Viewer";
}

// ------------------------------------------------------------------ errors

const FRIENDLY = {
  NotAdmin: "Only the admin can do that.",
  NotStaff: "This wallet is not one of the 5 keyholders.",
  NotCollege: "This wallet is not a registered college.",
  ExamAlreadySet: "The exam has already been set.",
  ExamNotSet: "The admin has not set the exam time yet.",
  StakeTooLow: "Lock the minimum deposit first.",
  ZeroDeposit: "The deposit cannot be zero.",
  AlreadyCommitted: "You have already saved this.",
  TooLate: "Too late: the exam time has passed.",
  TooEarly: "Too early: wait for the countdown to finish.",
  NotCommitted: "You did not save this before the exam time.",
  AlreadyRevealed: "You have already revealed this.",
  HashMismatch: "This does not match what you saved earlier. Check that you loaded the right key file.",
  NotEnoughSeeds: "At least 3 secret numbers must be revealed before a paper can be picked.",
  AlreadySelected: "A paper has already been picked.",
  NotSelected: "No paper has been picked yet.",
  WindowClosed: "The time window for this step has closed.",
  HasToken: "This college already has an access token.",
  NoToken: "This wallet does not hold a college access token.",
  PaperLocked: "The paper is still locked: fewer than 3 keys have been revealed.",
  ExamPostponedErr: "The exam was postponed.",
  NothingToPenalise: "There is nothing to penalise for this keyholder.",
  DutiesNotOver: "Wait until the reveal windows have closed.",
  AlreadyWithdrawn: "The deposit was already withdrawn.",
  TransferFailed: "Sending the deposit back failed.",
  Soulbound: "Access tokens are soulbound and cannot be transferred.",
};

/** Finds revert data (0x...) anywhere inside an ethers / MetaMask error object. */
function findRevertData(err, depth = 0) {
  if (!err || depth > 5) return null;
  if (typeof err === "string") return /^0x[0-9a-fA-F]{8,}$/.test(err) ? err : null;
  if (typeof err !== "object") return null;
  for (const key of ["data", "error", "info", "cause", "originalError"]) {
    const found = findRevertData(err[key], depth + 1);
    if (found) return found;
  }
  return null;
}

/** Turns any transaction / call error into a sentence for the user. */
export function friendlyError(err) {
  if (!err) return "";
  if (err.code === "ACTION_REJECTED" || err.info?.error?.code === 4001) return "You rejected the request in your wallet.";

  let name = err.revert?.name;
  if (!name) {
    const data = findRevertData(err);
    if (data) {
      for (const iface of [vaultIface, tokenIface]) {
        try {
          const parsed = iface.parseError(data);
          if (parsed) {
            name = parsed.name;
            break;
          }
        } catch {
          /* not this contract's error */
        }
      }
    }
  }
  if (name) return FRIENDLY[name] ?? `The contract refused: ${name}.`;
  if (err.code === "NETWORK_ERROR" || /failed to fetch|ECONNREFUSED/i.test(err.message ?? "")) {
    return "Cannot reach the blockchain node. Is `npm run node` running?";
  }
  return err.shortMessage || err.message || String(err);
}

// ------------------------------------------------------------------ helpers for college project demo

/** Advances the Hardhat node clock (for live viva testing without long waits). */
export async function fastForwardChain(seconds) {
  if (!readProvider) return;
  try {
    const s = Math.max(1, Math.floor(seconds));
    await readProvider.send("evm_increaseTime", [s]);
    await readProvider.send("evm_mine", []);
    chainClockOffset += s;
    broadcastToast("Chain Clock Advanced", `Blockchain time warped +${s}s on Ethereum Localnet`, "mint", "⚡");
  } catch (err) {
    console.warn("Fast-forward not supported on this chain/network:", err);
  }
}

export function saveStaffKey(staffIndex, keyData) {
  try {
    localStorage.setItem(`examvault:keyfile:staff_${staffIndex}`, JSON.stringify(keyData));
  } catch { /* storage blocked */ }
}

export function loadStaffKey(staffIndex) {
  try {
    const raw = localStorage.getItem(`examvault:keyfile:staff_${staffIndex}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Automates the blockchain sequence for an individual staff custodian submitting their key:
 * 1. Reveals this custodian's entropy seed.
 * 2. If 3 seeds are reached, resolves on-chain paper selection draw.
 * 3. Once paper is selected, reveals this custodian's share for the chosen paper,
 *    and fulfills shares for any previously committed custodians whose keys are cached.
 */
export async function submitStaffKeySequence(vault, signer, staffAddress, keyFile, onStatus) {
  if (!keyFile) throw new Error("No key file loaded.");

  const staffIndex = keyFile.staffIndex || 1;
  saveStaffKey(staffIndex, keyFile);

  // 1. Check chain time vs examTime
  const examTime = Number(await vault.examTime());
  if (examTime === 0) {
    throw new Error("Exam countdown has not been scheduled yet. Please start it from the Central Admin Portal first.");
  }
  const block = await readProvider.getBlock("latest");
  const now = Number(block.timestamp);

  if (now < examTime) {
    onStatus?.("Advancing blockchain clock to exam deadline...");
    const diff = examTime - now + 2;
    await fastForwardChain(diff);
  }

  const c = vaultWrite(signer);

  // 2. Reveal seed if not already revealed AND paper is not yet selected AND within seed window
  let isPaperSelected = await vault.paperSelected();
  let sInfo = await vault.getStaff(staffAddress);
  const fixed = await loadImmutables();
  const currentBlock = await readProvider.getBlock("latest");
  const currentNow = Number(currentBlock.timestamp);
  const seedDeadline = examTime + fixed.seedWindow;

  if (!sInfo.seedRevealed && !isPaperSelected && currentNow < seedDeadline) {
    onStatus?.(`Submitting entropy seed for Custodian #${staffIndex}...`);
    const txSeed = await c.revealSeed(BigInt(keyFile.seed));
    await txSeed.wait();
    broadcastToast(
      `Custodian #${staffIndex} Seed Registered`,
      `Secret entropy seed confirmed on Ethereum block`,
      "amber",
      "🎲"
    );
  }

  // 3. Check if paper can be selected (need >= 3 seeds)
  isPaperSelected = await vault.paperSelected();
  const seedsRevealed = Number(await vault.seedsRevealed());
  const seedsCommitted = Number(await vault.seedsCommitted());

  if (!isPaperSelected && seedsRevealed >= 3) {
    onStatus?.("Threshold reached (3 seeds)! Selecting exam paper on-chain...");
    if (seedsRevealed < seedsCommitted) {
      const fixed = await loadImmutables();
      const currentBlock = await readProvider.getBlock("latest");
      const currentNow = Number(currentBlock.timestamp);
      const seedDeadline = examTime + fixed.seedWindow;
      if (currentNow < seedDeadline) {
        onStatus?.("Advancing blockchain clock past seed window for consensus...");
        await fastForwardChain(seedDeadline - currentNow + 2);
      }
    }
    const txSelect = await c.selectPaper();
    await txSelect.wait();
    isPaperSelected = true;
    const chosen = Number(await vault.selectedPaper());
    broadcastToast(
      "Consensus Resolved",
      `Paper ${["A", "B", "C"][chosen]} selected on-chain by decentralized entropy draw!`,
      "mint",
      "🎲"
    );
  }

  // 4. Reveal piece for this staff and any other previously committed staff if paper is selected
  let quorumReached = false;
  let chosenPaper = null;
  if (isPaperSelected) {
    chosenPaper = Number(await vault.selectedPaper());
    const refreshedStaff = await vault.getStaff(staffAddress);
    if (!refreshedStaff.pieceRevealed) {
      onStatus?.(`Revealing key piece for selected Paper ${["A", "B", "C"][chosenPaper]}...`);
      const piece = keyFile.pieces[chosenPaper];
      const txPiece = await c.revealPiece(piece);
      await txPiece.wait();
      broadcastToast(
        `Custodian #${staffIndex} Share Submitted`,
        `32-byte Shamir share for Paper ${["A", "B", "C"][chosenPaper]} verified on-chain`,
        "mint",
        "🔐"
      );
    }

    // Auto-reveal pieces for any other custodians who already submitted their seeds and have saved keys
    for (let i = 0; i < deployment.accounts.staff.length; i++) {
      const otherAddr = deployment.accounts.staff[i];
      if (otherAddr.toLowerCase() === staffAddress.toLowerCase()) continue;
      const otherStaff = await vault.getStaff(otherAddr);
      if (otherStaff.seedRevealed && !otherStaff.pieceRevealed) {
        const stored = loadStaffKey(i + 1) || deployment.preparedSecrets?.[i];
        if (stored?.pieces?.[chosenPaper]) {
          onStatus?.(`Submitting cached key piece for Custodian #${i + 1}...`);
          try {
            const otherSigner = await readProvider.getSigner(otherAddr);
            const otherVault = vaultWrite(otherSigner);
            const otherTx = await otherVault.revealPiece(stored.pieces[chosenPaper]);
            await otherTx.wait();
          } catch (pieceErr) {
            console.warn(`Failed auto-revealing piece for staff ${i + 1}:`, pieceErr);
          }
        }
      }
    }

    const totalRevealed = Number(await vault.piecesRevealed());
    if (totalRevealed >= 3) {
      quorumReached = true;
      broadcastToast(
        "3-of-5 Quorum Reached!",
        `Exam Paper ${["A", "B", "C"][chosenPaper]} is UNLOCKED for exam centres!`,
        "mint",
        "🎉"
      );
    }
  }

  onStatus?.("Key successfully processed!");
  broadcastStateChange();
  return {
    seedRevealed: true,
    paperSelected: isPaperSelected,
    selectedPaper: chosenPaper,
    quorumReached,
  };
}

/**
 * Executes on-chain paper selection draw with EVM seedWindow compliance.
 * Handles advancing time if >= 3 seeds are present but < seedsCommitted.
 */
export async function resolvePaperSelection(onStatus) {
  if (!deployment) throw new Error("No deployment configuration found.");
  const isSelected = await vaultRead.paperSelected();
  if (isSelected) {
    return Number(await vaultRead.selectedPaper());
  }

  const [examTimeBN, seedWindowBN, seedsCommittedBN, seedsRevealedBN] = await Promise.all([
    vaultRead.examTime(),
    vaultRead.seedWindow(),
    vaultRead.seedsCommitted(),
    vaultRead.seedsRevealed(),
  ]);

  const examTime = Number(examTimeBN);
  const seedWindow = Number(seedWindowBN);
  const seedsCommitted = Number(seedsCommittedBN);
  const seedsRevealed = Number(seedsRevealedBN);

  if (seedsRevealed < 3) {
    throw new Error(`Need at least 3 custodian seeds before paper selection (currently ${seedsRevealed}/3).`);
  }

  const block = await readProvider.getBlock("latest");
  const now = Number(block.timestamp);

  if (examTime > 0 && now < examTime) {
    onStatus?.("Advancing chain time to exam deadline...");
    await fastForwardChain(examTime - now + 2);
  }

  // If not all committed seeds are in (e.g. 3 revealed out of 5 committed),
  // ExamVault.selectPaper() requires block.timestamp >= examTime + seedWindow.
  if (seedsRevealed < seedsCommitted) {
    const latestBlock = await readProvider.getBlock("latest");
    const currentNow = Number(latestBlock.timestamp);
    const deadline = examTime + seedWindow;
    if (currentNow < deadline) {
      onStatus?.("Advancing blockchain clock past seed reveal window...");
      await fastForwardChain(deadline - currentNow + 2);
    }
  }

  onStatus?.("Executing selectPaper() on ExamVault...");
  const adminSigner = await readProvider.getSigner(deployment.accounts.admin);
  const vault = vaultWrite(adminSigner);
  const tx = await vault.selectPaper();
  await tx.wait();

  const chosen = Number(await vaultRead.selectedPaper());
  broadcastStateChange();
  return chosen;
}

/**
 * Fast-tracks the entropy consensus draw:
 * Reveals seeds for Staff 1, 2, 3 (if not yet revealed), then triggers paper selection.
 */
export async function fillSeedsAndSelect(onStatus) {
  if (!deployment) throw new Error("No deployment configuration found.");

  const examTime = Number(await vaultRead.examTime());
  if (examTime === 0) {
    throw new Error("Exam countdown has not been started yet.");
  }

  const block = await readProvider.getBlock("latest");
  const now = Number(block.timestamp);
  if (now < examTime) {
    onStatus?.("Advancing chain clock to exam deadline...");
    await fastForwardChain(examTime - now + 2);
  }

  let secrets = deployment.preparedSecrets;
  if (!secrets || secrets.length < 3) {
    secrets = [];
    for (let i = 1; i <= 3; i++) {
      try {
        const res = await fetch(`/demo-secrets/staff-${i}.json`);
        if (res.ok) secrets.push(await res.json());
      } catch (err) {
        console.warn(`Could not fetch demo secret for staff ${i}:`, err);
      }
    }
  }

  for (let i = 0; i < 3; i++) {
    const staffAddr = deployment.accounts.staff[i];
    const s = await vaultRead.getStaff(staffAddr);
    if (!s.seedRevealed) {
      const secret = secrets.find(
        (item) => item.staffAddress?.toLowerCase() === staffAddr.toLowerCase() || item.staffIndex === i + 1
      ) || secrets[i];

      if (secret && secret.seed !== undefined) {
        onStatus?.(`Submitting entropy seed for Custodian #${i + 1}...`);
        const staffSigner = await readProvider.getSigner(staffAddr);
        const sc = vaultWrite(staffSigner);
        const tx = await sc.revealSeed(BigInt(secret.seed));
        await tx.wait();
      }
    }
  }

  return await resolvePaperSelection(onStatus);
}

/**
 * Automatically submits key shares across staff 1, 2, 3 to achieve the 3-of-5 quorum.
 * First ensures paper is selected (via fillSeedsAndSelect if necessary).
 */
export async function autoSubmitRemainingQuorum(onStatus) {
  if (!deployment) throw new Error("No deployment configuration found.");

  let isSelected = await vaultRead.paperSelected();
  if (!isSelected) {
    onStatus?.("Resolving paper selection first...");
    await fillSeedsAndSelect(onStatus);
    isSelected = true;
  }

  const selectedPaper = Number(await vaultRead.selectedPaper());
  onStatus?.(`Selected paper is Paper ${["A", "B", "C"][selectedPaper]}. Submitting shares...`);

  let secrets = deployment.preparedSecrets;
  if (!secrets || secrets.length < 3) {
    secrets = [];
    for (let i = 1; i <= 5; i++) {
      const stored = loadStaffKey(i);
      if (stored?.pieces) {
        secrets.push(stored);
      } else {
        try {
          const res = await fetch(`/demo-secrets/staff-${i}.json`);
          if (res.ok) secrets.push(await res.json());
        } catch { /* ignore */ }
      }
    }
  }

  let revealedCount = Number(await vaultRead.piecesRevealed());

  for (let i = 0; i < deployment.accounts.staff.length && revealedCount < 3; i++) {
    const staffAddr = deployment.accounts.staff[i];
    const s = await vaultRead.getStaff(staffAddr);
    if (!s.pieceRevealed) {
      const secret = secrets.find(
        (item) => item.staffAddress?.toLowerCase() === staffAddr.toLowerCase() || item.staffIndex === i + 1
      ) || secrets[i];

      if (secret?.pieces?.[selectedPaper]) {
        onStatus?.(`Submitting Shamir share for Custodian #${i + 1}...`);
        const staffSigner = await readProvider.getSigner(staffAddr);
        const sc = vaultWrite(staffSigner);
        const tx = await sc.revealPiece(secret.pieces[selectedPaper]);
        await tx.wait();
        revealedCount++;
      }
    }
  }

  onStatus?.("Quorum reached! Paper is unlocked on Ethereum.");
  broadcastStateChange();
}

/**
 * Starts the exam countdown on the smart contract from the UI:
 * 1. Admin signs and calls setExam(examTime, paperHashes, paperCids).
 * 2. Immediately signs and submits commitments for all 5 staff members.
 */
export async function startExamCountdown(durationSeconds = 120, onStatus) {
  if (!deployment) throw new Error("No deployment configuration found.");
  const adminAddress = deployment.accounts?.admin;
  if (!adminAddress) throw new Error("Admin address not found in deployment.");

  onStatus?.("Connecting to central admin wallet...");
  const adminSigner = await readProvider.getSigner(adminAddress);
  const vault = vaultWrite(adminSigner);

  // Check if exam already set
  const currentExamTime = Number(await vault.examTime());
  if (currentExamTime !== 0) {
    throw new Error("Exam deadline is already set on the blockchain.");
  }

  // Get prepared papers (from deployment.json or fetch fallback)
  let papers = deployment.preparedPapers;
  if (!papers || papers.length !== 3) {
    try {
      const res = await fetch("/demo-data/papers.json");
      if (res.ok) {
        const data = await res.json();
        papers = data.papers;
      }
    } catch { /* fallback below */ }
  }
  if (!papers || papers.length !== 3) {
    throw new Error("Could not find the 3 prepared exam papers. Please run npm run demo:setup.");
  }

  const paperHashes = papers.map((p) => p.hash);
  const paperCids = papers.map((p) => p.cid);

  const block = await readProvider.getBlock("latest");
  let currentChainTime = Number(block.timestamp);
  try {
    const offset = Number(await readProvider.send("evm_increaseTime", [0]));
    currentChainTime = Math.max(currentChainTime, Math.floor(Date.now() / 1000) + offset);
  } catch { /* use block.timestamp */ }
  const chainNow = Math.max(Number(block.timestamp), currentChainTime);
  const examTime = BigInt(chainNow + Number(durationSeconds));

  onStatus?.(`Admin locking exam deadline (now + ${durationSeconds}s) on Ethereum...`);
  const txSet = await vault.setExam(examTime, paperHashes, paperCids);
  await txSet.wait();

  // Load secrets for 5 staff members (from deployment.preparedSecrets or demo-secrets/staff-*.json)
  let secrets = deployment.preparedSecrets;
  if (!secrets || secrets.length !== 5) {
    secrets = [];
    for (let i = 1; i <= 5; i++) {
      try {
        const res = await fetch(`/demo-secrets/staff-${i}.json`);
        if (res.ok) {
          secrets.push(await res.json());
        }
      } catch (err) {
        console.warn(`Could not fetch demo-secret staff-${i}:`, err);
      }
    }
  }

  // Submit staff commitments for all 5 staff members
  for (let i = 0; i < deployment.accounts.staff.length; i++) {
    const staffAddr = deployment.accounts.staff[i];
    const secret = secrets.find(
      (s) => s.staffAddress?.toLowerCase() === staffAddr.toLowerCase() || s.staffIndex === i + 1
    ) || secrets[i];

    if (secret) {
      onStatus?.(`Registering cryptographic commitments for Staff Custodian #${i + 1}...`);
      const staffSigner = await readProvider.getSigner(staffAddr);
      const staffVault = vaultWrite(staffSigner);

      const commits = secret.pieces.map((piece, paperIdx) =>
        pieceCommitment(deployment.vault, staffAddr, paperIdx, piece)
      );
      const seedCom = seedCommitment(deployment.vault, staffAddr, BigInt(secret.seed));

      const txPiece = await staffVault.commitPieces(commits);
      await txPiece.wait();

      const txSeed = await staffVault.commitSeed(seedCom);
      await txSeed.wait();
    }
  }

  broadcastToast(
    "Exam Countdown Started",
    `Deadline locked on Ethereum (${durationSeconds}s timer active). All 5 custodian commitments registered.`,
    "mint",
    "🚀"
  );
  onStatus?.("Exam deadline locked & custodians committed! Countdown is live.");
}

/**
 * Executes penalise(staffAddress) on ExamVault.
 * Anyone can call this once dutiesOver() is true if the staff member missed a duty.
 */
export async function penaliseStaff(staffAddress, onStatus) {
  if (!deployment) throw new Error("No deployment configuration found.");
  onStatus?.("Connecting wallet to penalise delinquent custodian...");
  const adminSigner = await readProvider.getSigner(deployment.accounts.admin);
  const vault = vaultWrite(adminSigner);
  onStatus?.("Broadcasting penalise() transaction to Ethereum...");
  const tx = await vault.penalise(staffAddress);
  await tx.wait();
  broadcastToast(
    "Stake Slashed On-Chain",
    `Delinquent custodian deposit slashed by 50% (-0.50 ETH)`,
    "red",
    "🚨"
  );
  broadcastStateChange();
}

