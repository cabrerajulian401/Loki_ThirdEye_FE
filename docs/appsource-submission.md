# Scout → AppSource submission playbook

Compiled 2026-07-25 from Microsoft's Partner Center checklist, the add-in submission guide, and the commercial-marketplace certification policies (§1100.x / §1120.x). Sources: learn.microsoft.com/partner-center/marketplace-offers/checklist, /add-in-submission-guide, /appsource-submission-faq, legal/marketplace/certification-policies, office/dev/add-ins/publish.

## ✅ Already compliant (done in repo, verified 2026-07-25)

- office.js loaded from Microsoft's CDN, never bundled (taskpane.html, commands.html).
- Manifest passes Microsoft's validation service (`npx office-addin-manifest validate dist/manifest.xml` → "The manifest is valid", WebApplicationInfo structure OK). Re-run with `-p` (production checks) before each submission.
- Real ProviderName ("ThirdEye"), real Description, template ActionButton removed.
- SupportUrl → hosted `/support.html` (public HTTPS page — store rejects GitHub/social/email links).
- Privacy policy → hosted `/privacy.html` (names Scout specifically, covers personal-data handling, distinct from any ToU — all three are checked).
- Icons: 64×64 (`IconUrl`) + 128×128 (`HighResolutionIconUrl`, declared after IconUrl) over HTTPS — Outlook-specific sizes.
- All manifest URLs HTTPS; `AppDomains` lists the Overseer API domain.
- `WebApplicationInfo`: real Entra client ID; Resource domain matches the add-in's own domain and ends with the client ID (malformed = outright rejection); Office client `ea5a67f6-…` pre-authorized with `access_as_user`.
- No `CustomPane`, no `ItemSend` event (both prohibited).
- Mailbox requirement raised to **1.8** so validation only tests modern (WebView2-era) clients — React 18 cannot run in Outlook 2013–2019 legacy webviews, and policy 1120.3 fails you on any platform your Requirements imply.
- **Demo mode**: `taskpane.html?demo=1` runs the entire app on seeded mock data — no account, no backend. This is the credential-free path reviewers need (missing test instructions auto-fail ~top-5 rejection cause).

## 🛑 Remaining code work before submitting (certification blockers)

1. **Fallback (non-SSO) auth — policy 1120.3, hard requirement.** SSO cannot be the only auth path. Build the MSAL dialog flow (Office dialog → OAuth auth-code w/ PKCE → backend `/auth/callback` stores tokens in the existing per-user cache). ~1–2 days FE+BE; also unlocks personal-account support.
2. **First-run experience — policy 1100.1/1100.5.** Value proposition must be visible *before* any sign-in prompt, and sign-in / sign-out / sign-up links must be prominent. Scout's Welcome screen covers the value prop; still needed: a visible **sign-out** and a **sign-up/learn-more** link. *Alternative:* claim the **enterprise-only exemption** in Notes for Certification (cite policy 1100.5) — waives FRE/sign-up rules but still requires a contact email or "learn more" link in the UI.
3. **Pinning — policy 1120.4.** Manifest sets `SupportsPinning`; pinned panes must react to the currently selected email (`ItemChanged` handler). Either implement the handler (refresh Otto banner/email context on item change) or drop `SupportsPinning`.
4. **Graceful auth-failure UX.** When SSO/consent fails in http mode the app currently retries into 401s. Policies 1100.4/100.12 require predictable, non-broken behavior: show a "connect your mailbox / contact your admin" state instead. (Same work item as the fallback-auth screen.)

## 📋 Manual/business checklist (no code)

1. **Partner Center enrollment** (start now — longest lead time):
   - Enroll in the Microsoft AI Cloud Partner Program with a **work account** (yendo tenant, not gmail/outlook.com), then activate the **"Microsoft 365 and Copilot" program** (Settings → Programs).
   - Identity verification via AU10TIX: government photo ID + Microsoft Authenticator selfie; name must exactly match the primary contact; typically 3–5 business days, must finish within 30 days. Employment verification follows.
   - No listing fee; add-in listings are free-to-download only (monetization later = separate SaaS offer + license check in the add-in).
2. **Publisher name must match `ProviderName`.** Manifest says **ThirdEye** — if you enroll under a different legal/publisher name (e.g., Yendo), update `ProviderName` to match before submitting.
3. **Listing assets:**
   - ≥1 screenshot, 1366×768, ≤1024 KB, real content, no personal data (use `?demo=1` for clean data).
   - Logo for the listing (assets/logo-filled.png is 300×300 — replace the template art with real Scout branding; also replace icon-16/32/64/80/128, currently generic template icons).
   - Name ≤50 chars = "Scout" (must match manifest DisplayName and the reserved name). Summary ≤100 chars. Description 300–500 words, HTML allowed.
   - **Required disclosures in the description:** Scout requires a Scout/Overseer service account and an ERP connection — name them and link where to get them; tick "My product requires purchase of a service" in Product setup.
4. **Legal:** either check **Standard Contract** (Microsoft's EULA — irreversible once published) or host your own EULA page. Privacy + support pages are already live.
5. **Properties:** 1–3 categories (suggest: Productivity; Sales), ≤2 industries, languages = en-US only (matches manifest DefaultLocale).
6. **Notes for certification** (paste + adapt — incomplete notes auto-fail, reviewers never email you):
   > Scout requires a backend account normally provisioned per company. For review, open the task pane and append `?demo=1` to the pane URL (or use the provided demo tenant credentials: <ADD>) — this runs every feature (orders, Otto-Mode, check-ups, live audit) on seeded demonstration data with no external account.
   > SSO: the add-in uses Office SSO (`getAccessToken`) against Entra app 87c43ea2-88ae-4034-acf1-da843b626893; on failure it falls back to <MSAL dialog — describe once built>.
   > [If claiming it:] This add-in targets enterprise organizations only; per policy 1100.5 we claim the enterprise exemption for the seamless-FRE/sign-up requirements. A support contact link is present in the pane.
   Upload a PDF with screenshots of the test flow to "Additional certification info" (persists across resubmissions).
7. **Versioning:** every resubmission must bump `<Version>` (a.b.c.d) and match the form; the add-in `<Id>` GUID must never change. Adding Graph scopes later forces tenant admins to re-consent — batch scope changes.
8. **Timeline:** certification is typically 3–5 business days per pass; Microsoft advises budgeting up to 4–6 weeks end-to-end with resubmissions. Enrollment + ID verification runs in parallel — start it first.

## Suggested order

1. Start Partner Center enrollment + ID verification (clock starts).
2. Build blockers #1–#4 (fallback auth + FRE/sign-out + pinning + graceful failure ≈ one focused sprint).
3. Replace template icons/logo with Scout branding.
4. Capture screenshots in `?demo=1`, write listing copy, draft certification notes.
5. `npx office-addin-manifest validate -p dist/manifest.xml`, submit, monitor "Attention needed".
