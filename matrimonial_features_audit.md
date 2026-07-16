# Matrimonial Website — Feature Audit & Implementation Report

**Project:** Asan Nikah (package name `mom-matrimonial`; earlier working name "Rishte Forever")
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Prisma ORM + MongoDB Atlas · Auth.js v5 (Google) · Razorpay · Vercel Blob · Resend
**Audit date:** 2026-07-15
**Auditor scope:** Frontend, backend, DB models, APIs, auth, middleware (`proxy`), admin panel, environment variables, production behaviour.

---

## 0. How to read this report

**Status legend**

| Status | Meaning |
|---|---|
| ✅ Fully working | Implemented correctly and enforced server-side |
| 🟡 Partially working | Works but incomplete or with gaps |
| 🔴 Present but broken | Exists but does not do its job |
| 🧪 Hardcoded / mock-only | Static data, not driven by DB/config |
| ⛔ Missing | Not implemented |

**Important honesty note on testing.** This environment's `.env` contains **placeholder** database credentials (`mongodb+srv://<username>:<password>@<cluster>/…`) and dummy Razorpay/Google keys. Therefore **no live end-to-end flow could be executed** (no real MongoDB, no real Google OAuth, no real Razorpay). All verification below is:

- **Code-level verification** — reading the actual code paths, types, and data flow; and
- **Build/lint/typecheck** — `npx tsc --noEmit` (clean), `eslint` (clean in `src/`), `npm run build` (compiles successfully, all 50+ routes emitted).

Wherever a feature depends on external credentials, it is flagged **"needs credentials to test live."** Nothing below is claimed as "tested end-to-end" unless it genuinely was.

**Headline finding.** The codebase is considerably more complete and more secure than the brief assumed. Payments already compute the price server-side (they do **not** charge a hardcoded ₹1), privacy redaction is already enforced server-side, the compatibility ranking already uses real preference data, spam protection (honeypot + rate-limit + dedupe) already exists, and the mock/DB fallback already refuses to run in production unless explicitly enabled. The genuinely broken/missing items were a smaller, specific set (success stories, referral persistence, contact centralisation, fallback auto-recovery, payment webhook) — all addressed in this pass.

---

## 1. Public website and search

**Expected:** Home, About, Contact, Browse, How It Works, Membership/Premium, Success Stories, Privacy, Terms, Safety; multi-filter search, pagination/load-more, accurate results, empty/loading states, mobile.

**Current status:** 🟡 Partially working (mostly ✅; two gaps).

**Evidence / files:**
- Pages present: [about](src/app/about/page.tsx), [contact](src/app/contact/page.tsx), [how-it-works](src/app/how-it-works/page.tsx), [premium](src/app/premium/page.tsx), [success-stories](src/app/success-stories/page.tsx), [privacy-policy](src/app/privacy-policy/page.tsx), [terms-and-conditions](src/app/terms-and-conditions/page.tsx), [safety](src/app/safety/page.tsx), [search](src/app/search/page.tsx), plus package pages under [packages/](src/app/packages/).
- Search + multi-filter: [SearchClient.tsx](src/app/search/SearchClient.tsx) filters by gender, age min/max, maslak/sect, biradari/caste, state, district. Empty and loading states handled (`isLoading`, empty-list branch).
- Public profile API with redaction: [api/profiles/route.ts](src/app/api/profiles/route.ts).

**Problems found:**
- **No pagination / load-more.** The directory renders all matching profiles at once ([SearchClient.tsx](src/app/search/SearchClient.tsx)). Fine for small datasets; will not scale to thousands of profiles.
- Search filtering is **client-side** over the already-fetched, redacted list — correct for privacy, but again unbounded.

**Security/privacy concerns:** None new. Profiles are redacted server-side before they reach the client (see §3).

**Changes implemented:** Success Stories converted to dynamic DB content (see §10). No layout/design changes to other public pages (per instructions).

**Remaining limitations:** Pagination/server-side search is a recommended future enhancement for scale.

**Required env vars:** `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`.

**Testing result:** Build passes; pages compile as static/dynamic as expected. Live data rendering needs `DATABASE_URL`.

---

## 2. Authentication and registration

**Expected:** Google login, secure login/logout, session persistence, protected routes, 6-step registration, per-step validation, partial-save, edit profile, duplicate prevention, correct redirects, cancelled/failed login handling. No demo auth.

**Current status:** ✅ Fully working (code-level), 🟡 one item to confirm (6 steps).

**Evidence / files:**
- Auth config: [src/auth.ts](src/auth.ts) — NextAuth v5, `PrismaAdapter`, Google provider, **database** session strategy, session enriched with `role` and `accountStatus`.
- Session detection on client: [AppContext.tsx](src/context/AppContext.tsx) hits `/api/auth/session` (real session only).
- Protected admin routes: [admin/layout.tsx](src/app/admin/layout.tsx) server-side `redirect('/admin/login')` unless `session.user.role === 'ADMIN'`.
- Registration wizard + validation: [AppContext.tsx](src/context/AppContext.tsx) (`handleRegisterSubmit`, `regStep`), profile write [api/profile/route.ts](src/app/api/profile/route.ts).
- Duplicate prevention: `MatrimonialProfile.userId @unique` in [schema.prisma](prisma/schema.prisma); `upsertProfile` keys on `userId` so a user cannot create two profiles.
- Demo auth removed already (per `PROJECT_NOTES.md`, 2026-07-08) — confirmed: no `NEXT_PUBLIC_DEMO_MODE` gating in API routes.

**Problems found:**
- The brief specifies a **six-step** flow; the wizard uses `regStep` with the steps defined in the Home client. This is a labelling/UX detail — the fields (identity, location, education/occupation, community, preferences, consent) are all captured. **Confirm step count matches the client's expectation.**
- `AUTH_GOOGLE_ID/SECRET` fall back to `'dummy_id'/'dummy_secret'` in [auth.ts](src/auth.ts): login simply fails cleanly if unset (acceptable), but there is no explicit "gateway not configured" message.

**Security/privacy concerns:** Sessions are DB-backed (revocable). Roles come from the DB, not the token. Good.

**Changes implemented:** None required (already sound). Left intact per "don't rebuild working features."

**Remaining limitations:** Cancelled/failed Google login shows the default Auth.js error page — acceptable; a branded error page is optional.

**Required env vars:** `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. **Needs credentials to test live.**

**Testing result:** Code-level verified; typecheck/build clean. Live OAuth round-trip needs real Google credentials.

---

## 3. Profile privacy and photo approval

**Expected:** Guests restricted; logged-in-without-package restricted; package-based access; **server-side** enforcement; no private data leakage via API; phone/email/address protection; admin photo approval with pending/approved/rejected; re-upload after rejection; default placeholder; secure image access.

**Current status:** ✅ Fully working (server-enforced).

**Evidence / files:**
- Server-side redaction: [lib/profilePrivacy.ts](src/lib/profilePrivacy.ts) `redactProfile(...)` returns a **reduced object** (locked name, `+91-XXXXX-XXXXX`, DOB zeroed, education/occupation hidden by category) — the private fields never leave the server for unauthorised viewers.
- Applied in the API, not just CSS: [api/profiles/route.ts](src/app/api/profiles/route.ts) lines ~79–90 map every profile through `redactProfile` using the viewer's real purchases; single-profile route [api/profiles/[id]/route.ts](src/app/api/profiles/[id]/route.ts).
- Access rules: [lib/accessControl.ts](src/lib/accessControl.ts) `canViewFullProfile`, `getViewerPackageAccess`, `hasActivePackage` (checks `paymentStatus==='PAID'`, `accessStatus==='ACTIVE'`, non-expired).
- Photo approval states: `MatrimonialProfile.profileImageStatus` enum `PENDING|APPROVED|REJECTED` in [schema.prisma](prisma/schema.prisma); uploads set `PENDING` ([lib/profileStore.ts](src/lib/profileStore.ts) `updateProfileImage`); redaction hides `profileImageUrl` unless `APPROVED` or owner/admin ([profilePrivacy.ts](src/lib/profilePrivacy.ts) lines ~170–176).
- Re-upload after rejection: `updateProfileImage` overwrites and resets status to `PENDING` — works for rejected photos.
- Placeholder when not approved: [my-account/page.tsx](src/app/my-account/page.tsx) shows a 📷 placeholder when no approved image.

**Problems found:**
- Photo **approve/reject admin action** exists at the data layer via verification, but there is no dedicated "photo moderation queue" separate from profile verification — approval currently rides on profile `verificationStatus`. Adequate but not a distinct photo queue.
- Uploaded blobs use `access: 'public'` with the original filename ([api/upload/route.ts](src/app/api/upload/route.ts)) — URLs are unguessable enough via Blob, but a random suffix/namespacing would be stronger.

**Security/privacy concerns:** Strong. Privacy is enforced **server-side**, not via frontend hiding. Redacted payloads omit sensitive fields entirely.

**Changes implemented:** None to the core (already correct). See §15 for `robots` already disallowing `/my-account`, `/admin`, `/api`.

**Remaining limitations:** Consider a dedicated photo-approval queue and randomised blob paths.

**Required env vars:** `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`.

**Testing result:** Code-level verified redaction logic and status gating; build clean. Live image approval needs DB + Blob token.

---

## 4. Compatibility scoring

**Expected:** Real profile + partner-preference data; dynamic; no hardcoded %; safe with missing data; explain factors; consistent; clamp 0–100%.

**Current status before:** 🟡 Partially working — a real, data-driven additive score existed but was an **un-normalised raw point total** (max ~92), used only for sorting, never displayed or explained.
**Current status after:** ✅ Improved — normalised, clamped, factor-explained.

**Evidence / files:**
- Original inline logic: [SearchClient.tsx](src/app/search/SearchClient.tsx) (previously lines ~140–188) summed points for maslak/caste/location/relocation.
- **New:** [lib/compatibility.ts](src/lib/compatibility.ts) — `computeCompatibility(viewer, candidate)` returns `{ score: 0–100, factors[], applicableWeight }`. SearchClient now calls it ([SearchClient.tsx](src/app/search/SearchClient.tsx)).

**Documented formula (single source of truth in `lib/compatibility.ts`):**

Each factor contributes points up to a fixed weight; the score is `round(earned / applicableWeight × 100)` clamped to `[0,100]`, where **applicableWeight only includes factors both people supplied data for** (missing data is excluded, never counted as 0).

| Factor | Weight | Full credit | Partial credit |
|---|---|---|---|
| Maslak / sect | 30 | same maslak (×1.0 if viewer prefers same, else ×0.8) | different but "open to any" → ×0.5 |
| Biradari / community | 25 | same biradari (×1.0 if preferred, else ×0.8) | different but "open to any" → ×0.5 |
| Location | 30 | same district (×1.0) | same state ×0.7 / preferred-location ×0.6 |
| Relocation flexibility | 15 | either willing (×1.0) | neither ×0.4 |

**Problems found (original):** raw total not bounded to 100%, no factor explanation, no display.

**Changes implemented:** New shared library; normalisation + clamping; factor breakdown available (`compatibilityFactors`) for the UI. Sorting preserved. Not-logged-in users get score 0 (original order preserved).

**Remaining limitations:** The numeric % and factor list are **computed and available** but not yet rendered as a visible badge on the profile card (kept out to avoid design changes). Wiring the badge is a small front-end follow-up.

**Required env vars:** none (pure function).

**Testing result:** Typecheck/build clean. Deterministic pure function — same inputs give same output by construction.

---

## 5. Four membership packages

**Expected:** Gold, Good Profile, High Profile, Second Marriage; names, prices, validity, benefits, access restrictions, purchase history, active/expired, renewal, admin management, correct display, server-side authorization; **single central config**.

**Current status:** ✅ Fully working, with a **naming-mapping note**.

**Evidence / files:**
- **Single source of truth:** [lib/packages.ts](src/lib/packages.ts) `PREMIUM_PACKAGES` — the only place prices/GST/benefits/billing live; Prisma `PackageType` enum mirrors the keys.
- Server-side authorization: [lib/accessControl.ts](src/lib/accessControl.ts) `getViewerPackageAccess`; high-profile additionally requires `eligibilityStatus==='APPROVED'`.
- Purchase history / active-expired: `PackagePurchase` model with `expiryDate`, `accessStatus`, `paymentStatus` ([schema.prisma](prisma/schema.prisma)); user view [api/user/purchases/route.ts](src/app/api/user/purchases/route.ts); admin view [api/admin/packages/route.ts](src/app/api/admin/packages/route.ts).
- Admin management: [admin/packages/page.tsx](src/app/admin/packages/page.tsx).

**Naming mapping (IMPORTANT — no data was renamed, per "preserve DB data"):**

| Brief name | Internal key | Customer label in `PREMIUM_PACKAGES` | Price (incl. 18% GST) |
|---|---|---|---|
| (Monthly membership) | `monthly_membership` | Monthly Membership | ₹354 |
| Good Profile | `good_profile_package` | Good Profile Package | ₹6,490 (+₹21,000 success fee) |
| Second Marriage | `second_marriage_package` | Second Marriage | ₹12,980 |
| "Gold" / High Profile | `high_profile_package` | Premium Match Access | ₹24,780 (+₹25,000 success fee) |

> The brief's "Gold" maps to the internal `high_profile_package` (`PACKAGE_KEYS.GOLD`). The customer-facing label is "Premium Match Access". **Renaming was deliberately avoided** because lead records store historical labels (`PACKAGE_LEAD_LABELS`) and renaming would orphan them. If the client wants the visible label changed to "Gold", it is a one-line change in `PREMIUM_PACKAGES[...].name` plus a new alias in `PACKAGE_LEAD_LABELS`.

**Problems found:** Purchases have no explicit `currency` column (INR is implied). Renewal is manual (buy again) — no auto-renew subscription.

**Security/privacy concerns:** Authorization is server-side and package-specific. Good.

**Changes implemented:** None to package definitions (already central and correct).

**Remaining limitations:** No auto-renew; `currency` implied not stored.

**Required env vars:** `DATABASE_URL`.

**Testing result:** Code-level verified against the central config and access-control functions; build clean.

---

## 6. Razorpay payments

**Expected:** Dev/test may charge ₹1; **production must charge real price**; never trust browser amount; fetch price from server; create orders server-side; verify signature; prevent duplicates; store payment/order/signature/amount/currency/package; activate only after verified payment; handle success/fail/cancel/pending; webhook; history in dashboard + admin; no secret exposure; env separation.

**Current status:** ✅ Fully working after hardening. The brief's "charges only ₹1" concern was **already not true** in this codebase — the order route already computed the real price server-side.

**Evidence / files:**
- Order creation, **server-computed price**: [api/payment/order/route.ts](src/app/api/payment/order/route.ts) — amount derived from `PREMIUM_PACKAGES[packageType]`, the browser-sent amount is ignored entirely.
- Signature verification + idempotency: [api/payment/verify/route.ts](src/app/api/payment/verify/route.ts) — HMAC-SHA256 of `orderId|paymentId`, early-return if already `PAID`.
- Activation only after verify: `verifyPackagePurchase` sets `PAID`, sets `expiryDate`, flips monthly `hasPaid` ([lib/profileStore.ts](src/lib/profileStore.ts)).
- Secrets never sent to client: order route returns only `keyId` (public), never the secret.

**Problems found & fixed:**
1. **Explicit ₹1 test mode added, force-disabled in production.** `RAZORPAY_TEST_MODE=true` charges ₹1 in development only; in production it is **ignored** (real price charged) and logs a warning. Stored amounts reflect what was actually charged, with an internal note. ([api/payment/order/route.ts](src/app/api/payment/order/route.ts)).
2. **Test-key guard.** Live checkout with `rzp_test_...` keys in production is rejected with a 503 ([api/payment/order/route.ts](src/app/api/payment/order/route.ts)).
3. **Ownership check added** in verify: the order being verified must belong to the signed-in user's own profile, else 403 ([api/payment/verify/route.ts](src/app/api/payment/verify/route.ts)).
4. **Webhook added** — new [api/payment/webhook/route.ts](src/app/api/payment/webhook/route.ts): verifies `x-razorpay-signature` with `RAZORPAY_WEBHOOK_SECRET` (constant-time compare), handles `payment.captured`/`order.paid`, idempotent activation, and avoids duplicate membership emails on retries. Rejects unsigned calls when secret unset.

**Stored fields:** payment ID, order ID (`@unique`), payment status, base/GST/total amount, billing type, success-fee, expiry, access status — in `PackagePurchase`. Signature itself is verified, not stored (standard). **Currency not stored** (INR implied) — minor.

**Security/privacy concerns:** Amount is server-trusted; signatures verified; duplicates prevented; secrets not exposed. Strong.

**Changes implemented:** Items 1–4 above; `createPackagePurchase` extended to accept an internal note.

**Remaining limitations:** No stored `currency` column; no partial-refund flow. **Live payment round-trip needs real Razorpay keys + a webhook secret configured in the Razorpay dashboard.**

**Required env vars:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, optional `RAZORPAY_TEST_MODE`. **Needs credentials to test live.**

**Testing result:** Code-level verified (price derivation, signature HMAC, idempotency, ownership, webhook signature). Build clean. Live charge/verify/webhook **not executable here** (dummy keys).

---

## 7. User dashboard

**Expected:** completion %, edit profile, photo upload/manage, membership status, purchase history, expiry, viewed/shortlisted profiles, received/sent interests, recommendations, notifications, settings, logout, delete/deactivate. No fake stats.

**Current status:** 🟡 Partially working.

**Evidence / files:** [my-account/page.tsx](src/app/my-account/page.tsx) — real profile status (verification, completeness enum, category), **real** photo upload (calls `/api/upload`), membership status and active packages from `/api/user/purchases`, edit-profile entry point, quick links. No fabricated numbers.

**Problems found (missing sub-features):**
- **Completion %** shown as an enum (COMPLETE/INCOMPLETE), not a percentage.
- **Purchase history with dates/amounts** and **explicit expiry date** not shown (only active package names).
- **Viewed profiles, shortlisted profiles, received/sent interests, in-app notifications, account settings, delete/deactivate** — **not implemented at the data layer.** There are no `Interest`, `Shortlist`, `ViewedProfile`, or user-facing `Notification` models in [schema.prisma](prisma/schema.prisma). (`savedProfiles` exists only as ephemeral client state in [AppContext.tsx](src/context/AppContext.tsx); `ProfileInterestForm`/`ProfileInterestForm.tsx` submits a **lead**, not a persistent interest record.)

**Security/privacy concerns:** None; no fake statistics are shown (good — complies with "do not show fake statistics").

**Changes implemented:** None this pass (scope prioritised toward explicitly-flagged broken items). These are genuine **missing features** documented here for the next phase.

**Remaining limitations:** Interests/shortlist/viewed/notifications/settings/delete-account require new models + APIs + UI — a sizeable feature block, not yet built.

**Required env vars:** `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`.

**Testing result:** Existing dashboard compiles and reads real data. Missing items confirmed absent by schema inspection.

---

## 8. Admin panel

**Expected:** secure role-based access; dashboard stats, profiles, profile approval, photo approval, verification queue, packages, payments, leads, success stories, contact submissions, master data, website settings, notifications, referral settings, reported/blocked profiles, admin users/permissions; all via protected server APIs.

**Current status:** ✅ Mostly working; a few sub-areas missing.

**Evidence / files:**
- **Role-gated** at the layout: [admin/layout.tsx](src/app/admin/layout.tsx) (`redirect` unless `ADMIN`); every admin API re-checks `session.user.role === 'ADMIN'` (e.g. [api/admin/settings/route.ts](src/app/api/admin/settings/route.ts), [api/admin/leads/route.ts](src/app/api/admin/leads/route.ts), [api/admin/success-stories/route.ts](src/app/api/admin/success-stories/route.ts)).
- Pages: [overview](src/app/admin/page.tsx), [profiles](src/app/admin/profiles/page.tsx), [verification](src/app/admin/verification/page.tsx), [packages](src/app/admin/packages/page.tsx), [leads](src/app/admin/leads/page.tsx), [events](src/app/admin/events/page.tsx), [master-data](src/app/admin/master-data/page.tsx), [logs](src/app/admin/logs/page.tsx), [settings](src/app/admin/settings/page.tsx), and **new** [success-stories](src/app/admin/success-stories/page.tsx).
- Middleware (`proxy`): [src/proxy.ts](src/proxy.ts) forwards `x-pathname` so the layout can bypass the gate only for `/admin/login`.

**Problems found:**
- **Reported/blocked profiles** and **admin users/permissions management** — not present (only `Role USER|ADMIN` exists; no in-app admin-user CRUD). "Contact submissions" are handled as **Leads** (there is no separate contact model) — acceptable.
- Admin role is assigned directly in the DB (no UI to promote/demote).

**Security/privacy concerns:** Defence-in-depth is correct: layout gate **and** per-route role checks. Admin routes excluded from indexing (§15).

**Changes implemented:** Added Success Stories admin (page + API + sidebar link), extended Settings (referral persistence + public contact fields).

**Remaining limitations:** No report/block workflow; no admin-user management UI.

**Required env vars:** `DATABASE_URL`, `AUTH_*`.

**Testing result:** Build compiles all admin routes; role checks verified in code. Live admin login needs Google + an `ADMIN` row.

---

## 9. Leads, verification and master data

**Expected:** lead creation/source/status/notes/assignee/call+WhatsApp/convert; verification status + doc verification; caste/sub-caste/religion/location/education/occupation master data; duplicate prevention; merge/rename; safe deletion.

**Current status:** ✅ Working (leads + verification + master data), 🟡 a couple of gaps.

**Evidence / files:**
- Leads: model `Lead` ([schema.prisma](prisma/schema.prisma)) with `status`, `priority`, `inquiryType`, `sourcePage`, `adminNotes`; create/update/delete in [lib/profileStore.ts](src/lib/profileStore.ts); public capture [api/leads/route.ts](src/app/api/leads/route.ts); admin [api/admin/leads/route.ts](src/app/api/admin/leads/route.ts) + [[id]](src/app/api/admin/leads/[id]/route.ts).
- Verification queue + audit log: `VerificationRequest`, `AuditLog`; `updateVerificationStatus` writes status + audit entry ([lib/profileStore.ts](src/lib/profileStore.ts)); UI [components/VerificationQueue.tsx](src/components/VerificationQueue.tsx).
- Master data: `MaslakOption`, `CasteOption`, `LocationOption` with `@unique` labels (**duplicate prevention**), `mergeCastes`/`mergeLocations` (**merge**), `toggleDisable*` (**safe soft-delete instead of hard delete when in use**) — all in [lib/profileStore.ts](src/lib/profileStore.ts); admin [api/admin/master-data/route.ts](src/app/api/admin/master-data/route.ts).

**Problems found:**
- **Assigned admin** exists on `VerificationRequest` but there is no "assign to me / reassign" UI beyond the reviewing admin being recorded.
- **Call/WhatsApp actions** exist as buttons ([components/CallButton.tsx](src/components/CallButton.tsx), [components/WhatsAppButton.tsx](src/components/WhatsAppButton.tsx)) but are site-wide support buttons, not per-lead quick-actions in the admin lead row.
- **Lead → registered user conversion** is manual (status `converted`); no automated account provisioning.
- **Identity/document verification** is phone-call-based (notes), not file-upload KYC.

**Security/privacy concerns:** Master-data deletion uses disable (soft) to avoid orphaning profiles that reference a caste/location. Good.

**Changes implemented:** None (already solid); centralised the WhatsApp number used by the buttons (see §12).

**Remaining limitations:** Per-lead call/WhatsApp quick actions and automated lead conversion are future enhancements.

**Required env vars:** `DATABASE_URL`.

**Testing result:** Code-level verified CRUD + merge + soft-delete; build clean.

---

## 10. Success stories — **converted from hardcoded to DB-managed** ✅ (new feature)

**Expected:** DB model; admin create/edit/publish/unpublish/delete; couple names, content, images, marriage date, display order, featured, active/published; dynamic public page; remove hardcoded only after dynamic works.

**Status before:** 🧪 Hardcoded — three static cards from i18n strings ([SuccessStoriesClient.tsx](src/app/success-stories/SuccessStoriesClient.tsx) previously hardcoded `story1/2/3`).
**Status after:** ✅ Fully DB-managed.

**Changes implemented:**
- **New model** `SuccessStory` ([schema.prisma](prisma/schema.prisma)): `coupleNames`, `location`, `story`, `imageUrl`, `marriageDate`, `displayOrder`, `isFeatured`, `isPublished`, `createdById`, timestamps.
- **New store** [lib/successStories.ts](src/lib/successStories.ts): `getPublishedSuccessStories`, `getAllSuccessStories`, `createSuccessStory`, `updateSuccessStory`, `deleteSuccessStory`, with the **same fallback discipline** as profiles (throws in production without `ALLOW_DB_FALLBACK`; bundled seed only in fallback-allowed mode). Seed content = the original three stories, flagged `isSample: true`, never written to DB.
- **Public API** [api/success-stories/route.ts](src/app/api/success-stories/route.ts) — published only, never 500s.
- **Admin API** [api/admin/success-stories/route.ts](src/app/api/admin/success-stories/route.ts) — GET/POST/PUT/DELETE, admin-only, validated.
- **Admin page** [admin/success-stories/page.tsx](src/app/admin/success-stories/page.tsx) — full CRUD, publish/unpublish toggle, featured, display order; sidebar link added ([AdminSidebar.tsx](src/components/AdminSidebar.tsx)).
- **Dynamic public page** [SuccessStoriesClient.tsx](src/app/success-stories/SuccessStoriesClient.tsx) — fetches `/api/success-stories`, renders loading/empty states, uses the existing card design; `SuccessStoryCard` gained an optional `imageUrl` prop ([NikahComponents.tsx](src/components/NikahComponents.tsx)) so admin photos override the bundled image without layout changes.

**Hardcoded logic removed:** the three inline story cards. The seed lives in the store as an explicit, flagged fallback (not in the component), so the page is never blank before the admin adds real stories — satisfying "remove hardcoded only after the dynamic replacement works."

**Security/privacy concerns:** Only published stories are exposed publicly; drafts are admin-only.

**Required env vars:** `DATABASE_URL` (and `BLOB_READ_WRITE_TOKEN` if uploading couple photos rather than pasting URLs).

**Testing result:** Typecheck/build clean; routes emitted. Live create/publish needs `DATABASE_URL`.

---

## 11. Referral commission settings — **now persisted** ✅ (repaired)

**Expected:** value stored in DB; survives refresh/restart/deploy; admin panel loads saved value; validation; only admins update; updated-at/by; calculations use the saved DB value.

**Status before:** 🔴 Broken — the slider ([AdminSidebar.tsx](src/components/AdminSidebar.tsx)) wrote only to client state `referralRate` (default 21) in [AppContext.tsx](src/context/AppContext.tsx); **nothing was persisted**; a refresh reset it.

**Changes implemented:**
- **DB fields** on `GlobalSettings`: `referralCommissionPercent` (default 21), `referralUpdatedById`, `referralUpdatedAt` ([schema.prisma](prisma/schema.prisma)).
- **Persistence + validation** in [api/admin/settings/route.ts](src/app/api/admin/settings/route.ts): admin-only; value validated to the approved **20–23%** band; records `referralUpdatedById` + `referralUpdatedAt`; only touches referral fields when a value is supplied (saving other settings never resets it).
- **Slider now loads + saves** ([AdminSidebar.tsx](src/components/AdminSidebar.tsx)): loads the saved value on mount; persists on release (`onMouseUp`/`onTouchEnd`) with a Saving…/✓ Saved status.
- **Server helper** [lib/referral.ts](src/lib/referral.ts): `getReferralCommissionPercent()` (reads DB, clamps to band, safe default) and `calculateReferralCommission(amount)` — the value referral payouts must use, never a client default.

**Security/privacy concerns:** Only `ADMIN` can update; value clamped to the valid band; updater recorded.

**Remaining limitations:** There is **no referral payout flow wired to purchases yet** (the referral/marketplace system is a not-yet-built phase). The persisted value + calculation helper are the single source of truth ready for that flow.

**Required env vars:** `DATABASE_URL`.

**Testing result:** Typecheck/build clean; validation logic verified in code. Live persistence needs `DATABASE_URL`.

---

## 12. Notifications and communication

**Expected:** WhatsApp/call buttons, contact-form notifications, registration/approval/photo/payment/membership/admin-lead emails, in-app notifications; env-based email; graceful no-key handling (no crash, safe log, honest fallback, never falsely claim delivery); WhatsApp/phone/email from **central settings**.

**Current status:** ✅ Mostly working; 🟡 one deployment caveat.

**Evidence / files:**
- Email/SMS senders with mock fallback: [lib/notifications.ts](src/lib/notifications.ts) — if `RESEND_API_KEY` unset, logs `[Mock Email]` and returns a mock id; **never claims real delivery to the user** (user-facing copy is generic). Every send is logged (masked recipient) to `NotificationLog`.
- Templates: [lib/emailTemplates.ts](src/lib/emailTemplates.ts) (registration, approved, rejected, follow-up, membership, admin alerts).
- Hooks: registration, verification status, membership activation, admin new-profile, admin new-lead.
- WhatsApp/call buttons: [components/WhatsAppButton.tsx](src/components/WhatsAppButton.tsx), [components/CallButton.tsx](src/components/CallButton.tsx).

**Problems found & fixed:**
- **WhatsApp number was hardcoded** (`919170975535` in [lib/whatsapp.ts](src/lib/whatsapp.ts)). **Fixed:** the floating WhatsApp button now fetches the number from the central `/api/business-location` endpoint (backed by `GlobalSettings`), falling back to the bundled default. New settings fields `whatsappNumber`, `publicPhone`, `publicEmail` on `GlobalSettings`, editable in [admin/settings/page.tsx](src/app/admin/settings/page.tsx), surfaced via [api/business-location/route.ts](src/app/api/business-location/route.ts).

**Problems found (open):**
- **`setImmediate` fire-and-forget** ([lib/notifications.ts](src/lib/notifications.ts)) will **not reliably execute on Vercel serverless**, because the function may freeze/terminate after the HTTP response is returned. Emails/SMS may silently not send in production. **Recommended fix:** `await` the send, or use `after()` / `waitUntil()` so the platform keeps the function alive. Flagged, not yet changed (would alter the request latency profile — needs a decision).
- No dedicated **payment-confirmation** email distinct from membership-activation (membership email covers it).
- **In-app notifications**: `NotificationLog` is an outbound audit log, not a user-facing notification feed (see §7).

**Security/privacy concerns:** Recipients are masked in logs. No false delivery claims. Good.

**Changes implemented:** WhatsApp/contact centralisation (above).

**Remaining limitations:** `setImmediate` reliability on serverless; no in-app notification feed.

**Required env vars:** `RESEND_API_KEY`, `EMAIL_FROM`, `SMS_PROVIDER`. **Needs credentials to test live email/SMS.**

**Testing result:** Code-level verified fallback + masking + centralised WhatsApp; build clean. Live email needs a Resend key.

---

## 13. Security and spam protection

**Expected:** input validation, output sanitisation, rate limiting, login-attempt protection, API abuse prevention, CSRF, secure cookies, auth middleware, authorization checks, admin route protection, file-upload validation, image type/size limits, honeypot, contact spam protection, dedupe, security headers, safe errors, private-data protection, NoSQL-injection protection, env-secret protection.

**Current status:** ✅ Strong; a few hardening items noted.

**Evidence / files:**
- **Rate limiting:** [lib/rateLimit.ts](src/lib/rateLimit.ts) used by leads (5/min) and profile (10/min); chatbot has its own 30/min ([api/chatbot/route.ts](src/app/api/chatbot/route.ts)).
- **Honeypot + dedupe + sanitisation:** [api/leads/route.ts](src/app/api/leads/route.ts) — `_honey` silent-accept, HTML-tag stripping, phone validation, 2-minute duplicate window.
- **Upload validation:** [api/upload/route.ts](src/app/api/upload/route.ts) — auth required, MIME allowlist (jpg/png/webp), 4 MB size cap, Blob token presence check.
- **Authorization:** admin layout + per-route role checks (§8); payment ownership check (§6).
- **Security headers:** [next.config.ts](next.config.ts) — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, **and `Strict-Transport-Security` (added this pass)**.
- **NoSQL injection:** queries go through Prisma (parameterised); IDs coerced via `getValidObjectId` ([lib/profileStore.ts](src/lib/profileStore.ts)) so malformed IDs can't reach the driver raw.
- **Secret protection:** connection strings scrubbed from logs (`sanitizeErrorMessage`); order route never returns the Razorpay secret; chatbot error details no longer returned to the client (fixed this pass).

**Problems found:**
- **No Content-Security-Policy** header. Not added because the app uses inline styles, Google Fonts, Razorpay checkout script, and Unsplash/Blob images — a CSP needs careful testing to avoid breakage. **Recommended** as a dedicated task.
- **CSRF:** state-changing APIs rely on the Auth.js session cookie; NextAuth sets secure, `SameSite=Lax` cookies (mitigates cross-site POSTs). No explicit CSRF token on custom POST routes — acceptable given `SameSite` but worth noting.
- **Login-attempt throttling** is handled by Google (OAuth), so there is no local password brute-force surface.
- Upload uses client-declared MIME (no magic-byte sniff) and public blob with original filename.

**Security/privacy concerns:** Overall strong; the above are hardening opportunities, not active vulnerabilities.

**Changes implemented:** Added HSTS ([next.config.ts](next.config.ts)); removed chatbot error-detail leak ([api/chatbot/route.ts](src/app/api/chatbot/route.ts)); payment ownership check (§6); webhook signature verification (§6).

**Remaining limitations:** CSP, magic-byte upload sniffing, explicit CSRF tokens — recommended follow-ups.

**Required env vars:** all auth/payment secrets as listed.

**Testing result:** Headers verified in config; validation/honeypot/rate-limit verified in code; build clean.

---

## 14. Database fallback and mock profiles

**Expected:** MongoDB primary; mock never overwrites real data; dev vs prod separation; production shows controlled unavailable state, not silent fakes (unless explicitly enabled); mock clearly flagged; payments/memberships/admin/verification never rely on in-memory; safe logging; **auto-return to real DB when restored**.

**Status before:** 🟡 Mostly good but two gaps: (a) once a connection failed, the result was cached **forever** (no auto-recovery), and (b) an empty/small DB **silently supplemented fake profiles even in production**.

**Changes implemented:**
- **Auto-recovery** ([lib/profileStore.ts](src/lib/profileStore.ts) `testDbConnection`): the probe result is now cached with a **short TTL** (60s when healthy, 15s when down) and re-checked, so the app **switches back to the live DB automatically** once it returns (logs "MongoDB connection restored"). Previously the first failure stuck permanently.
- **Production no longer shows silent fakes:** the empty-DB sample showcase in `getAllProfiles` and the "<12 profiles → supplement with samples" net in [api/profiles/route.ts](src/app/api/profiles/route.ts) are now **gated behind `isFallbackAllowed()`** (dev, or prod with `ALLOW_DB_FALLBACK=true`). Normal production returns the real (possibly empty) result.

**Already-correct behaviour (verified):**
- `isFallbackAllowed()` returns **false** in production unless `ALLOW_DB_FALLBACK=true` → DB errors **throw** instead of serving mocks ([lib/profileStore.ts](src/lib/profileStore.ts)).
- Mock profiles are sourced from [lib/sampleProfiles.ts](src/lib/sampleProfiles.ts) and are read-only; writes always target the DB first and only fall back in dev.
- Connection strings are scrubbed from logs.

**Problems found (open):** Mock rows are identifiable by their sample ids/`isSample` flag internally, but the **public API does not tag** a served-sample profile with a machine flag (they are visually just profiles). In `ALLOW_DB_FALLBACK` mode this is intentional showcase behaviour.

**Security/privacy concerns:** Payments/memberships/verification never rely on in-memory in production (they throw instead). Good.

**Changes implemented:** Auto-recovery TTL; production fake-profile gating.

**Remaining limitations:** No explicit `isSample` marker on public profile payloads (only relevant when fallback is enabled).

**Required env vars:** `DATABASE_URL`, `ALLOW_DB_FALLBACK`.

**Testing result:** Code-level verified TTL logic and gating; build clean. Live failover needs a real DB to toggle.

---

## 15. SEO and mobile responsiveness

**Expected:** unique titles/descriptions, canonical, OG, Twitter, sitemap, robots, structured data, profile-indexing rules, no private-profile indexing, semantic headings, alt text, mobile/tablet responsiveness, navbar, forms, tables on mobile, touch targets, no overflow, performance, image optimisation.

**Current status:** ✅ Good; minor gaps.

**Evidence / files:**
- Metadata base + OG: [layout.tsx](src/app/layout.tsx) (`metadataBase`, title, description, OG image). Per-page metadata in each `page.tsx`.
- Sitemap: [sitemap.ts](src/app/sitemap.ts) (uses `NEXT_PUBLIC_SITE_URL`). Robots: [robots.ts](src/app/robots.ts) — **disallows `/admin/`, `/my-account/`, `/api/`** (private areas not indexed).
- Structured data: [components/JsonLd.tsx](src/components/JsonLd.tsx).
- **No individual profile URLs** — profiles render in a modal/search, so there is **no private-profile page to index** (privacy-positive by design).
- Images via `next/image`; responsive CSS in [globals.css](src/app/globals.css) with mobile menu drawer ([Navbar.tsx](src/components/Navbar.tsx)).

**Problems found:**
- Sitemap **omits** `/privacy-policy`, `/terms-and-conditions`, `/event-management` (minor).
- `metadataBase` in [layout.tsx](src/app/layout.tsx) is hardcoded to `https://asannikah.com` while `sitemap`/`robots` read `NEXT_PUBLIC_SITE_URL` — align these to one source.
- No Twitter-card block explicitly (OG is present; Twitter falls back to OG).

**Security/privacy concerns:** Private routes correctly excluded from robots; no per-profile indexable pages. Good.

**Changes implemented:** None to SEO this pass (kept design/behaviour stable). Recommendations logged.

**Remaining limitations:** Sitemap completeness, unify site URL source, explicit Twitter card.

**Required env vars:** `NEXT_PUBLIC_SITE_URL`.

**Testing result:** `sitemap.xml` and `robots.txt` build as static routes; verified in build output.

---

## 16. AI chatbot

**Expected:** uses configured API when key present; no prompt/secret/user-data exposure; on-topic; graceful failure; clearly-flagged fallback (not passed off as live AI); rate limiting; safe history handling.

**Current status:** ✅ Working, with one bug fixed.

**Evidence / files:** [api/chatbot/route.ts](src/app/api/chatbot/route.ts) — Gemini/OpenAI providers; **fallback when no key**, response tagged `isFallback: true` ([lib/chatbotFallback.ts](src/lib/chatbotFallback.ts)); system prompt server-side only ([lib/chatbotPrompt.ts](src/lib/chatbotPrompt.ts)); rate limit 30/min per IP; input validation (non-empty, ≤1000 chars, anti-repeat).

**Problems found & fixed:**
- **Double `req.json()` bug** — the catch block re-read the already-consumed request body, so on an upstream API failure the fallback lost the user's message context. **Fixed** by hoisting `message` and reusing it ([api/chatbot/route.ts](src/app/api/chatbot/route.ts)).
- **Error-detail leak** — the fallback previously returned `errorDetails` (upstream error text) to the client. **Removed** (kept server-side log only).

**Security/privacy concerns:** System prompt and API key never sent to the client; fallback honestly flagged; errors no longer leaked. Good.

**Changes implemented:** Both fixes above.

**Remaining limitations:** Rate limit is per-instance in-memory (resets on cold start / not shared across serverless instances) — acceptable for light abuse protection; a shared store (e.g. Upstash) would be stronger.

**Required env vars:** `AI_CHATBOT_API_KEY`, `AI_CHATBOT_PROVIDER`, `AI_CHATBOT_MODEL`. **Needs a key to test live AI (fallback works without).**

**Testing result:** Code-level verified fallback flag + fix; build clean.

---

## Environment-variable audit

`.env.example` was rewritten ([.env.example](.env.example)) — removed the stale `NEXT_PUBLIC_DEMO_MODE` and dummy-key "simulator" language; documented every variable and the test/prod separation.

| Variable | Purpose | Required for |
|---|---|---|
| `DATABASE_URL` | MongoDB Atlas connection | Everything (primary source of truth) |
| `ALLOW_DB_FALLBACK` | Enable sample/showcase fallback (keep `false` in prod) | Dev UX |
| `AUTH_SECRET` | Auth.js session/crypto secret | Auth |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth | Login |
| `NEXT_PUBLIC_SITE_URL` | SEO metadata, sitemap, robots, canonical | SEO |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob image storage | Photo upload |
| `RESEND_API_KEY` / `EMAIL_FROM` | Email (blank ⇒ safe mock) | Email notifications |
| `SMS_PROVIDER` | `REAL` vs mock SMS | SMS notifications |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay checkout | Payments |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification | Payment webhook |
| `RAZORPAY_TEST_MODE` | ₹1 dev testing (force-disabled in prod) | Dev payment testing |
| `AI_CHATBOT_API_KEY` / `AI_CHATBOT_PROVIDER` / `AI_CHATBOT_MODEL` | AI chatbot (blank ⇒ fallback) | Chatbot |

Public contact details (WhatsApp/phone/email/address/social) are **not** env vars — they live in `GlobalSettings` (Admin → Settings), with bundled defaults in [lib/businessLocation.ts](src/lib/businessLocation.ts). No real credentials are committed anywhere in source.

---

## Final implementation summary

### 1. Fully working features (verified at code level; build/lint/typecheck clean)
- Google auth, DB-backed sessions, protected admin routes (layout gate + per-route role checks).
- Server-side privacy redaction + package-based access control; photo approval states.
- Four membership packages from a single central config; server-side authorization; purchase history/expiry.
- Razorpay: server-computed price (never trusts the browser), signature verification, idempotent activation.
- Leads with honeypot + rate-limit + dedupe; verification queue + audit log; master data with duplicate-prevention, merge and safe soft-delete.
- Chatbot with provider abstraction, rate limiting, and honestly-flagged fallback.
- SEO (metadata, sitemap, robots excluding private areas, JSON-LD); responsive layout.

### 2. Features repaired
- **Referral commission now persists** to `GlobalSettings` (validated 20–23%, with updated-by/at); slider loads + saves; server helper for calculations.
- **DB fallback auto-recovers** (TTL re-check) and **no longer serves fake profiles in production** (gated behind `ALLOW_DB_FALLBACK`).
- **WhatsApp/contact centralised** to settings (was hardcoded).
- **Payments hardened:** explicit ₹1 test mode force-disabled in production; test-key guard; ownership check on verify; error-detail no longer leaked.
- **Chatbot double-`req.json()` bug fixed**; error-detail leak removed.
- **Compatibility scoring normalised** to 0–100% with a documented formula + factor breakdown.
- **HSTS** security header added.

### 3. New features added
- **Success Stories are now DB-managed** end-to-end: `SuccessStory` model, store with safe seed fallback, public API, admin CRUD API, admin management page (create/edit/publish/unpublish/delete/feature/order), dynamic public page, sidebar link.
- **Razorpay webhook** (`/api/payment/webhook`) with signature verification and idempotent activation.
- **Central contact fields** (`whatsappNumber`, `publicPhone`, `publicEmail`) in settings + business-location API + admin UI.
- **Shared compatibility library** (`lib/compatibility.ts`) and **referral helper** (`lib/referral.ts`).

### 4. Hardcoded logic removed
- The three inline hardcoded success-story cards → DB-driven (seed retained only as an explicit, flagged fallback in the store, not in the component).
- Hardcoded WhatsApp number in `lib/whatsapp.ts` → sourced from central settings (default retained as fallback).
- Stale `NEXT_PUBLIC_DEMO_MODE` and "simulator" dummy-key language removed from `.env.example`.

### 5. Database changes (additive & MongoDB-safe — no destructive migration, no reseed)
- **New model:** `SuccessStory`.
- **`GlobalSettings` new fields:** `whatsappNumber`, `publicPhone`, `publicEmail`, `referralCommissionPercent` (default 21), `referralUpdatedById`, `referralUpdatedAt`.
- All additive with defaults/nullable, so **existing users, profiles, payments, leads, and package history are untouched.** `prisma generate` succeeds; apply to Atlas with `prisma db push` at deploy (new fields backfill from defaults on read; new collection is created on first write). **No existing data was deleted, reset, or reseeded.**

### 6. Environment variables still required (to run features live)
- Real `DATABASE_URL` (MongoDB Atlas) — this environment only had a placeholder, so **no live DB flow could be executed here**.
- `AUTH_GOOGLE_ID/SECRET` + `AUTH_SECRET` — for real login.
- `RAZORPAY_KEY_ID/SECRET` (+ `RAZORPAY_WEBHOOK_SECRET`) — for real payments/webhook.
- `RESEND_API_KEY` — for real emails (mock otherwise).
- `BLOB_READ_WRITE_TOKEN` — for photo uploads.
- `AI_CHATBOT_API_KEY` — for live AI (fallback works without).

### 7. Security improvements
- HSTS header; payment ownership check; webhook signature verification; test-key-in-prod guard; ₹1 test mode force-disabled in prod; chatbot error-detail leak removed; production fake-profile gating.

### 8. Remaining limitations (documented, not yet built)
- Dashboard **viewed/shortlisted/interests/in-app notifications/account-settings/delete-account** — need new models + APIs + UI.
- **Reported/blocked profiles** and **admin-user management UI** — not present.
- **Referral payout flow** wired to purchases — the persisted value + helper exist, the payout system does not.
- **`setImmediate` notifications** may not run on Vercel serverless — recommend `after()`/`await`.
- **CSP header**, upload magic-byte sniffing, explicit CSRF tokens — recommended hardening.
- **Pagination/server-side search**, sitemap completeness, unify site-URL source, visible compatibility badge — enhancements.
- Auto-renew subscriptions and stored `currency` column — not implemented.

### 9. Build, lint and test results
- **`npx tsc --noEmit`** — ✅ clean (no type errors).
- **`eslint`** — ✅ clean in `src/`. The only reported errors are in **pre-existing helper scripts** (`debug_git.js`, `run_deploy.js`, `scripts/*.js`, `test-db.js`, `scripts/seed.ts`) using `require()`/`any` — unrelated to this work and not shipped in the app bundle.
- **`npm run build`** (`prisma generate && next build`) — ✅ compiled successfully; all 50+ routes emitted including the new `/api/success-stories`, `/api/admin/success-stories`, `/api/payment/webhook`, and `/admin/success-stories`. The `prisma:error … Malformed label: <cluster>` lines during build are expected here because this environment's `.env` has **placeholder** DB credentials; page metadata that reads settings catches the error and falls back to defaults (build still succeeds).
- **Live end-to-end tests** (auth, payment, DB reads/writes, email) — **not executed**: this environment has no real MongoDB / OAuth / Razorpay / Resend credentials. All feature verification above is **code-level + build**, clearly distinguished from live testing as instructed.
