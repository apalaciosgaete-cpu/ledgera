import { CryptoFirstModulePage } from "@/components/crypto-first/CryptoFirstModulePage";
import { cryptoFirstModules } from "@/modules/digital-operating-system";

const module = cryptoFirstModules.find((item) => item.key === "wallets")!;

export default function WalletsPage() {
  return (
    <CryptoFirstModulePage
      module={module}
      sections={[
        "Ledger, Trezor, Metamask, Rabby, Trust Wallet y direcciones manuales declaradas.",
        "Dirección, red, activo, saldo, propietario declarado y origen asociado.",
        "Wallet proofs, capturas, firmas, comprobantes y documentos de respaldo de autocustodia.",
        "Registrar wallets principales y separar transferencias propias de operaciones con efecto tributario.",
      ]}
    />
  );
}
