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
- `NEXT_PUBLIC_DEMO_MODE`: **Must be `false` in production**.
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Razorpay live keys.

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
Access the admin panel at `/admin/login`. 
In production, you must use valid credentials from the database to access the dashboard. 

## Important Production Safety Notes
- Ensure `NEXT_PUBLIC_DEMO_MODE=false`.
- The `.env` file is in `.gitignore` and should never be committed.
- Replace any remaining dummy Razorpay keys with live client keys before launch.
- Real emails and SMS notifications require valid API keys (Resend, SMS Provider) set in `.env`.
