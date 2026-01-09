
export const BRANDS = [
  "Fiat", 
  "Jeep", 
  "Nissan",
  "Honda",
  "Asti",
  "Ford",
  "Gac",
  "Geely",
  "GS",
  "Hyundai",
  "Kia",
  "Leap",
  "Neta",
  "OmodaJaecoo",
  "Renault",
  "Peugeot",
  "Citroen"
] as const;
export type Brand = (typeof BRANDS)[number];

export interface AdData {
  id: string;
  date: string;
  brand: Brand;
  account: string;
  campaignName: string;
  adSetName:string;
  adName: string;
  investment: number;
  leads: number;
  impressions: number;
  clicks: number;
  cpl: number;
  cpc: number;
}

export interface MonthlyMetric {
  month: string;
  year: number;
  monthYear: string;
  investment: number;
  conversions: number;
  reach: number;
  cpl: number;
  observation?: string;
}
