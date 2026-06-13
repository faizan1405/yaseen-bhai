# MOM — Matrimonial Site Project Notes

This file tracks the approved decisions, architecture, system design, business rules, and phase progress for the MOM Matrimonial Site.

---

## 1. Project Overview & Target Audience
* **Project Name**: MOM — Matrimonial Site
* **Core Value Proposition**: A secure, trusted, Shariah-compliant Muslim matrimonial platform with manual verification, privacy controls, and premium personalized match-making packages.
* **Key Targets**: Muslim community looking for marriage, with dedicated options for general, second-marriages, and high-profile individuals.

---

## 2. Approved Business Rules & Pricing Models
| Package / Service | Cost (Excl. GST) | GST (18%) | Total Price | Billing Cycle / Milestones | Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard Monthly Membership** | ₹300 | ₹54 | ₹354 | Monthly | Mandatory to view unblurred photos & phone numbers, search, and access standard matches. |
| **Curated Profiles** | ₹5,500 | ₹990 | ₹6,490 | One-time + Success fee | Selected premium profiles, leads provided until marriage. Success fee: **₹21,000** after marriage confirmation. |
| **Second-Marriage Profiles** | ₹11,000 | ₹1,980 | ₹12,980 | One-time | Separate private category, leads provided until marriage. |
| **High-Profile Matches** | ₹21,000 | ₹3,780 | ₹24,780 | One-time + Success fee | For doctors, engineers, business owners, or income > ₹10 LPA. Success fee: **₹25,000** after marriage confirmation. |

### Operational Rules
* **GST Rate**: 18% (to be added dynamically to all transactions on Razorpay).
* **Referral Commission**: Adjustable admin setting between 20% and 23%.
* **Verification**: Manual phone-call verification required for all profiles before they appear in search.
* **Privacy**: Photos and phone numbers must be blurred/hidden for non-logged-in and non-paid users.

---

## 3. Technology Stack & Architecture
* **Frontend**: Next.js 16 (App Router) with TypeScript
* **Backend & API**: Next.js Server Components & Route Handlers
* **Database**: Supabase (PostgreSQL with PostGIS for location radius calculations)
* **Authentication**: Google OAuth 2.0
* **Payment Gateway**: Razorpay (Integration with dynamic GST calculation)
* **Styling**: Vanilla CSS (Design tokens, Custom variables)

---

## 4. Site Map & Core Modules
* **Core Public App**: Landing Page, Search & Directory, Interactive Paywall blurs.
* **Onboarding Module**: Profile Registration Form, verification status locks.
* **Admin Dashboard**: Member Verification & Call Logs, Referral configurations, Custom Color Theme mappings.
* **Payment Integration**: Razorpay Webhook listener, dynamic invoice builder (dynamic 18% GST).
* **Vendor Marketplace**: Vendor directory, ratings & category listing.

---

## 5. Development Phase & Progress Tracker
- [x] Phase 1: Foundation, Auth & Profile Setup
- [x] Phase 2: Database Setup, Google Authentication, and Manual Verification Flow
- [x] Phase 3: Subscription, Razorpay (₹300 Standard Package & dynamic theme application)
- [ ] Phase 4: Premium Packages (Curated, Second-Marriage, High-Profile)
- [ ] Phase 5: Referral System & Marketplace
- [ ] Phase 6: Admin Panel (Verification Dashboard, Referral configuration, Theme Management)
- [ ] Phase 7: Polish, Security Hardening & Launch

---

## 6. Decision Log & Change History
* **2026-06-13**: Project initiated. Structure for `PROJECT_NOTES.md` established.
* **2026-06-13**: Approved tech stack finalized. Phase 1 completed.
* **2026-06-13**: Phase 2 completed. Configured Prisma ORM with Neon PostgreSQL schema, implemented Auth.js v5 route endpoints, developed a 5-step registration wizard with validations, built admin call verification queue with audit logs, and integrated a transparent server-side simulator fallback mechanism. Linting & production build validated.
* **2026-06-13**: Phase 2.5 completed. Conducted comprehensive static security audit and code path verification for database connectivity, OAuth flow, onboarding validation, verification queue, and privacy filters. Prepared full integration guides for production environments. Code linting and Next.js production builds verified clean.
* **2026-06-13**: Phase 3 completed. Added payment order creation and signature verification routes for Razorpay, implemented standard ₹300 monthly membership with dynamic 18% GST (₹54), added viewer subscription checks to redact profile details, integrated frontend checkout loader, and verified builds/lints cleanly.
