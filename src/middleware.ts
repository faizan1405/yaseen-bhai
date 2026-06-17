// Middleware removed due to Prisma + NextAuth Edge runtime incompatibility
// Admin route protection is now handled in src/app/admin/layout.tsx (Server Component)

export function middleware() {
  // Empty
}

export const config = {
  matcher: [],
};
