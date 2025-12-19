// src/lib/actions.ts
'use server';

import { summarizeAdsInsights } from "@/ai/flows/summarize-ads-insights";
import type { AdData, Brand } from "./types";
import { BRANDS } from "./types";
import Papa from 'papaparse';

// This is a temporary in-memory store.
// In a real application, you would use a database or a more persistent cache.
let adDataStore: AdData[] = [];

// ! IMPORTANT !
// Replace this with the actual URL of your Google Sheet published as CSV
const GOOGLE_SHEET_CSV_URL = ''; // Example: 'https://docs.google.com/spreadsheets/d/e/.../pub?output=csv'


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
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    const csvData = [headers, ...rows].join('\n');

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

function parseCSV(csvText: string): AdData[] {
  const parseResult = Papa.parse<any>(csvText, { header: true, skipEmptyLines: true });
  const data: AdData[] = [];

  const headers = parseResult.meta.fields?.map(h => h.trim().toLowerCase()) || [];
  
  const columnMapping: Record<string, string> = {
      'reporting starts': 'date',
      'amount spent (brl)': 'investment',
      'leads': 'leads',
      'cost per lead (brl)': 'cpl',
      'campaign name': 'campaignName'
  };
  
  const mappedHeaders = headers.reduce((acc, header) => {
      const lowerHeader = header.toLowerCase();
      for(const key in columnMapping) {
          if (lowerHeader.includes(key)) {
              acc[columnMapping[key] as string] = lowerHeader;
          }
      }
      return acc;
  }, {} as Record<string, string>);

  if (!mappedHeaders.campaignName) {
      throw new Error('A coluna "Campaign Name" não foi encontrada no CSV.');
  }

  for (const [index, row] of parseResult.data.entries()) {
      const campaignName = row[mappedHeaders.campaignName] || '';
      const brand = BRANDS.find(b => campaignName.toLowerCase().includes(b.toLowerCase()));

      if (!brand) continue;

      const date = row[mappedHeaders.date];
      const investment = parseFloat(row[mappedHeaders.investment]) || 0;
      const leads = parseInt(row[mappedHeaders.leads], 10) || 0;
      let cpl = parseFloat(row[mappedHeaders.cpl]) || 0;
      
      if(leads > 0 && investment > 0 && cpl === 0) {
          cpl = investment / leads;
      }
      
      if(date && brand){
        data.push({
            id: `${date}-${brand}-${index}`,
            date,
            brand,
            investment,
            leads,
            cpl,
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
        return { success: false, error: 'Nenhum dado válido encontrado no arquivo. Verifique se os nomes das campanhas incluem as marcas e se as colunas estão corretas.' };
    }
    
    adDataStore = parsedData;

    return { success: true, rowCount: parsedData.length, usingFile: true };
  } catch (error: any) {
    console.error('Error processing CSV:', error);
    return { success: false, error: error.message || 'Falha ao processar o arquivo CSV.' };
  }
}

async function fetchAndParseSheetData(): Promise<AdData[]> {
    if(!GOOGLE_SHEET_CSV_URL) {
        // Se a URL não estiver definida, não faz nada.
        return [];
    }
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL, { next: { revalidate: 3600 } }); // Cache de 1 hora
        if (!response.ok) {
            console.error(`Failed to fetch Google Sheet: ${response.statusText}`);
            return [];
        }
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch(error) {
        console.error("Error fetching or parsing Google Sheet data:", error);
        return [];
    }
}


export async function getSynchronizedAdsData({ brand, from, to }: { brand?: Brand; from?: Date; to?: Date } = {}) {
  // 1. Prioritize data from Google Sheet if URL is available.
  if(GOOGLE_SHEET_CSV_URL) {
    const sheetData = await fetchAndParseSheetData();
    if(sheetData.length > 0) {
        adDataStore = sheetData;
    }
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
  return []; // Returning empty array to avoid using mock data now.
}
