import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma as any),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: false,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        const user = await prisma.users.findUnique({ where: { email } });

        if (!user || !user.password_hash || user.status !== "active") {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          rut: user.rut,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const ledgeraUser = user as typeof user & { rut?: string | null; role?: string | null };
        token.rut = ledgeraUser.rut;
        token.role = ledgeraUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { id?: string; rut?: unknown; role?: unknown }).id =
          token.sub ?? "";
        (session.user as typeof session.user & { rut?: unknown }).rut = token.rut;
        (session.user as typeof session.user & { role?: unknown }).role = token.role;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,
};
