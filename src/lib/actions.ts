// src/lib/actions.ts
'use server';

import { generateMetaAdsReport } from "@/ai/flows/generate-meta-ads-report";
import { summarizeAdsInsights } from "@/ai/flows/summarize-ads-insights";
import { generateMonthlyObservation } from "@/ai/flows/generate-monthly-observation";
import type { AdData, Brand, MonthlyMetric } from "./types";
import { BRANDS } from "./types";
import Papa from 'papaparse';
import { parse, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import path from 'path';
import fs from 'fs/promises';

// This is a temporary in-memory store for uploaded data.
let adDataStore: AdData[] = [];

// A in-memory cache for the data fetched from Google Apps Script to avoid multiple fetches during the same request lifecycle.
let sheetDataCache: { data: AdData[], timestamp: number | null } = { data: [], timestamp: null };
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

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

// Função para processar os dados do JSON bruto para o formato AdData[]
function processJsonData(jsonData: Record<string, any[]>): AdData[] {
    const allAdsData: AdData[] = [];

    for (const accountName in jsonData) {
        if (Object.prototype.hasOwnProperty.call(jsonData, accountName)) {
            const records = jsonData[accountName];
            const brandForAccount = SHEET_NAME_TO_BRAND_MAP[accountName];
            
            if (!brandForAccount) continue;
            
            let rowIndex = 0; // Reset index for each account to avoid ID conflicts

            records.forEach(row => {
                const dateValue = row['Reporting starts'];
                const campaignName = row['Campaign name'];

                if (!dateValue || !campaignName) return;

                let parsedDate: Date;
                if (dateValue.includes('/')) {
                    parsedDate = parse(dateValue, 'dd/MM/yyyy', new Date());
                } else {
                    parsedDate = parse(dateValue, 'yyyy-MM-dd', new Date());
                }
                const date = parsedDate.toISOString().split('T')[0];
                
                const investment = parseFloat(row['Amount spent (BRL)'] || '0');
                const leads = parseInt(row['Leads'] || '0', 10);
                const impressions = parseInt(row['Impressions'] || '0', 10);
                const clicks = parseInt(row['Clicks (all)'] || '0', 10);
                let cpl = parseFloat(row['Cost per lead (BRL)'] || '0');
                let cpc = parseFloat(row['CPC (all)'] || '0');

                if (leads > 0 && investment > 0 && isFinite(investment / leads)) {
                    cpl = investment / leads;
                }
                if (clicks > 0 && investment > 0 && isFinite(investment / clicks)) {
                    cpc = investment / clicks;
                }

                allAdsData.push({
                    id: `${date}-${brandForAccount}-${rowIndex++}`,
                    date,
                    brand: brandForAccount,
                    account: row['Account'] || 'N/A',
                    campaignName: campaignName,
                    adSetName: row['Ad set name'] || 'N/A',
                    adName: row['Ad name'] || 'N/A',
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
    return allAdsData;
}


export async function uploadAdsData(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'Nenhum arquivo enviado.' };

    const fileContent = await file.text();
    
    // Validate if the content is JSON
    let jsonData;
    try {
        jsonData = JSON.parse(fileContent);
    } catch (e) {
        return { success: false, error: 'O arquivo não é um JSON válido.' };
    }

    const processedData = processJsonData(jsonData);

    adDataStore = processedData;

    return { success: true, rowCount: processedData.length };
  } catch (error: any) {
    console.error('Error processing uploaded file:', error);
    return { success: false, error: error.message || 'Falha ao processar o arquivo.' };
  }
}

async function fetchAllDataFromSheet(): Promise<AdData[]> {
    const now = Date.now();
    if (sheetDataCache.timestamp && (now - sheetDataCache.timestamp < CACHE_DURATION)) {
      console.log('Serving from cache');
      return sheetDataCache.data;
    }

    const SCRIPT_URL = process.env.GOOGLE_SHEET_SCRIPT_URL;

    if (!SCRIPT_URL) {
      console.error('GOOGLE_SHEET_SCRIPT_URL is not set.');
      return [];
    }
    
    try {
      console.log('Fetching data from Google Sheet...');
      const response = await fetch(SCRIPT_URL, { next: { revalidate: 300 } }); // Revalidate every 5 minutes
      if (!response.ok) {
        throw new Error(`Failed to fetch from Google Apps Script: ${response.statusText}`);
      }
      
      const jsonData = await response.json();
      
      const processedData = processJsonData(jsonData);

      sheetDataCache = { data: processedData, timestamp: now };
      
      return processedData;

    } catch (error) {
        console.error("Erro ao buscar ou processar os dados do Google Apps Script:", error);
        // Em caso de erro, tente servir o cache antigo se ele existir
        if (sheetDataCache.data.length > 0) {
            console.warn("Servindo cache antigo devido a um erro na busca de novos dados.");
            return sheetDataCache.data;
        }
        return [];
    }
}


export async function getAdsData({ brand, from, to }: { brand?: Brand, from?: Date, to?: Date } = {}) {
  
  let dataToUse: AdData[] = [];
  
  if (adDataStore.length > 0) {
      console.log("Usando dados em memória de um upload recente.");
      dataToUse = adDataStore;
  } else {
      console.log("Nenhum dado em memória, buscando da planilha.");
      dataToUse = await fetchAllDataFromSheet();
  }
  
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
