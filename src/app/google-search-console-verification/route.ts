// src/app/google-search-console-verification/route.ts
const verificationContent = "google-site-verification: googlead48e80d7c2d1421.html";

export const dynamic = "force-static";

export function GET() {
  return new Response(verificationContent, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
