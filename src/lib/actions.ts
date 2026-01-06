// src/lib/actions.ts
'use server';

import { generateMetaAdsReport } from "@/ai/flows/generate-meta-ads-report";
import { summarizeAdsInsights } from "@/ai/flows/summarize-ads-insights";
import { generateMonthlyObservation } from "@/ai/flows/generate-monthly-observation";
import type { AdData, Brand, MonthlyMetric } from "./types";
import { BRANDS } from "./types";
import Papa from 'papaparse';

// This is a temporary in-memory store. It's populated by the Google Sheet fetch.
let adDataStore: AdData[] = [];

// ! IMPORTANT !
// This now points to your published Google Sheet.
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRh-NZm3LDmpGefyeGPsr_jzZuEmi5BDAs9fhk-HVt1Q4hMxOt0agbGJu-4ytDt2o-G0dp785KhiRN9/pub?output=csv';


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
    // Convert data to CSV string
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

    const result = await generateMetaAdsReport({
      metaAdsData: csvData,
    });

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
    })
    return result.observation;
  } catch (e) {
    console.error(e);
    return "Não foi possível gerar a observação.";
  }
}


function findBrandInText(text: string): Brand | null {
  if (!text) return null;
  const lowerCaseText = text.toLowerCase();
  for (const brand of BRANDS) {
    if (lowerCaseText.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  // Fallback for Omoda/Jaecoo if they are in the same account
  if (lowerCaseText.includes('omoda') || lowerCaseText.includes('jaecoo')) {
      if (lowerCaseText.includes('omoda')) return 'Omoda';
      if (lowerCaseText.includes('jaecoo')) return 'Jaecoo';
  }
  return null;
}

function parseCSV(csvText: string): AdData[] {
    const parseResult = Papa.parse<any>(csvText, { header: true, skipEmptyLines: true });
    const data: AdData[] = [];

    const columnMapping: Record<string, string> = {
        'date': 'reporting starts',
        'account': 'account',
        'campaignName': 'campaign name',
        'adSetName': 'ad set name',
        'adName': 'ad name',
        'investment': 'amount spent (brl)',
        'leads': 'leads',
        'impressions': 'impressions',
        'clicks': 'clicks (all)',
        'cpl': 'cost per lead (brl)',
        'cpc': 'cpc (all)',
    };
    
    // Find the actual headers from the CSV, converting to lowercase for robustness
    const headers = parseResult.meta.fields?.map(h => h.trim().toLowerCase()) || [];
    
    // Create a map from our desired keys (e.g., 'campaignName') to the actual header in the file
    const mappedHeaders = Object.keys(columnMapping).reduce((acc, key) => {
        const csvHeader = columnMapping[key];
        // Find a header that *includes* the expected text, making it more robust
        const foundHeader = headers.find(h => h.includes(csvHeader));
        if (foundHeader) {
            acc[key] = foundHeader;
        } else {
          // Fallback for exact match if includes fails
          const exactHeader = headers.find(h => h === csvHeader);
          if (exactHeader) {
            acc[key] = exactHeader;
          } else {
             console.warn(`Coluna esperada não encontrada no CSV: '${csvHeader}' (para a chave '${key}')`);
          }
        }
        return acc;
    }, {} as Record<string, string>);

    if (!mappedHeaders.campaignName && !mappedHeaders.account) {
        console.error('Nenhuma coluna de identificação ("Campaign name" ou "Account") foi encontrada.');
        return []; // Return empty if we can't identify brands
    }

    for (const [index, row] of parseResult.data.entries()) {
        // Use the mapped header to get the data from the row
        const campaignName = row[mappedHeaders.campaignName] || '';
        const adAccountName = row[mappedHeaders.account] || '';

        // Try to find brand in campaign name, then in account name
        const brand = findBrandInText(campaignName) || findBrandInText(adAccountName);

        if (!brand) continue;

        const date = row[mappedHeaders.date];
        const investment = parseFloat(String(row[mappedHeaders.investment]).replace(',','.')) || 0;
        const leads = parseInt(row[mappedHeaders.leads], 10) || 0;
        const impressions = parseInt(row[mappedHeaders.impressions], 10) || 0;
        const clicks = parseInt(row[mappedHeaders.clicks], 10) || 0;
        let cpl = parseFloat(String(row[mappedHeaders.cpl]).replace(',','.')) || 0;
        let cpc = parseFloat(String(row[mappedHeaders.cpc]).replace(',','.')) || 0;

        if (leads > 0 && investment > 0 && cpl === 0) {
            cpl = investment / leads;
        }
        if (clicks > 0 && investment > 0 && cpc === 0) {
            cpc = investment / clicks;
        }

        if (date && brand) {
            data.push({
                id: `${date}-${brand}-${index}`,
                date,
                brand,
                account: row[mappedHeaders.account] || 'N/A',
                campaignName: row[mappedHeaders.campaignName] || 'N-A',
                adSetName: row[mappedHeaders.adSetName] || 'N/A',
                adName: row[mappedHeaders.adName] || 'N/A',
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
}

export async function uploadAdsData(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'Nenhum arquivo enviado.' };
    }

    const fileContent = await file.text();
    const parsedData = parseCSV(fileContent);

    if (parsedData.length === 0) {
        return { success: false, error: 'Nenhum dado válido encontrado no arquivo. Verifique se os nomes das campanhas ou contas incluem as marcas e se as colunas estão corretas.' };
    }
    
    // Replace in-memory store with uploaded data
    adDataStore = parsedData;

    return { success: true, rowCount: parsedData.length, usingFile: true };
  } catch (error: any) {
    console.error('Error processing CSV:', error);
    return { success: false, error: error.message || 'Falha ao processar o arquivo CSV.' };
  }
}

async function fetchAndParseSheetData(): Promise<AdData[]> {
    if(!GOOGLE_SHEET_CSV_URL || !GOOGLE_SHEET_CSV_URL.includes('docs.google.com')) {
        console.warn('URL do Google Sheets inválida ou não configurada.');
        return [];
    }
    try {
        // Use a random query parameter to bypass cache if needed, but revalidate is better
        const response = await fetch(GOOGLE_SHEET_CSV_URL, { 
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            console.error(`Falha ao buscar dados do Google Sheet: ${response.statusText}`);
            return []; // Return empty, so we might fall back to store
        }
        const csvText = await response.text();
        if (!csvText) {
            return [];
        }
        return parseCSV(csvText);
    } catch(error) {
        console.error("Erro ao buscar ou processar dados do Google Sheet:", error);
        return []; // Return empty on error
    }
}


export async function getAdsData({ brand }: { brand?: Brand } = {}) {
  // Always fetch fresh data for this function call.
  // The fetch itself is cached for 5 minutes via Next.js revalidate mechanism.
  const sheetData = await fetchAndParseSheetData();
  
  if (sheetData.length > 0) {
    adDataStore = sheetData;
  } else {
    // If fetching fails, we can rely on the last known data in the store as a fallback.
    console.log("Nenhum dado novo encontrado no Google Sheet. Usando dados em memória, se disponíveis.");
  }

  // Always work from the in-memory store after attempting a fetch.
  let filteredData = adDataStore;
  if (brand) {
    filteredData = filteredData.filter(d => d.brand === brand);
  }
  
  return filteredData;
}
