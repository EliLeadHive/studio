// src/lib/actions.ts
'use server';

import { generateMetaAdsReport } from "@/ai/flows/generate-meta-ads-report";
import { summarizeAdsInsights } from "@/ai/flows/summarize-ads-insights";
import { generateMonthlyObservation } from "@/ai/flows/generate-monthly-observation";
import type { AdData, Brand, MonthlyMetric } from "./types";
import Papa from 'papaparse';
import { parse, isWithinInterval, startOfDay, endOfDay, isValid } from 'date-fns';

const SHEET_NAME_TO_BRAND_MAP: Record<string, Brand> = {
    "Fiat Sinal": "Fiat",
    "Jeep Sinal": "Jeep",
    "Nissan Sinal Japan": "Nissan",
    "Honda Mix": "Honda",
    "Asti Seguros": "Asti",
    "Ford Mix": "Ford",
    "Gac Sinal": "Gac",
    "Geely Sinal": "Geely",
    "GS Institucional": "GS",
    "Hyundai Sinal": "Hyundai",
    "Kia Sinal": "Kia",
    "Leap Sinal": "Leap",
    "Neta Sinal": "Neta",
    "Omoda Jaecoo": "OmodaJaecoo",
    "Renault Sinal France": "Renault",
    "PSA": "PSA",
};

interface FormState {
  message: string;
  summary?: string;
}

export async function getAiSummary(
  brandName: string,
  data: AdData[],
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!data || data.length === 0) {
    return { message: "error", summary: "Não há dados para gerar a análise." };
  }

  try {
    const csvData = Papa.unparse(data);
    const result = await summarizeAdsInsights({
      brandName: brandName,
      adsData: csvData,
    });
    if (!result.summary) {
      return { message: "error", summary: "A análise de IA não retornou um resultado." };
    }
    return { message: "success", summary: result.summary };
  } catch (e) {
    console.error(e);
    return { message: "error", summary: "Ocorreu um erro ao gerar a análise de IA." };
  }
}

export async function getAiGeneralReport(
  data: AdData[],
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
   if (!data || data.length === 0) {
    return { message: "error", summary: "Não há dados para gerar o relatório." };
  }

  try {
    const csvData = Papa.unparse(data);
    const result = await generateMetaAdsReport({ metaAdsData: csvData });
    if (!result.report) {
      return { message: "error", summary: "A análise de IA não retornou um relatório." };
    }
    return { message: "success", summary: result.report };
  } catch (e) {
    console.error(e);
    return { message: "error", summary: "Ocorreu um erro ao gerar o relatório de IA." };
  }
}

export async function getAiMonthlyObservation(
  currentMonthMetric: MonthlyMetric,
  previousMonthMetric?: MonthlyMetric
) {
  try {
    const result = await generateMonthlyObservation({
      currentMonth: currentMonthMetric,
      previousMonth: previousMonthMetric
    });
    return result.observation;
  } catch (e) {
    console.error(e);
    return "Não foi possível gerar a observação.";
  }
}

async function fetchAllDataFromDrive(): Promise<AdData[]> {
  const driveFileUrl = 'https://drive.google.com/uc?export=download&id=1679dB5STqB1M5ZyBUCAWV9r3WqPf9iPg';

  try {
    console.log('Fetching data from Google Drive URL...');
    const response = await fetch(`${driveFileUrl}&_=${new Date().getTime()}`, { cache: 'no-store' });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to fetch from Drive: ${response.statusText}. Body: ${errorBody}`);
    }
    const jsonData = await response.json();
    
    let allAdsData: AdData[] = [];
    
    for (const sheetName in jsonData) {
        if (!jsonData.hasOwnProperty(sheetName)) continue;

        const brand = SHEET_NAME_TO_BRAND_MAP[sheetName] || "GS";
        const brandData = jsonData[sheetName];

        if (Array.isArray(brandData)) {
            brandData.forEach((row: any, index: number) => {
                const dateString = row["Reporting starts"];
                if (!dateString || !row["Campaign name"]) return;

                let date;
                try {
                  // The date from the script is already yyyy-MM-dd
                  const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
                  if (isValid(parsedDate)) {
                    date = dateString;
                  } else {
                     return;
                  }
                } catch(e) {
                  return;
                }

                const investment = Number(row["Amount spent (BRL)"] || '0');
                const leads = Number(row["Leads"] || '0');
                const impressions = Number(row["Impressions"] || '0');
                const clicks = Number(row["Clicks (all)"] || '0');

                let cpl = Number(row["Cost per lead (BRL)"] || '0');
                if (leads > 0 && investment > 0 && isFinite(investment / leads)) {
                    cpl = investment / leads;
                }

                let cpc = Number(row["CPC (all)"] || '0');
                if (clicks > 0 && investment > 0 && isFinite(investment / clicks)) {
                    cpc = investment / clicks;
                }
                
                allAdsData.push({
                    id: `${date}-${brand}-${index}`,
                    date: date,
                    brand: brand,
                    account: sheetName,
                    campaignName: row["Campaign name"],
                    adSetName: row["Ad set name"] || 'N/A',
                    adName: row["Ad name"] || 'N/A',
                    investment,
                    leads,
                    impressions,
                    clicks,
                    cpl,
                    cpc,
                });
            });
        }
    }
    
    console.log(`Finished processing from Drive. Total rows found: ${allAdsData.length}`);
    return allAdsData;
  } catch (error) {
    console.error("Error fetching or processing data from Google Drive:", error);
    return [];
  }
}

// Kept for compatibility but not used by getAdsData.
export async function uploadAdsData(formData: FormData) {
  return { success: true, rowCount: 0, message: "Data is now fetched directly from Google Drive." };
}

export async function getAdsData({ brand, from, to }: { brand?: Brand, from?: Date, to?: Date } = {}) {
  
  let dataToUse: AdData[] = await fetchAllDataFromDrive();
  
  let filteredData = dataToUse;

  if (brand) {
    filteredData = filteredData.filter(d => d.brand.toLowerCase() === brand.toLowerCase());
  }

  if (from && to) {
    const interval = { start: startOfDay(from), end: endOfDay(to) };
    filteredData = filteredData.filter(d => {
        try {
            const parsedDate = parse(d.date, 'yyyy-MM-dd', new Date());
            return isWithinInterval(parsedDate, interval);
        } catch(e) {
            console.error(`Invalid date format found: ${d.date}`, e);
            return false;
        }
    });
  }
  
  return filteredData;
}
