
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

// Map Brand names from types.ts to the actual sheet names if they differ.
// If a brand's sheet name is the same as its name in BRANDS, you don't need an entry.
const BRAND_TO_SHEET_NAME_MAP: Record<Brand, string> = {
    "Fiat": "Fiat Sinal",
    "Jeep": "Jeep Sinal",
    "Ram": "Ram",
    "Peugeot": "PSA", // Assuming Peugeot and Citroen are under PSA
    "Citroen": "PSA",
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
    "Jaecoo": "Omoda Jaecoo", // Assuming both are in the same sheet
    "PSA": "PSA",
    "Renault": "Renault Sinal France"
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
        const dateHeader = mappedHeaders.date!;
        const dateValue = row[dateHeader];
        if(!dateValue) continue;

        const date = parse(dateValue, 'yyyy-MM-dd', new Date()).toISOString().split('T')[0];

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
    // Assuming file upload contains all brands and we need to determine brand from content
    const parsedData = Papa.parse(fileContent, { header: true });
    const allData: AdData[] = [];
    // A simplified logic for uploaded file - assumes a 'brand' column exists or can be derived
    // This part might need adjustment based on the uploaded file's structure.
    // For now, let's assume it's a flat file that needs parsing.
    
    // For simplicity, we'll try to find a brand in each row.
    const findBrandInText = (text: string): Brand | null => {
        if (!text) return null;
        const lowerCaseText = text.toLowerCase();
        for (const b of BRANDS) {
            if (lowerCaseText.includes(b.toLowerCase())) return b;
        }
        return null;
    }

    // A mock parsing for uploaded file. This needs to be robust.
    const dataFromUpload = parsedData.data.map((row: any, index) => {
        const brand = findBrandInText(row['Campaign name'] || row['Account']);
        if (!brand) return null;
        return parseCSV(Papa.unparse([row]), brand)[0];
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
        const response = await fetch(url, { next: { revalidate: 300 } });
        if (!response.ok) {
            // It's common for some sheets not to exist, so we don't log it as a hard error.
            if (response.status === 400) { // Google Sheets returns 400 for invalid sheet name
                 // console.log(`Aba da planilha não encontrada para a marca: ${brand} (Aba: ${sheetName})`);
            } else {
                 console.error(`Falha ao buscar dados para ${brand}: ${response.statusText}`);
            }
            return [];
        }
        const csvText = await response.text();
        if (!csvText) return [];
        return parseCSV(csvText, brand);
    } catch(error) {
        console.error(`Erro ao buscar ou processar dados para a marca ${brand}:`, error);
        return [];
    }
}

async function fetchAllSheetData(): Promise<AdData[]> {
    const uniqueSheetNames = [...new Set(Object.values(BRAND_TO_SHEET_NAME_MAP))];
    const sheetNameToBrandMap = new Map<string, Brand[]>();

    // Create a map from sheet name to the brands it contains
    for (const brand of BRANDS) {
        const sheetName = BRAND_TO_SHEET_NAME_MAP[brand];
        if (sheetName) {
            if (!sheetNameToBrandMap.has(sheetName)) {
                sheetNameToBrandMap.set(sheetName, []);
            }
            sheetNameToBrandMap.get(sheetName)!.push(brand);
        }
    }
    
    const allPromises = uniqueSheetNames.map(async (sheetName) => {
        const brandsInSheet = sheetNameToBrandMap.get(sheetName)!;
        const url = `${GOOGLE_SHEET_BASE_URL}&sheet=${encodeURIComponent(sheetName)}`;
        try {
            const response = await fetch(url, { next: { revalidate: 300 } }); // 5 min cache
            if (!response.ok) {
                // console.log(`Aba da planilha não encontrada ou erro ao buscar: ${sheetName}`);
                return [];
            }
            const csvText = await response.text();
            if (!csvText) return [];
            
            // We parse the whole sheet, then filter for each brand it's supposed to contain.
            // This is more efficient than re-parsing for each brand.
            const allSheetData = parseCSV(csvText, brandsInSheet[0]); // Use first brand for logging
            
            // If there's only one brand for this sheet, we are done.
            if (brandsInSheet.length === 1) {
                return allSheetData.map(row => ({...row, brand: brandsInSheet[0]}));
            }

            // If multiple brands share a sheet (e.g., PSA), filter the data.
            const findBrandInText = (text: string): Brand | null => {
                const lowerText = text.toLowerCase();
                // Prioritize finding a more specific brand name first
                const sortedBrands = [...brandsInSheet].sort((a,b) => b.length - a.length);
                for(const brand of sortedBrands) {
                    if (lowerText.includes(brand.toLowerCase())) return brand;
                }
                return null;
            }

            return allSheetData.map(row => {
                const foundBrand = findBrandInText(row.campaignName) || findBrandInText(row.account) || brandsInSheet[0];
                return {...row, brand: foundBrand};
            });

        } catch (error) {
            console.error(`Erro ao processar a aba ${sheetName}:`, error);
            return [];
        }
    });

    const results = await Promise.all(allPromises);
    return results.flat();
}


export async function getAdsData({ brand, from, to }: { brand?: Brand, from?: Date, to?: Date } = {}) {
  const allData = await fetchAllSheetData();
  
  let dataToUse: AdData[] = [];
  if (allData.length > 0) {
    dataToUse = allData;
  } else if (adDataStore.length > 0) {
    console.log("Nenhum dado novo encontrado no Google Sheet. Usando dados em memória de um upload anterior.");
    dataToUse = adDataStore;
  } else {
    console.log("Nenhuma fonte de dados (Google Sheet ou Upload) disponível.");
  }

  let filteredData = dataToUse;

  if (brand) {
    filteredData = filteredData.filter(d => d.brand === brand);
  }

  if (from && to) {
    const interval = { start: startOfDay(from), end: endOfDay(to) };
    filteredData = filteredData.filter(d => {
        try {
            const parsedDate = parse(d.date, 'yyyy-MM-dd', new Date());
            return isWithinInterval(parsedDate, interval);
        } catch {
            return false;
        }
    });
  }
  
  return filteredData;
}
