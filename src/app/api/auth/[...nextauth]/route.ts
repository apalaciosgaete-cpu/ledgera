import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const { handlers } = NextAuth(authOptions);

export const { GET, POST } = handlers;
