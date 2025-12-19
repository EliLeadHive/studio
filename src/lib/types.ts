export const BRANDS = ["Fiat", "Jeep", "Ram", "Peugeot", "Citroën", "Nissan"] as const;
export type Brand = (typeof BRANDS)[number];

export interface AdData {
  id: string;
  date: string;
  brand: Brand;
  account: string;
  campaignName: string;
  adSetName: string;
  adName: string;
  investment: number;
  leads: number;
  impressions: number;
  clicks: number;
  cpl: number;
  cpc: number;
}
