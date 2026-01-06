// src/lib/mock-data.ts
import { AdData, Brand } from './types';
import { getAdsData as getRealAdsData } from './actions';


// NOTE: This file is no longer used for providing mock data.
// It only serves as a re-exporter for the real data fetching function.
// The main data fetching logic is in src/lib/actions.ts.

/**
 * Re-exports the primary data fetching function from actions.ts.
 * This function now always fetches real, synchronized data from the Google Sheet.
 * @param params - Optional parameters to filter the data, e.g., by brand.
 * @returns A promise that resolves to an array of AdData.
 */
export async function getAdsData({ brand, from, to }: { brand?: Brand; from?: Date; to?: Date } = {}): Promise<AdData[]> {
  return getRealAdsData({ brand });
}
