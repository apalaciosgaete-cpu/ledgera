import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | LEDGERA",
  description: "Selección y activación segura de planes LEDGERA.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
