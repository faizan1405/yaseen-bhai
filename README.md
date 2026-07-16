# Asan Nikah — Matrimonial Platform

This repository contains the complete Next.js application for Asan Nikah, a verified and privacy-first matrimonial platform.

## Project Overview
- **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS/Custom CSS.
- **Database:** MongoDB via Prisma ORM.
- **Authentication:** NextAuth.js (Auth.js) via Google OAuth.
- **Payments:** Razorpay integration.
- **Storage:** Vercel Blob.

## Setup Steps
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Copy the `.env.example` to `.env` and fill in your secrets.
3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

## Environment Variables
Key `.env` variables required for production:
- `DATABASE_URL`: MongoDB connection string (pointing to `asannikah` DB).
- `AUTH_SECRET`: Generate using `openssl rand -base64 32`.
- `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET`: Google OAuth credentials.
- `NEXT_PUBLIC_SITE_URL`: Set to `https://asannikah.com`.
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Razorpay live keys (required — checkout is disabled without valid keys).

## Local Development
Run the development server:
```bash
npm run dev
```
Access the application at `http://localhost:3000`.

## Production Build
To create a production build:
```bash
npm run build
```

## Deployment Steps
1. Deploy to Vercel or any Node.js hosting.
2. Ensure all environment variables are added in the hosting platform's settings.
3. Run `npx prisma db push` (or generate) during the build step.

## Admin Usage
Access the admin panel at `/admin/login`. Sign-in is Google-only (Auth.js) — there
is no password-based admin login. Admin access requires an `ADMIN` role on the
account, plus an active admin-role assignment (see below).

### Admin roles & permissions
The admin panel supports multiple granular roles (Super Admin, Profile Manager,
Verification Manager, Lead Manager, Payment Manager, Content Manager, Support
Manager). Super Admin has full access to everything; other roles get a curated
default permission set that a Super Admin can further customize per-admin from
`/admin/admin-users`. See `src/lib/permissions.ts` for the full permission
catalogue and role defaults.

Existing accounts with `role = ADMIN` from before this system was introduced
keep full (Super Admin-equivalent) access automatically — no migration needed.

### Assigning the first Super Admin
There are no `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables — admin
access is always granted to an existing Google-authenticated account, never a
new credential. To bootstrap the very first Super Admin:

1. Have the intended admin sign in once at `/` (or `/admin/login`) with their
   Google account, so a `User` record exists.
2. From a machine with `DATABASE_URL` configured, run:
   ```bash
   npm run promote-super-admin -- their-email@example.com
   ```
   (equivalently: `npx tsx scripts/promote-super-admin.ts their-email@example.com`)
3. They can now sign in at `/admin/login` with the same Google account and will
   land as an active Super Admin. From there, use `/admin/admin-users` to
   promote further admins — no more script runs needed.

This script only ever modifies the target user's own admin fields; it never
touches profiles, memberships, payments, leads or other users, and it is safe
to re-run.

## Important Production Safety Notes
- Access requires real Google (Auth.js) sign-in; admin access requires an `ADMIN` role plus an active admin assignment on the account.
- A deactivated admin loses admin access immediately on their next request — no re-login required.
- The system always keeps at least one active Super Admin; the API refuses any change that would remove the last one.
- The `.env` file is in `.gitignore` and should never be committed.
- Replace any remaining dummy Razorpay keys with live client keys before launch.
- Real emails and SMS notifications require valid API keys (Resend, SMS Provider) set in `.env`.
