import { WealthFlowPage } from "@/components/wealth/WealthFlowPage";

export default function OrigenFondosPage() {
  return (
    <div className="[&>main>section:last-child]:hidden">
      <WealthFlowPage activeStep="origen-fondos" />
    </div>
  );
}
