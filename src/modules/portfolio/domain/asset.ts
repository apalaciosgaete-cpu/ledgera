export interface Asset {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}