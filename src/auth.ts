import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/db';
import { getEffectivePermissions, type AdminRole } from './lib/permissions';
import { getRequestMeta } from './lib/requestMeta';
import { checkRateLimit } from './lib/rateLimit';

// Extend the session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'USER' | 'ADMIN';
      accountStatus: 'ACTIVE' | 'SUSPENDED';
      // Admin role & permission system (safe, non-secret identity fields).
      adminRole: AdminRole | null;
      adminActive: boolean;
      permissions: string[];
    };
  }

  interface User {
    role?: 'USER' | 'ADMIN';
    accountStatus?: 'ACTIVE' | 'SUSPENDED';
    adminRole?: AdminRole | null;
    adminActive?: boolean | null;
    adminPermissions?: string[];
  }
}

// Precomputed bcrypt hash of a value nobody's real password will ever equal.
// Used so a login attempt for a non-existent email (or an account with no
// password set) still runs a bcrypt.compare of comparable cost — this keeps
// failure timing similar across "wrong password" vs "no such admin account",
// which makes email enumeration by response-time slightly harder.
const DUMMY_PASSWORD_HASH = '$2b$12$/2VFLXBg6/D..ETnTaBE0.M5bZe3mg0y1J7Ju.UD.Y.4LNVuVDHYe';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || 'dummy_id',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || 'dummy_secret',
    }),
    // Admin-only email/password login. Deliberately NOT available to regular
    // site users (the public matrimonial flow stays Google-only) — authorize()
    // rejects anything that isn't an active ADMIN account with a password set.
    Credentials({
      id: 'admin-credentials',
      name: 'Admin Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password) return null;

        const meta = getRequestMeta(request);
        const rateLimitKey = `admin-login:${meta.ipAddress || 'unknown'}:${email}`;
        if (checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
          throw new Error('Too many login attempts. Please try again in a few minutes.');
        }

        const dbUser = await prisma.user.findUnique({ where: { email } });

        // Always run bcrypt.compare (against a dummy hash when there's no real
        // one) so a missing account/password doesn't return measurably faster
        // than a wrong-password attempt.
        const hashToCheck = dbUser?.passwordHash || DUMMY_PASSWORD_HASH;
        const passwordMatches = await bcrypt.compare(password, hashToCheck);

        if (!dbUser || !dbUser.passwordHash || !passwordMatches) return null;
        if (dbUser.role !== 'ADMIN') return null; // password login is admin-only
        if (dbUser.adminActive === false) return null; // deactivated admin

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image,
        };
      },
    }),
  ],
  // JWT sessions are required for the Credentials provider (database sessions
  // only work for adapter-linked OAuth sign-ins). To keep the same "changes
  // take effect on the very next request" guarantee database sessions gave us
  // (e.g. deactivating an admin immediately revokes access), the `session`
  // callback below re-reads the live User row from the database on every call
  // instead of trusting stale claims baked into the JWT.
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      const userId = typeof token.sub === 'string' ? token.sub : null;
      if (!session.user || !userId) return session;

      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!dbUser) {
        // Account no longer exists (or was deleted) — report as a plain,
        // non-admin, non-elevated session rather than throwing.
        session.user.id = userId;
        session.user.role = 'USER';
        session.user.accountStatus = 'ACTIVE';
        session.user.adminRole = null;
        session.user.adminActive = false;
        session.user.permissions = [];
        return session;
      }

      const dbRole = dbUser.role;
      const isDeactivatedAdmin = dbRole === 'ADMIN' && dbUser.adminActive === false;

      session.user.id = dbUser.id;
      // `role` here is the EFFECTIVE, authorization-relevant role. A deactivated
      // admin reports as 'USER' so every existing `role === 'ADMIN'` check across
      // the app (admin layout, public-route admin bypasses, etc.) immediately
      // treats them as a regular user — deactivation takes effect on the very
      // next request without having to special-case every call site.
      session.user.role = isDeactivatedAdmin ? 'USER' : dbRole;
      session.user.accountStatus = dbUser.accountStatus;
      session.user.adminRole = dbUser.adminRole ?? null;
      session.user.adminActive = dbUser.adminActive !== false;
      session.user.permissions = getEffectivePermissions({
        role: dbRole,
        adminRole: dbUser.adminRole ?? null,
        adminPermissions: dbUser.adminPermissions ?? [],
        adminActive: dbUser.adminActive,
      });

      return session;
    },
  },
  events: {
    // Record last successful sign-in. Best-effort — never block login on failure.
    async signIn({ user }) {
      try {
        if (user?.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }
      } catch (e) {
        console.error('Failed to record lastLoginAt:', e instanceof Error ? e.message : e);
      }
    },
  },
});
