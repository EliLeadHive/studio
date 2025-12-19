'use server';

import { summarizeAdsInsights } from "@/ai/flows/summarize-ads-insights";
import type { AdData, Brand } from "./types";
import { BRANDS } from "./types";

// This is a temporary in-memory store. 
// In a real application, you would use a database or a more persistent cache.
let uploadedData: AdData[] = [];

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

// In-memory store for uploaded data
let adDataStore: AdData[] = [];

function parseCSV(csvText: string): AdData[] {
    const lines = csvText.trim().split('\\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const data = [];

    // Esses são os nomes de coluna esperados no CSV do Meta Ads
    // Mapeie para os nomes de campo em `AdData`
    const columnMapping: Record<string, keyof Omit<AdData, 'id' | 'brand'>> = {
        'reporting starts': 'date',
        'amount spent (brl)': 'investment',
        'leads': 'leads',
        'cost per lead (brl)': 'cpl',
    };
    
    const campaignNameIndex = headers.indexOf('campaign name');
    if (campaignNameIndex === -1) {
        throw new Error('A coluna "Campaign Name" não foi encontrada no CSV.');
    }

    const requiredColumns = Object.keys(columnMapping);
    const headerIndices = requiredColumns.reduce((acc, colName) => {
        const index = headers.indexOf(colName.toLowerCase());
        if (index === -1) {
            throw new Error(`A coluna obrigatória "${colName}" não foi encontrada no CSV.`);
        }
        acc[colName] = index;
        return acc;
    }, {} as Record<string, number>);

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');

        const campaignName = values[campaignNameIndex]?.replace(/"/g, '') || '';
        const brand = BRANDS.find(b => campaignName.toLowerCase().includes(b.toLowerCase()));

        if (!brand) continue; // Pula linhas que não correspondem a uma marca conhecida

        const date = values[headerIndices['reporting starts']]?.replace(/"/g, '');
        const investment = parseFloat(values[headerIndices['amount spent (brl)']]?.replace(/"/g, '')) || 0;
        const leads = parseInt(values[headerIndices['leads']]?.replace(/"/g, ''), 10) || 0;
        
        // CPL pode ser calculado ou pego do arquivo
        let cpl = parseFloat(values[headerIndices['cost per lead (brl)']]?.replace(/"/g, '')) || 0;
        if(leads > 0 && investment > 0 && cpl === 0) {
            cpl = investment / leads;
        }

        data.push({
            id: `${date}-${brand}-${i}`,
            date,
            brand,
            investment,
            leads,
            cpl,
        });
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
    
    // Replace the in-memory store with the new data
    adDataStore = parsedData;

    return { success: true, rowCount: parsedData.length };
  } catch (error: any) {
    console.error('Error processing CSV:', error);
    return { success: false, error: error.message || 'Falha ao processar o arquivo CSV.' };
  }
}

export async function getUploadedAdsData({ brand, from, to }: { brand?: Brand; from?: Date; to?: Date } = {}) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (adDataStore.length === 0) {
    return [];
  }

  let filteredData = adDataStore;

  if (brand) {
    filteredData = filteredData.filter(d => d.brand === brand);
  }
  
  // Date filtering can be added here later

  return filteredData;
}
