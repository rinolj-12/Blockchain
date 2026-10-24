#!/usr/bin/env node
// Runs a command with cache/temp dirs redirected to D: only if on Windows with D: drive present.
// On Linux/macOS, it passes through to standard system paths cleanly.
// Usage: node scripts/d-env.cjs <command> [args...]
const { spawn } = require("node:child_process");
const fs = require("node:fs");

const dirs = {};
const isWindows = process.platform === "win32";

if (isWindows && fs.existsSync("D:\\")) {
  const winDirs = {
    LOCALAPPDATA: "D:\\blockchain-exam-cache\\localappdata",
    APPDATA: "D:\\blockchain-exam-cache\\appdata",
    TEMP: "D:\\temp",
    TMP: "D:\\temp",
    npm_config_cache: "D:\\npm-cache",
    IPFS_PATH: "D:\\ipfs",
    XDG_CACHE_HOME: "D:\\blockchain-exam-cache\\xdg",
    NODE_REPL_HISTORY: "D:\\blockchain-exam-cache\\node_repl_history",
  };
  for (const d of new Set(Object.values(winDirs))) {
    try {
      fs.mkdirSync(d, { recursive: true });
    } catch { /* ignore */ }
  }
  Object.assign(dirs, winDirs);
}

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error("usage: node scripts/d-env.cjs <command> [args...]");
  process.exit(2);
}

// Join into one command line ourselves (passing args + shell:true is deprecated, DEP0190).
const q = (a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
const child = spawn([cmd, ...args].map(q).join(" "), {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ...dirs, HARDHAT_DISABLE_TELEMETRY_PROMPT: "true" },
});
child.on("error", (e) => { console.error(e.message); process.exit(1); });
child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 1));
