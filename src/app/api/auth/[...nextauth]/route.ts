import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

const { handlers } = NextAuth(authOptions);

export const { GET, POST } = handlers;
