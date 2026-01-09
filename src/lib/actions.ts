
// src/lib/actions.ts
'use server';

import { generateMetaAdsReport } from "@/ai/flows/generate-meta-ads-report";
import { summarizeAdsInsights } from "@/ai/flows/summarize-ads-insights";
import { generateMonthlyObservation } from "@/ai/flows/generate-monthly-observation";
import type { AdData, Brand, MonthlyMetric } from "./types";
import { BRANDS } from "./types";
import Papa from 'papaparse';
import { parse, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// This is a temporary in-memory store for uploaded data.
let adDataStore: AdData[] = [];

// Base URL structure for the published Google Sheet
const GOOGLE_SHEET_ID = '1dEylYB_N8F51bdVosMV5rjvAPW1tNud1KvSbDeyxrZQ';
const GOOGLE_SHEET_BASE_URL = `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEET_ID}/pub?output=csv`;

const BRAND_TO_SHEET_NAME_MAP: Record<Brand, string> = {
    "Fiat": "Fiat Sinal",
    "Jeep": "Jeep Sinal",
    "Nissan": "Nissan Sinal Japan",
    "Honda": "Honda Mix",
    "Asti": "Asti Seguros",
    "Ford": "Ford Mix",
    "Gac": "Gac Sinal",
    "Geely": "Geely Sinal",
    "GS": "GS Institucional",
    "Hyundai": "Hyundai Sinal",
    "Kia": "Kia Sinal",
    "Leap": "Leap Sinal",
    "Neta": "Neta Sinal",
    "Omoda": "Omoda Jaecoo",
    "Jaecoo": "Omoda Jaecoo",
    "Renault": "Renault Sinal France",
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

function parseCSV(csvText: string, brand: Brand): AdData[] {
    const cleanCsvText = csvText.trim();
    if (!cleanCsvText) return [];

    const parseResult = Papa.parse<any>(cleanCsvText, { header: true, skipEmptyLines: true, trimHeaders: true });
    const data: AdData[] = [];
    
    if (parseResult.errors.length > 0) {
        console.warn(`Erros de parsing no CSV para a marca ${brand}:`, parseResult.errors);
    }
    if (parseResult.data.length === 0) return [];
    
    const columnMapping: Record<string, string[]> = {
        date: ['reporting starts', 'data', 'início da veiculação'],
        account: ['account', 'lojas', 'nome da conta'],
        campaignName: ['campaign name', 'nome da campanha'],
        adSetName: ['ad set name', 'nome do conjunto de anúncios'],
        adName: ['ad name', 'nome do anúncio'],
        investment: ['amount spent (brl)', 'investimento', 'valor gasto (brl)'],
        leads: ['leads', 'resultados', 'cadastros'],
        impressions: ['impressions', 'impressões'],
        clicks: ['clicks (all)', 'cliques (todos)'],
        cpl: ['cost per lead (brl)', 'custo por lead', 'custo por resultado', 'custo por cadastro'],
        cpc: ['cpc (all)', 'cpc (todos)', 'cpc (custo por clique no link)'],
    };
    
    const originalHeaders = parseResult.meta.fields || [];
    const mappedHeaders: Record<string, string | undefined> = {};
    for (const key in columnMapping) {
        const possibleHeaders = columnMapping[key];
        const foundHeader = originalHeaders.find(origHeader => possibleHeaders.includes(origHeader.toLowerCase()));
        if (foundHeader) mappedHeaders[key] = foundHeader;
    }

    for (const [index, row] of parseResult.data.entries()) {
      try {
        const dateHeader = mappedHeaders.date;
        if (!dateHeader) continue;

        const dateValue = row[dateHeader];
        if(!dateValue) continue;
        
        let parsedDate: Date;
        if (dateValue.includes('/')) {
             parsedDate = parse(dateValue, 'dd/MM/yyyy', new Date());
        } else {
             parsedDate = parse(dateValue, 'yyyy-MM-dd', new Date());
        }

        const date = parsedDate.toISOString().split('T')[0];

        const safeParseFloat = (val: string) => parseFloat(String(val || '0').replace(',', '.'));
        const safeParseInt = (val: string) => parseInt(String(val || '0'), 10);

        const investment = safeParseFloat(row[mappedHeaders.investment!]);
        const leads = safeParseInt(row[mappedHeaders.leads!]);
        const impressions = safeParseInt(row[mappedHeaders.impressions!]);
        const clicks = safeParseInt(row[mappedHeaders.clicks!]);
        let cpl = safeParseFloat(row[mappedHeaders.cpl!]);
        let cpc = safeParseFloat(row[mappedHeaders.cpc!]);

        if (leads > 0 && investment > 0 && isFinite(investment / leads)) cpl = investment / leads;
        if (clicks > 0 && investment > 0 && isFinite(investment / clicks)) cpc = investment / clicks;
        
        data.push({
            id: `${date}-${brand}-${index}`, date, brand,
            account: row[mappedHeaders.account!] || 'N/A',
            campaignName: row[mappedHeaders.campaignName!] || 'N/A',
            adSetName: row[mappedHeaders.adSetName!] || 'N/A',
            adName: row[mappedHeaders.adName!] || 'N/A',
            investment, leads, impressions, clicks, cpl, cpc,
        });
      } catch (e) {
          console.error(`Falha ao processar a linha ${index + 2} do CSV para a marca ${brand}.`, { row, error: e });
      }
    }
    return data;
}

export async function uploadAdsData(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'Nenhum arquivo enviado.' };

    const fileContent = await file.text();
    const parsedData = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

    const findBrandInText = (text: string): Brand | null => {
        if (!text) return null;
        const lowerCaseText = text.toLowerCase();
        for (const b of BRANDS) {
            if (lowerCaseText.includes(b.toLowerCase())) return b;
        }
        return null;
    }

    const dataFromUpload = (parsedData.data as any[]).map((row, index) => {
        const brand = findBrandInText(row['Campaign name'] || row['Account name'] || row['brand']);
        if (!brand) return null;
        
        const rowAsCsv = Papa.unparse([row]);
        return parseCSV(rowAsCsv, brand)[0];
    }).filter(d => d !== null) as AdData[];


    adDataStore = dataFromUpload;

    return { success: true, rowCount: dataFromUpload.length, usingFile: true };
  } catch (error: any) {
    console.error('Error processing CSV:', error);
    return { success: false, error: error.message || 'Falha ao processar o arquivo CSV.' };
  }
}

async function fetchSheetDataForBrand(brand: Brand): Promise<AdData[]> {
    const sheetName = BRAND_TO_SHEET_NAME_MAP[brand];
    if (!sheetName) {
        console.warn(`Nenhum nome de aba mapeado para a marca: ${brand}`);
        return [];
    }

    const url = `${GOOGLE_SHEET_BASE_URL}&sheet=${encodeURIComponent(sheetName)}`;

    try {
        const response = await fetch(url, { next: { revalidate: 300 } }); // 5 min cache
        if (!response.ok) {
            if (response.status === 404) {
                 console.warn(`Aba da planilha não encontrada para a marca: ${brand} (Aba: ${sheetName})`);
            } else {
                 console.error(`Falha ao buscar dados para ${brand}: ${response.statusText}`);
            }
            return [];
        }
        const csvText = await response.text();
        if (!csvText) return [];

        let parsedData = parseCSV(csvText, brand);

        if (sheetName === 'Omoda Jaecoo') {
            return parsedData.map(row => {
                const campaignLower = (row.campaignName || '').toLowerCase();
                const adSetLower = (row.adSetName || '').toLowerCase();
                const adLower = (row.adName || '').toLowerCase();

                if (campaignLower.includes('jaecoo') || adSetLower.includes('jaecoo') || adLower.includes('jaecoo')) {
                    return {...row, brand: 'Jaecoo' as Brand};
                }
                return {...row, brand: 'Omoda' as Brand};
            }).filter(row => row.brand === brand);
        }

        return parsedData;
    } catch(error) {
        console.error(`Erro ao buscar ou processar dados para a marca ${brand}:`, error);
        return [];
    }
}

async function fetchAllSheetData(): Promise<AdData[]> {
    const fetchPromises = BRANDS.map(brand => fetchSheetDataForBrand(brand));
    const results = await Promise.all(fetchPromises);
    return results.flat();
}


export async function getAdsData({ brand, from, to }: { brand?: Brand, from?: Date, to?: Date } = {}) {
  let dataToUse: AdData[] = [];

  const sheetData = await fetchAllSheetData();

  if (sheetData.length > 0) {
      dataToUse = sheetData;
  } else if (adDataStore.length > 0) {
      console.log("Nenhum dado encontrado no Google Sheet. Usando dados em memória de um upload anterior.");
      dataToUse = adDataStore;
  } else {
      console.log("Nenhuma fonte de dados (Google Sheet ou Upload) disponível. O relatório pode aparecer vazio.");
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
