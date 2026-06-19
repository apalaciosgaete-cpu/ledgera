import { CryptoFirstModulePage } from "@/components/crypto-first/CryptoFirstModulePage";
import { cryptoFirstModules } from "@/modules/digital-operating-system";

const module = cryptoFirstModules.find((item) => item.key === "sourceOfFunds")!;

export default function OrigenFondosPage() {
  return (
    <CryptoFirstModulePage
      module={module}
      sections={[
        "Ingresos laborales, ahorros, transferencias bancarias, ventas de activos, préstamos, herencias, minería, staking y airdrops.",
        "Categoría, descripción, fecha aproximada, respaldo disponible y relación con activos digitales.",
        "Cartolas bancarias, contratos, comprobantes, declaraciones, capturas y reportes de origen patrimonial.",
        "Construir el mapa de origen patrimonial antes de evaluar regularización o declaración.",
      ]}
    />
  );
}
