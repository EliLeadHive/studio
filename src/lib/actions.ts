// src/lib/actions.ts
'use server';

import { generateMetaAdsReport } from "@/ai/flows/generate-meta-ads-report";
import { summarizeAdsInsights } from "@/ai/flows/summarize-ads-insights";
import type { AdData, Brand } from "./types";
import { BRANDS } from "./types";
import Papa from 'papaparse';
import { getMockData } from "./mock-data";

// This is a temporary in-memory store.
// In a real application, you would use a database or a more persistent cache.
let adDataStore: AdData[] = [];

// ! IMPORTANT !
// This now points to your published Google Sheet.
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1dEylYB_N8F51bdVosMV5rjvAPW1tNud1KvSbDeyxrZQ/pub?output=csv';


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

    const headers = parseResult.meta.fields?.map(h => h.trim().toLowerCase()) || [];
    
    const mappedHeaders = Object.keys(columnMapping).reduce((acc, key) => {
        const csvHeader = columnMapping[key];
        // Find a header that *includes* the expected text, making it more robust
        const foundHeader = headers.find(h => h.includes(csvHeader));
        if (foundHeader) {
            acc[key] = foundHeader;
        }
        return acc;
    }, {} as Record<string, string>);

    if (!mappedHeaders.campaignName && !mappedHeaders.account) {
        console.error('Nenhuma coluna de identificação ("Campaign name" ou "Account") foi encontrada.');
        return []; // Return empty if we can't identify brands
    }

    for (const [index, row] of parseResult.data.entries()) {
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
        const response = await fetch(GOOGLE_SHEET_CSV_URL, { next: { revalidate: 600 } }); // Cache de 10 minutos
        if (!response.ok) {
            console.error(`Falha ao buscar dados do Google Sheet: ${response.statusText}`);
            return [];
        }
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch(error) {
        console.error("Erro ao buscar ou processar dados do Google Sheet:", error);
        return [];
    }
}


export async function getSynchronizedAdsData({ brand, from, to }: { brand?: Brand; from?: Date; to?: Date } = {}) {
  // 1. Prioritize data from Google Sheet if URL is available.
  const sheetData = await fetchAndParseSheetData();
  if (sheetData.length > 0) {
    adDataStore = sheetData;
    console.log(`Dados do Google Sheet carregados: ${sheetData.length} linhas.`);
  } else {
    console.log("Nenhum dado encontrado no Google Sheet, tentando usar dados em memória ou de exemplo.");
  }

  // 2. Use in-memory data (from upload or from sheet cache) if available.
  if (adDataStore.length > 0) {
    let filteredData = adDataStore;
    if (brand) {
      filteredData = filteredData.filter(d => d.brand === brand);
    }
    // Date filtering logic would go here
    return filteredData;
  }

  // 3. Fallback to mock data if nothing else is available.
  console.warn("Nenhuma fonte de dados real (Google Sheet ou Upload) foi encontrada. Usando dados de exemplo.");
  return getMockData({ brand, from, to });
}
