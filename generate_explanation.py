#!/usr/bin/env python3
"""
generate_explanation.py
=======================
Reads every important file in the Blockchain-pro project, sends them to
Gemini 2.0 Flash, and writes EXPLANATION.md to the project root.

Usage:   python3 generate_explanation.py
Needs:   Python 3.8+  |  A free Gemini API key (aistudio.google.com/apikey)
         Set GEMINI_API_KEY env var, or paste it when prompted.

The script auto-creates a local venv and installs google-genai (no sudo).
"""

import os, sys, subprocess, pathlib, getpass

ROOT   = pathlib.Path(__file__).parent.resolve()
VENV   = ROOT / ".venv-explain"
PYTHON = VENV / "bin" / "python"
PIP    = VENV / "bin" / "pip"

def run(cmd, **kw):
    print(f"  $ {' '.join(str(c) for c in cmd)}")
    subprocess.check_call([str(c) for c in cmd], **kw)

# ── bootstrap venv ────────────────────────────────────────────────────────────
if not PYTHON.exists():
    print("\n[setup] Creating virtual environment (.venv-explain) …")
    run([sys.executable, "-m", "venv", str(VENV)])

print("[setup] Installing google-genai (pip -q) …")
run([PIP, "install", "-q", "--upgrade", "google-genai"])

# Re-exec under the venv python so the import works
if pathlib.Path(sys.executable).resolve() != PYTHON.resolve():
    os.execv(str(PYTHON), [str(PYTHON)] + sys.argv)

# ── now running inside the venv ───────────────────────────────────────────────
from google import genai
from google.genai import types

# ── API key ───────────────────────────────────────────────────────────────────
api_key = os.environ.get("GEMINI_API_KEY", "").strip()
if not api_key:
    print("\nGemini API key not found in environment.")
    print("Get a free key at: https://aistudio.google.com/apikey")
    api_key = getpass.getpass("Paste your GEMINI_API_KEY here: ").strip()
    if not api_key:
        print("No key provided — aborting."); sys.exit(1)

client = genai.Client(api_key=api_key)

# ── files to collect ──────────────────────────────────────────────────────────
FILES = [
    "package.json", ".env.example", "hardhat.config.cjs",
    "contracts/CollegeAccessToken.sol", "contracts/ExamVault.sol",
    "shared/vaultCrypto.mjs",
    "scripts/prepare-papers.mjs", "scripts/demo-setup.mjs",
    "scripts/demo-reveal.mjs", "scripts/deploy.cjs", "scripts/verify-hash.mjs",
    "frontend/src/App.jsx",
    "frontend/src/screens/Admin.jsx", "frontend/src/screens/Staff.jsx",
    "frontend/src/screens/College.jsx", "frontend/src/screens/GenesisSetup.jsx",
    "frontend/src/components/Header.jsx",
    "frontend/src/components/QuorumVisualizer.jsx",
    "frontend/src/components/PaperVaultSection.jsx",
    "frontend/src/components/BlockchainVisuals.jsx",
    "frontend/src/components/TransactionModal.jsx",
    "test/ExamVault.test.cjs", "test/crypto.test.cjs",
    "docs/REPORT.md",
]
MAX = 80_000  # bytes per file before truncation

def slurp(rel):
    p = ROOT / rel
    if not p.exists(): return f"(not found: {rel})\n"
    raw = p.read_bytes()
    txt = raw.decode("utf-8", errors="replace")
    return txt if len(raw) <= MAX else txt[:MAX] + f"\n…[truncated at {MAX}B]…\n"

print("\nReading project files …")
dump = ""
for f in FILES:
    c = slurp(f)
    dump += f"\n\n{'='*68}\nFILE: {f}\n{'='*68}\n{c}"
    print(f"  ✓  {f}  ({len(c):,} chars)")

# ── prompt ────────────────────────────────────────────────────────────────────
PROMPT = f"""You are a senior software engineer and technical writer.
Below are ALL the source files for a blockchain project called "Blockchain Exam Vault".
Read every file carefully, then produce ONE complete EXPLANATION.md document.

REQUIREMENTS
============
Audience: A student/junior dev with basic programming knowledge but NO blockchain
background. Explain every blockchain concept in plain English with an analogy first.

Cover (exhaustively, nothing skipped):
- The real-world problem solved
- High-level architecture (ASCII diagram)
- Key concepts: AES-256-GCM, Shamir Secret Sharing, Commit-Reveal, IPFS,
  Soulbound tokens, keccak256, how randomness is picked
- Full exam lifecycle step-by-step (setup → exam day → after)
- Every Solidity function in ExamVault.sol — purpose, caller, timing, errors
- CollegeAccessToken contract
- shared/vaultCrypto.mjs — every exported function explained
- Every script in scripts/ — what it does, how to run it, all CLI flags
- Every frontend screen (Admin, Staff, College, GenesisSetup) and component
- Test suite — what is tested and why
- Step-by-step "How to Run" commands
- Environment variables (.env)
- Complete file-tree with descriptions
- Security model: each threat and mitigation (table)
- Known limitations
- Glossary of every technical term

Format: GitHub-flavoured Markdown. Table of Contents with anchors. Tables for
functions/events/errors. Code blocks with language tags. ASCII diagrams for flows.
No placeholder text — fill everything from actual code.
Be thorough — this is the definitive reference for the project.
Tone: friendly, precise, professional.

SOURCE FILES FOLLOW
===================
{dump}

Now write EXPLANATION.md. Start with the heading:
# Blockchain Exam Vault — Complete Project Explanation
No preamble outside the document.
""".strip()

# ── stream to file ────────────────────────────────────────────────────────────
OUT = ROOT / "EXPLANATION.md"
print(f"\nCalling Gemini 2.0 Flash … streaming to {OUT.name}\n" + "─"*60)

try:
    with OUT.open("w", encoding="utf-8") as fh:
        for chunk in client.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=PROMPT,
            config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=8192),
        ):
            t = chunk.text or ""
            print(t, end="", flush=True)
            fh.write(t)
    print("\n" + "─"*60)
    print(f"\n✅  Done! EXPLANATION.md → {OUT}  ({OUT.stat().st_size/1024:.1f} KB)\n")
except Exception as e:
    print(f"\n❌  Gemini call failed: {e}"); sys.exit(1)
