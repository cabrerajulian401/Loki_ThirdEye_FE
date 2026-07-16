# 🌓 Loki — Project Summary (as of 2026-07-16)

> One-page orientation for anyone (or any agent) landing in this workspace cold. Deep dive: `2026-07-16-scout-fe-build.md` (same folder) and `BE_Docs/Endpoints/` for the backend contracts.

## What Loki is

Loki is the ThirdEye initiative building **Scout**: an AI procurement assistant that lives in the Outlook right-hand task pane for SMB procurement teams. Scout watches supplier email threads and turns them into structured, actionable order operations. It has two halves:

| Half | Codename | Stack | Repo / location | State |
|---|---|---|---|---|
| Frontend (this repo) | **Loki FE / Scout** | React 18 + JS, Office Add-in (Mail), webpack, Jest+RTL | `github.com/cabrerajulian401/Loki_ThirdEye_FE` (branch `scout-fe`) | Feature-complete in mock mode; HTTP adapters transport-contract-ready (render mapping pending); 131 tests green |
| Backend | **Overseer** | Go (Echo), Postgres (pgx/dbmate), Microsoft Graph, Anthropic LLM | `github.com/cabrerajulian401/Overseer-ThirdEye` (feature branches/PRs) | All four features built + tested (300+ tests across docs); **not deployed** |

Both halves are built in the same clean-architecture discipline: entities/domain at the center, use cases over ports, adapters at the edge, composition root wiring — so each side can swap integrations (mock↔HTTP on the FE; Excel↔QuickBooks↔NetSuite gateways on the BE) without touching business logic.

## The four features (and where each stands)

1. **Order List** — one list of active orders extracted from inbox threads. BE: onboarding sync (`POST /sync` → LLM extraction → `orders` table), Graph webhook keeps it live, `order.updated` over `/ws`. FE: Orders home with status pills, realtime patching, sync-triggered refetch. **Works end-to-end in mock; needs BE deployment for real data.**
2. **Otto-Mode** — email → ERP entry with human approval. BE: `POST /otto/scans` (extract + rank top-3 destination sheets), `POST /otto/scans/{id}/record` (writes the row, returns the sheet `webUrl`). FE: banner on detected order email → review/edit fields → pick ERP → pick file → confirm → verify with deeplink. **Gap: no `GET /otto/scans` listing yet, so the FE's old-email tab is mock-only.**
3. **Check-ups** — scheduled supplier follow-ups. BE: `POST /checkups` expands cadence into one row per message; 1-minute scheduler sends via Graph; replies auto-cancel `cancel_if_reply` rows. FE: per-order flows with toggles, step editor, activity timeline. **Gap: no per-flow PATCH; FE toggles PATCH row-by-row.**
4. **Live Audit** — discrepancy detection on supplier threads. BE: LLM compares each new message against thread history, stores findings, pushes `discrepancy.found`. FE: findings feed, evidence detail, alert toast + nav badge, one-click pre-drafted reply in a real Outlook compose window.

## How the halves connect

`Authorization: Bearer <Graph token>` on every call (Overseer MVP accepts any bearer → seeded user). One WebSocket (`GET /ws`) carries all realtime events: `sync.completed`, `order.updated`, `discrepancy.found`. The FE's single switch is `src/taskpane/config/app.config.js` — `dataSource: "mock" | "http"` + URLs + `auth.mode: "mock" | "sso"`.

## The three blockers to a live end-to-end demo

1. **Deploy Overseer** (any HTTPS host) → set `apiBaseUrl`/`wsUrl`, flip `dataSource`.
2. **Azure AD app registration** → real SSO (`auth.mode: "sso"` + manifest `WebApplicationInfo`); also unblocks Overseer's refresh-token work (its own top cross-cutting gap).
3. **Graph token scopes** — Overseer's live legs need `Mail.Read` + `Mail.Send` + `Files.ReadWrite` on the token (documented in its walkthroughs).

*Full gap/priority list with owners: journal §🚧.*
