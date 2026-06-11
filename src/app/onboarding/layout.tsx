// src/app/onboarding/layout.tsx
import { AuthGuard } from "@/modules/identity/client/AuthGuard";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
