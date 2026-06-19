import { CryptoFirstModulePage } from "@/components/crypto-first/CryptoFirstModulePage";
import { cryptoFirstModules } from "@/modules/digital-operating-system";

const module = cryptoFirstModules.find((item) => item.key === "exchanges")!;

export default function ExchangesPage() {
  return (
    <CryptoFirstModulePage
      module={module}
      sections={[
        "Binance, Bybit, Coinbase, Kraken, Crypto.com y otros exchanges usados por el usuario.",
        "Cuenta, saldo, movimientos, CSV importados, última sincronización y estado de revisión.",
        "Extractos, reportes CSV, comprobantes de depósito, retiro, compra, venta y swap.",
        "Registrar exchanges usados y priorizar la importación o carga manual de movimientos.",
      ]}
    />
  );
}
