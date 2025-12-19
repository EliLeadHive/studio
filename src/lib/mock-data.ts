// src/lib/mock-data.ts
import { subDays, format } from 'date-fns';
import { AdData, BRANDS, Brand } from './types';

const brandInvestmentRanges: Record<Brand, { min: number, max: number, leadCostFactor: number, clickCostFactor: number }> = {
  "Fiat": { min: 200, max: 700, leadCostFactor: 10, clickCostFactor: 1.5 },
  "Jeep": { min: 300, max: 900, leadCostFactor: 25, clickCostFactor: 3 },
  "Ram": { min: 400, max: 1200, leadCostFactor: 40, clickCostFactor: 5 },
  "Peugeot": { min: 150, max: 600, leadCostFactor: 12, clickCostFactor: 1.8 },
  "Citroën": { min: 120, max: 500, leadCostFactor: 11, clickCostFactor: 1.6 },
  "Nissan": { min: 180, max: 650, leadCostFactor: 15, clickCostFactor: 2 },
};

const generateData = (): AdData[] => {
  const data: AdData[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');

    for (const brand of BRANDS) {
      const { min, max, leadCostFactor, clickCostFactor } = brandInvestmentRanges[brand];
      const investment = Math.random() * (max - min) + min;
      
      const baseLeads = investment / leadCostFactor;
      const leadVariance = (Math.random() - 0.5) * 0.4; // +/- 20% variance
      const leads = Math.max(1, Math.floor(baseLeads * (1 + leadVariance)));
      
      const baseClicks = investment / clickCostFactor;
      const clickVariance = (Math.random() - 0.5) * 0.3; // +/- 15% variance
      const clicks = Math.max(10, Math.floor(baseClicks * (1 + clickVariance)));

      const impressions = clicks * (Math.random() * (50 - 30) + 30); // 3-5% CTR
      
      const cpl = investment / leads;
      const cpc = investment / clicks;

      data.push({
        id: `${date}-${brand}-${i}`,
        date,
        brand,
        account: `${brand} - Ads Account`,
        campaignName: `Campanha de Vendas - ${brand}`,
        adSetName: `Conjunto ${i % 3 + 1}`,
        adName: `Anúncio Principal ${i % 2 + 1}`,
        investment,
        leads,
        impressions,
        clicks,
        cpl,
        cpc,
      });
    }
  }
  return data;
};

const mockData = generateData();

// This function now returns mock data synchronously and is renamed to avoid confusion.
export function getMockData({ brand, from, to }: { brand?: Brand; from?: Date; to?: Date } = {}): AdData[] {
  let filteredData = mockData;

  if (brand) {
    filteredData = filteredData.filter(d => d.brand === brand);
  }

  // Note: Date range filtering is not yet implemented for mock data.

  return filteredData;
}


// The main data fetching function is now in actions.ts to avoid circular dependency.
export async function getAdsData({ brand, from, to }: { brand?: Brand; from?: Date; to?: Date } = {}) {
  const { getSynchronizedAdsData } = await import('./actions');
  return getSynchronizedAdsData({ brand, from, to });
}
