// src/app/dashboard/page.tsx
import { permanentRedirect } from "next/navigation";

export default function DashboardPage() {
  permanentRedirect("/panel");
}
