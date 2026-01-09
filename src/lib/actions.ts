// src/lib/actions.ts
'use server';

import { generateMetaAdsReport } from "@/ai/flows/generate-meta-ads-report";
import { summarizeAdsInsights } from "@/ai/flows/summarize-ads-insights";
import { generateMonthlyObservation } from "@/ai/flows/generate-monthly-observation";
import type { AdData, Brand, MonthlyMetric } from "./types";
import Papa from 'papaparse';
import { parse, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// This is a temporary in-memory store for uploaded data.
let adDataStore: AdData[] = [];

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

async function fetchAllDataFromSheet(): Promise<AdData[]> {
    const SCRIPT_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRh-NZm3LDmpGefyeGPsr_jzZuEmi5BDAs9fhk-HVt1Q4hMxOt0agbGJu-4ytDt2o-G0dp785KhiRN9/pub?output=csv";

    try {
        console.log('Fetching data from Google Sheet CSV...');
        const response = await fetch(SCRIPT_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.statusText}`);
        }
        const csvText = await response.text();

        const parsed = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
        });

        const allAdsData: AdData[] = parsed.data.map((row: any, index: number) => {
            const accountName = row['Account'] || 'N/A';
            const brandForAccount = SHEET_NAME_TO_BRAND_MAP[accountName] || "GS"; // Fallback brand

            const dateValue = row['Reporting starts'];
            const campaignName = row['Campaign name'];

            if (!dateValue || !campaignName) return null;

            let parsedDate: Date;
            if (String(dateValue).includes('/')) {
                parsedDate = parse(dateValue, 'dd/MM/yyyy', new Date());
            } else {
                parsedDate = parse(dateValue, 'yyyy-MM-dd', new Date());
            }
            const date = parsedDate.toISOString().split('T')[0];

            const investment = Number(row['Amount spent (BRL)'] || '0');
            const leads = Number(row['Leads'] || '0');
            const impressions = Number(row['Impressions'] || '0');
            const clicks = Number(row['Clicks (all)'] || '0');

            let cpl = Number(row['Cost per lead (BRL)'] || '0');
            if (leads > 0 && investment > 0 && isFinite(investment / leads)) {
                cpl = investment / leads;
            }

            let cpc = Number(row['CPC (all)'] || '0');
            if (clicks > 0 && investment > 0 && isFinite(investment / clicks)) {
                cpc = investment / clicks;
            }

            return {
                id: `${date}-${brandForAccount}-${index}`,
                date,
                brand: brandForAccount,
                account: accountName,
                campaignName: campaignName,
                adSetName: row['Ad set name'] || 'N/A',
                adName: row['Ad name'] || 'N/A',
                investment,
                leads,
                impressions,
                clicks,
                cpl,
                cpc,
            };
        }).filter((item): item is AdData => item !== null);

        return allAdsData;

    } catch (error) {
        console.error("Erro ao buscar ou processar dados da planilha:", error);
        return [];
    }
}


export async function uploadAdsData(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'Nenhum arquivo enviado.' };

    const fileContent = await file.text();
    const parsed = Papa.parse<AdData>(fileContent, { header: true, dynamicTyping: true });

    adDataStore = parsed.data;

    return { success: true, rowCount: parsed.data.length };
  } catch (error: any) {
    console.error('Error processing uploaded file:', error);
    return { success: false, error: error.message || 'Falha ao processar o arquivo.' };
  }
}

export async function getAdsData({ brand, from, to }: { brand?: Brand, from?: Date, to?: Date } = {}) {
  
  let dataToUse: AdData[] = adDataStore.length > 0 ? adDataStore : await fetchAllDataFromSheet();
  
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
            console.error(`Data inválida encontrada: ${d.date}`, e);
            return false;
        }
    });
  }
  
  return filteredData;
}
