import { CryptoFirstModulePage } from "@/components/crypto-first/CryptoFirstModulePage";
import { cryptoFirstModules } from "@/modules/digital-operating-system";

const module = cryptoFirstModules.find((item) => item.key === "taxObligations")!;

export default function ObligacionesTributariasPage() {
  return (
    <CryptoFirstModulePage
      module={module}
      sections={[
        "Eventos detectados automáticamente desde operaciones confirmadas: ventas, swaps, staking, airdrops y transferencias.",
        "Eventos pendientes de clasificación o con documentación insuficiente que requieren revisión manual.",
        "Documentos y respaldos asociados a cada evento: cartolas, comprobantes de exchange, reportes CSV, PDF y Excel.",
        "Estado tributario consolidado: clasificación, respaldo disponible y nivel de revisión requerido.",
      ]}
    />
  );
}
