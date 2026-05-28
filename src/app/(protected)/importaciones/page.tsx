// src/app/(protected)/importaciones/page.tsx
import { redirect } from "next/navigation";

export default function ImportacionesRedirectPage() {
  redirect("/import/bank");
}
