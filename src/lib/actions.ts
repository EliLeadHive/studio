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

// URL para o arquivo JSON consolidado no Google Drive, gerado pelo Apps Script.
const CONSOLIDATED_DATA_URL = 'https://drive.google.com/uc?export=download&id=1YCs3wJ5fKxBR9pZ767D_I2np1S6ETz9O';

const SHEET_NAME_TO_BRAND_MAP: Record<string, Brand | 'PSA_GROUP'> = {
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
    "PSA": "PSA_GROUP", // Mapeamento especial para o grupo PSA
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
            const mappedBrand = SHEET_NAME_TO_BRAND_MAP[accountName];
            
            if (!mappedBrand) continue;
            
            let rowIndex = 0;

            records.forEach(row => {
                const dateValue = row['Reporting starts'];
                const campaignName = row['Campaign name'];

                if (!dateValue || !campaignName) return;

                let brandForRecord: Brand | undefined;

                if (mappedBrand === 'PSA_GROUP') {
                    const lowerCaseCampaignName = campaignName.toLowerCase();
                    if (lowerCaseCampaignName.includes('peugeot')) {
                        brandForRecord = 'Peugeot';
                    } else if (lowerCaseCampaignName.includes('citroen')) {
                        brandForRecord = 'Citroen';
                    }
                } else {
                    brandForRecord = mappedBrand as Brand;
                }

                if (!brandForRecord) return; // Pula a linha se não conseguir determinar a marca

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
                    id: `${date}-${brandForRecord}-${rowIndex++}`,
                    date,
                    brand: brandForRecord,
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
    
    const jsonData = JSON.parse(fileContent);
    const processedData = processJsonData(jsonData);

    adDataStore = processedData;

    return { success: true, rowCount: processedData.length, usingFile: true };
  } catch (error: any) {
    console.error('Error processing uploaded file:', error);
    return { success: false, error: error.message || 'Falha ao processar o arquivo. Certifique-se de que é um JSON válido.' };
  }
}

async function fetchAllDataFromDrive(): Promise<AdData[]> {
    try {
        const response = await fetch(CONSOLIDATED_DATA_URL, { 
            next: { revalidate: 300 } // Cache de 5 minutos
        });

        if (!response.ok) {
            throw new Error(`Falha ao buscar dados do Google Drive: ${response.statusText}`);
        }

        const jsonData = await response.json();
        return processJsonData(jsonData);

    } catch (error) {
        console.error("Erro ao buscar ou processar dados do Google Drive:", error);
        return []; // Retorna um array vazio em caso de erro para não quebrar o app
    }
}


export async function getAdsData({ brand, from, to }: { brand?: Brand, from?: Date, to?: Date } = {}) {
  let dataToUse: AdData[] = [];

  const driveData = await fetchAllDataFromDrive();

  if (driveData.length > 0) {
      dataToUse = driveData;
  } else if (adDataStore.length > 0) {
      console.log("Nenhum dado encontrado no Google Drive. Usando dados em memória de um upload anterior.");
      dataToUse = adDataStore;
  } else {
      console.log("Nenhuma fonte de dados (Google Drive ou Upload) disponível. O relatório pode aparecer vazio.");
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
