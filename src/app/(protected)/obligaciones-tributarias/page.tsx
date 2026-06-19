import { CryptoFirstModulePage } from "@/components/crypto-first/CryptoFirstModulePage";
import { cryptoFirstModules } from "@/modules/digital-operating-system";

const module = cryptoFirstModules.find((item) => item.key === "taxObligations")!;

export default function ObligacionesTributariasPage() {
  return (
    <CryptoFirstModulePage
      module={module}
      sections={[
        "Venta crypto-fiat, swap crypto-crypto, staking, airdrops, DeFi, NFTs, retiros y transferencias entre wallets.",
        "Evento, periodo, activo, monto, documentación y estado de revisión tributaria.",
        "Reportes, CSV, cartolas, comprobantes y respaldos que explican cada evento.",
        "Detectar eventos con posible efecto tributario y priorizar los que requieren análisis.",
      ]}
    />
  );
}
