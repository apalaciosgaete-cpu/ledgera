export type NormalizedExchangeEvent = {
  externalId:          string;
  externalType:        string;
  normalizedEventType: string;
  symbol:              string;
  quantity:            number;
  priceUsd:            number;
  feeUsd:              number;
  occurredAt:          Date;
  taxTreatment:        string;
  inventoryEffect:     string;
  economicEffect:      string;
};
