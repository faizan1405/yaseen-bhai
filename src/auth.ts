import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/db';

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
    };
  }

  interface User {
    role?: 'USER' | 'ADMIN';
    accountStatus?: 'ACTIVE' | 'SUSPENDED';
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
        session.user.id = user.id;
        session.user.role = (user.role as 'USER' | 'ADMIN') || 'USER';
        session.user.accountStatus = (user.accountStatus as 'ACTIVE' | 'SUSPENDED') || 'ACTIVE';
      }
      return session;
    },
  },
});
