"use client";

import { useRouter } from "next/navigation";
import { CHILE_BANKS } from "@/modules/banking/catalogs/chileBanks";

export default function BancosOrigenFondosPage() {
  const router = useRouter();
  return (
    <main>
      <button onClick={() => router.push("/origen-fondos")}>Volver</button>
      <h1>Banco en Chile</h1>
      {CHILE_BANKS.map((bank) => (
        <button key={bank.id} disabled={bank.status !== "available"} onClick={() => router.push(`/origen-fondos/bancos/${bank.id}`)}>{bank.shortName}</button>
      ))}
    </main>
  );
}
