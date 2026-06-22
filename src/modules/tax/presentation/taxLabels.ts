export function getTaxCategoryLabel(category: string | null | undefined): string {
  switch (category) {
    case "CAPITAL_GAIN":
      return "Ganancia de capital";

    case "ORDINARY_INCOME":
      return "Renta ordinaria";

    case "NON_TAXABLE":
      return "No afecto";

    case "UNCLASSIFIED":
      return "Pendiente de clasificación";

    default:
      return "Pendiente de revisión";
  }
}