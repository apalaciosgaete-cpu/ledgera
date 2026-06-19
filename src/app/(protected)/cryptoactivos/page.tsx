import { CryptoFirstModulePage } from "@/components/crypto-first/CryptoFirstModulePage";
import { cryptoFirstModules } from "@/modules/digital-operating-system";

const module = cryptoFirstModules.find((item) => item.key === "cryptoAssets")!;

export default function CryptoactivosPage() {
  return (
    <CryptoFirstModulePage
      module={module}
      sections={[
        "BTC, ETH, SOL, USDT, USDC, tokens, NFTs, staking y DeFi en una vista inicial.",
        "Cantidad, valor estimado, costo de adquisición, ganancia/pérdida estimada y estado documental.",
        "Comprobantes de compra, ventas, CSV, capturas y documentos asociados a cada activo.",
        "Registrar activos principales y definir cuáles requieren análisis tributario.",
      ]}
    />
  );
}
