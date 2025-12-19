// src/lib/mock-data.ts
import { subDays, format } from 'date-fns';
import { AdData, BRANDS, Brand } from './types';
import { getSynchronizedAdsData } from './actions';

const brandInvestmentRanges: Record<Brand, { min: number, max: number, leadCostFactor: number }> = {
  "Fiat": { min: 200, max: 700, leadCostFactor: 10 },
  "Jeep": { min: 300, max: 900, leadCostFactor: 25 },
  "Ram": { min: 400, max: 1200, leadCostFactor: 40 },
  "Peugeot": { min: 150, max: 600, leadCostFactor: 12 },
  "Citroën": { min: 120, max: 500, leadCostFactor: 11 },
  "Nissan": { min: 180, max: 650, leadCostFactor: 15 },
};

const generateData = (): AdData[] => {
  const data: AdData[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');

    for (const brand of BRANDS) {
      const { min, max, leadCostFactor } = brandInvestmentRanges[brand];
      const investment = Math.random() * (max - min) + min;
      
      const baseLeads = investment / leadCostFactor;
      const leadVariance = (Math.random() - 0.5) * 0.4; // +/- 20% variance
      const leads = Math.max(1, Math.floor(baseLeads * (1 + leadVariance)));
      
      const cpl = investment / leads;

      data.push({
        id: `${date}-${brand}`,
        date,
        brand,
        investment,
        leads,
        cpl,
      });
    }
  }
  return data;
};

const mockData = generateData();

export async function getAdsData({ brand, from, to }: { brand?: Brand; from?: Date; to?: Date } = {}) {
  // First, try to get real data (from Google Sheet or upload)
  const realData = await getSynchronizedAdsData({ brand, from, to });
  if (realData.length > 0) {
    return realData;
  }
  
  // If no real data is available, fall back to mock data
  console.warn("Nenhuma fonte de dados real (Google Sheet ou Upload) foi encontrada. Usando dados de exemplo.");
  await new Promise(resolve => setTimeout(resolve, 500));

  let filteredData = mockData;

  if (brand) {
    filteredData = filteredData.filter(d => d.brand === brand);
  }

  // Note: Date range filtering is not yet implemented for mock data.

  return filteredData;
}
