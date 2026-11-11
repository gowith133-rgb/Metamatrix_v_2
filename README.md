# MetaMatrix

**Decentralized AI that runs on mobile phones — no data center required.**

MetaMatrix is a working project, not a pitch. Its nodes are ordinary Android
phones running local models, its services publish verifiable data in public,
and every claim below links to something you can check.

## What's live

| Piece | What it is | How to verify |
|---|---|---|
| Phone nodes | Android phones running local LLM inference and project services (Termux-based stack, auto-start on boot) | This is the production infrastructure — Nexus and SRSI run on it |
| SRSI Threat Ledger | A hash-chained, append-only ledger of CISA Known Exploited Vulnerabilities, updated automatically every 6 hours | Public API: https://api.metamatrix.network — try `/api/v1/ledger` and `/api/v1/ledger/verify` and check the chain yourself |
| PCD specification | Progressive Capability Delegation — an architecture for delegating capabilities to AI agents in bounded, revocable steps (v1.1.0) | [pcd-spec](https://github.com/gowith133-rgb/pcd-spec) |
| Election-integrity architecture | A layered design for exact tallies and tamper-evident custody, built from systems principles (v2.0, published Nov 2026) | [election-integrity-architecture](https://github.com/gowith133-rgb/election-integrity-architecture) · DOI: [10.5281/zenodo.24050412](https://doi.org/10.5281/zenodo.24050412) |

## In development

| Piece | Status |
|---|---|
| Nexus | A free automated trading app that will run on MetaMatrix nodes. Paper-trading first: it must clear a public funding gate — three consecutive months at +3% net on live paper trading — before real money is ever discussed, and a lawyer reviews before anything touches user funds. Prototype engine: [Nexus_orical-](https://github.com/gowith133-rgb/Nexus_orical-) |
| Charlie | The project's own 7B model, trained for the phone-node stack. Runs the nodes' scoring and verification work |

## Design stage (documents exist, hardware does not — yet)

- **Sanctuary Node** — a dedicated hardware node design
- **LoRa mesh networking** — off-grid node-to-node communication for when the internet path is down
- **Project Apex** — an AR telemetry helmet applying the same sensor-fusion approach to rider safety

## This repository

`Metamatrix_v_2` is the project's first web prototype (built with Google AI
Studio) and its early vision documents. It builds and runs, but it is a
sandbox, not the product — the real system is the phone nodes above. The
vision documents are kept as design history; where they describe things that
don't exist yet, read them as the design stage they are.

## Principles

- **Proof, not promises.** If a claim can't be linked to something checkable,
  it doesn't go on this page.
- **Sovereignty by architecture.** Your device, your model, your data —
  designed so no central server has to be trusted.
- **Honest status.** Working, in development, and design stage are labeled
  as what they are.

---

*Mark Krzan — Morriston, Florida · metamatrix.network*
