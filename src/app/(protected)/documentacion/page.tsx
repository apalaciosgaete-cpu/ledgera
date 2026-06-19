import { CryptoFirstModulePage } from "@/components/crypto-first/CryptoFirstModulePage";
import { cryptoFirstModules } from "@/modules/digital-operating-system";

const module = cryptoFirstModules.find((item) => item.key === "documentation")!;

export default function DocumentacionPage() {
  return (
    <CryptoFirstModulePage
      module={module}
      sections={[
        "CSV de exchanges, cartolas bancarias, comprobantes, declaraciones, reportes, capturas, contratos y wallet proofs.",
        "Categoría, relación con activo, relación con caso, estado de revisión y suficiencia documental.",
        "Repositorio único para respaldar patrimonio digital, origen de fondos y obligaciones tributarias.",
        "Subir documentos base y vincularlos con activos, exchanges, wallets y eventos tributarios.",
      ]}
    />
  );
}
