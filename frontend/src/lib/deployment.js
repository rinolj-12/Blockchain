// deployment.json is written by `npm run demo:setup` (repo root). It may not exist
// yet, so load it through import.meta.glob: a missing file just gives an empty object.
const found = import.meta.glob("../deployment.json", { eager: true, import: "default" });
const bundled = Object.values(found)[0] ?? null;

const STORAGE_KEY = "examvault_live_deployment";

function getStoredLiveDeployment() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to parse live deployment:", e);
    }
  }
  return null;
}

export function hasLiveDeployment() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(STORAGE_KEY);
}

const initial = getStoredLiveDeployment() || bundled;

/** The deployment info, or null when the vault has not been deployed yet. */
export let deployment = initial;

/** Base URL for encrypted papers, without a trailing slash (e.g. "/ipfs"). */
export let ipfsGateway = (deployment?.ipfsGateway || "/ipfs").replace(/\/+$/, "");

/** Persists a live in-browser deployment and notifies all tabs */
export function setLiveDeployment(newDep) {
  deployment = newDep;
  ipfsGateway = (newDep?.ipfsGateway || "/ipfs").replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDep));
    } catch (e) {
      console.warn("Failed to persist live deployment:", e);
    }
    window.dispatchEvent(new CustomEvent("examvault:deployment-changed", { detail: newDep }));
    if (window.BroadcastChannel) {
      try {
        const ch = new BroadcastChannel("examvault_deployment");
        ch.postMessage({ type: "DEPLOYMENT_UPDATED", payload: newDep });
        ch.close();
      } catch (e) {}
    }
  }
}

/** Clears the live deployment and reverts to bundled deployment.json */
export function clearLiveDeployment() {
  deployment = bundled;
  ipfsGateway = (bundled?.ipfsGateway || "/ipfs").replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("examvault:deployment-changed", { detail: bundled }));
    if (window.BroadcastChannel) {
      try {
        const ch = new BroadcastChannel("examvault_deployment");
        ch.postMessage({ type: "DEPLOYMENT_CLEARED" });
        ch.close();
      } catch (e) {}
    }
  }
}

// Cross-tab broadcast listener for deployment updates
if (typeof window !== "undefined" && window.BroadcastChannel) {
  try {
    const listenCh = new BroadcastChannel("examvault_deployment");
    listenCh.onmessage = (event) => {
      if (event.data?.type === "DEPLOYMENT_UPDATED") {
        deployment = event.data.payload;
        ipfsGateway = (deployment?.ipfsGateway || "/ipfs").replace(/\/+$/, "");
        window.dispatchEvent(new CustomEvent("examvault:deployment-changed", { detail: deployment }));
      } else if (event.data?.type === "DEPLOYMENT_CLEARED") {
        deployment = bundled;
        ipfsGateway = (bundled?.ipfsGateway || "/ipfs").replace(/\/+$/, "");
        window.dispatchEvent(new CustomEvent("examvault:deployment-changed", { detail: bundled }));
      }
    };
  } catch (e) {}
}
