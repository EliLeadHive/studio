export const BRANDS = ["Fiat", "Jeep", "Ram", "Peugeot", "Citroën", "Nissan"] as const;
export type Brand = (typeof BRANDS)[number];

export interface AdData {
  id: string;
  date: string;
  brand: Brand;
  investment: number;
  leads: number;
  cpl: number;
}
