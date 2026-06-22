import { CryptoFirstModulePage } from "@/components/crypto-first/CryptoFirstModulePage";
import { cryptoFirstModules } from "@/modules/digital-operating-system";

const module = cryptoFirstModules.find((item) => item.key === "digitalWealth")!;

export default function PatrimonioDigitalPage() {
  return (
    <CryptoFirstModulePage
      module={module}
      sections={[
        "Total estimado, distribución por activo, distribución por plataforma y estado general de revisión.",
        "Activos, exchanges, wallets y origen declarado se consolidarán en una sola vista.",
        "CSV de exchanges, cartolas bancarias, comprobantes y wallet proofs vinculados al patrimonio.",
        "Completar activos, exchanges, wallets y documentación base para construir el mapa patrimonial digital.",
      ]}
    />
  );
}
