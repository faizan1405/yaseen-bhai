import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/db';
import { getEffectivePermissions, type AdminRole } from './lib/permissions';

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || 'dummy_id',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || 'dummy_secret',
    }),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        // `user` is the fresh DB record (database session strategy), so admin
        // role / active / permission changes take effect on the very next request
        // — a deactivated admin immediately loses access.
        const u = user as typeof user & {
          role?: 'USER' | 'ADMIN';
          accountStatus?: 'ACTIVE' | 'SUSPENDED';
          adminRole?: AdminRole | null;
          adminActive?: boolean | null;
          adminPermissions?: string[] | null;
        };

        const dbRole = (u.role as 'USER' | 'ADMIN') || 'USER';
        const isDeactivatedAdmin = dbRole === 'ADMIN' && u.adminActive === false;

        session.user.id = user.id;
        // `role` here is the EFFECTIVE, authorization-relevant role. A deactivated
        // admin reports as 'USER' so every existing `role === 'ADMIN'` check across
        // the app (admin layout, public-route admin bypasses, etc.) immediately
        // treats them as a regular user — deactivation takes effect on the very
        // next request without having to special-case every call site.
        session.user.role = isDeactivatedAdmin ? 'USER' : dbRole;
        session.user.accountStatus = (u.accountStatus as 'ACTIVE' | 'SUSPENDED') || 'ACTIVE';
        session.user.adminRole = u.adminRole ?? null;
        session.user.adminActive = u.adminActive !== false;
        session.user.permissions = getEffectivePermissions({
          role: dbRole,
          adminRole: u.adminRole ?? null,
          adminPermissions: u.adminPermissions ?? [],
          adminActive: u.adminActive,
        });
      }
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
