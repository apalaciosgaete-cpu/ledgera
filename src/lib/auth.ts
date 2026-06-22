import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

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

        if (!isValid) {
          await recordAuditEvent({
            userId: user.id,
            category: "SECURITY",
            severity: "WARNING",
            event: "login_failed",
            description: "Intento de inicio de sesión fallido por credenciales inválidas",
            result: "FAILED",
            entityType: "User",
            entityId: user.id,
            metadata: { provider: "credentials", email },
          });
          return null;
        }

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
  events: {
    async signIn({ user, account }) {
      try {
        await recordAuditEvent({
          userId: user?.id ?? null,
          category: "SECURITY",
          severity: "INFO",
          event: "login_success",
          description: `Inicio de sesión exitoso vía ${account?.provider ?? "credentials"}`,
          result: "SUCCESS",
          entityType: "User",
          entityId: user?.id ?? null,
          metadata: { provider: account?.provider ?? "credentials" },
        });
      } catch (error) {
        console.error("[audit] login_success failed", error);
      }
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
