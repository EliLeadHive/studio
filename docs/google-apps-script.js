
// --- CONFIGURAÇÃO ---
// !!! IMPORTANTE !!! Cole seu novo Access Token aqui.
const ACCESS_TOKEN = 'SEU_NOVO_ACCESS_TOKEN'; 
const OUTPUT_FILENAME = 'meta_ads_data.json'; // Nome do arquivo que será salvo no Google Drive

// --- LISTA DAS SUAS CONTAS DE ANÚNCIO ---
const AD_ACCOUNTS = [
  { name: 'Honda Mix', id: 'act_536506428518101' },
  { name: 'Asti Seguros', id: 'act_1091695429695176' },
  { name: 'Fiat Sinal', id: 'act_182080821845994' },
  { name: 'Ford Mix', id: 'act_695110055663397' },
  { name: 'Gac Sinal', id: 'act_1218480135780657' },
  { name: 'Geely Sinal', id: 'act_1720937615457644' },
  { name: 'GS Institucional', id: 'act_677083568024951' },
  { name: 'Hyundai Sinal', id: 'act_477621751150197' },
  { name: 'Jeep Sinal', id: 'act_145753934178360' },
  { name: 'Kia Sinal', id: 'act_697260662237200' },
  { name: 'Leap Sinal', id: 'act_620172050851965' },
  { name: 'Neta Sinal', id: 'act_408446101855529' },
  { name: 'Nissan Sinal Japan', id: 'act_540136228006853' },
  { name: 'Omoda Jaecoo', id: 'act_2788255281371015' },
  { name: 'PSA', id: 'act_1369535536718829' },
  { name: 'Renault Sinal France', id: 'act_2228590280655962' },
];

/**
 * Função principal que será executada pelo acionador (trigger).
 */
function fetchMetaAdsData() {
  const allDataByBrand = {};

  for (const account of AD_ACCOUNTS) {
    Utilities.sleep(1000); // Pausa para não sobrecarregar a API
    const insights = getInsightsForAccount(account.id, account.name);
    if (insights && insights.length > 0) {
      allDataByBrand[account.name] = insights;
    } else {
      Logger.log(`Nenhum dado encontrado para a conta ${account.name}.`);
    }
  }

  if (Object.keys(allDataByBrand).length > 0) {
    saveJsonToDrive(allDataByBrand);
  } else {
    Logger.log('Nenhum dado foi retornado pela API da Meta após processar todas as contas.');
  }
}


/**
 * Busca os insights de uma única conta de anúncio.
 */
function getInsightsForAccount(adAccountId, accountName) {
  const fields = 'campaign_name,adset_name,ad_name,spend,impressions,clicks,cpc,actions,cost_per_action_type';
  const allInsights = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - i);
    
    // --- CORREÇÃO APLICADA AQUI ---
    const year = targetDate.getFullYear();
    const month = ('0' + (targetDate.getMonth() + 1)).slice(-2);
    const day = ('0' + targetDate.getDate()).slice(-2);
    const date_string = `${year}-${month}-${day}`;
    
    // Construção da URL com parâmetros separados para time_range, como sugerido pelo usuário.
    const baseUrl = `https://graph.facebook.com/v19.0/${adAccountId}/insights`;
    const params = {
      level: 'ad',
      fields: fields,
      'time_range[since]': date_string,
      'time_range[until]': date_string,
      access_token: ACCESS_TOKEN,
      limit: '1000'
    };
    
    const url = baseUrl + '?' + Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    // --- FIM DA CORREÇÃO ---

    try {
      Utilities.sleep(500);
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(response.getContentText());

      if (json.error) {
        Logger.log(`Erro ao buscar dados da conta ${accountName} para data ${date_string}: ${json.error.message}`);
        continue;
      }

      if (json.data && json.data.length > 0) {
        const formattedData = json.data.map(row => {
            const getActionValue = (actions, actionType) => {
              if (!actions) return 0;
              const action = actions.find(a => a.action_type === actionType);
              return action ? parseFloat(action.value) : 0;
            };

            const leads = getActionValue(row.actions, 'lead');
            const cpl = getActionValue(row.cost_per_action_type, 'lead');

            return {
              'Reporting starts': row.date_start,
              'Account': accountName,
              'Campaign name': row.campaign_name,
              'Ad set name': row.adset_name,
              'Ad name': row.ad_name,
              'Amount spent (BRL)': parseFloat(row.spend || 0),
              'Leads': leads,
              'Impressions': parseInt(row.impressions || 0, 10),
              'Clicks (all)': parseInt(row.clicks || 0, 10),
              'Cost per lead (BRL)': cpl,
              'CPC (all)': parseFloat(row.cpc || 0)
            };
        });
        allInsights.push(...formattedData);
      }
    } catch (e) {
      Logger.log(`Falha crítica na requisição para ${accountName} em ${date_string}: ${e.toString()}`);
    }
  }
  
  Logger.log(`Total de ${allInsights.length} linhas de insight encontradas para a conta ${accountName} nos últimos 30 dias.`);
  return allInsights;
}

/**
 * Salva um objeto JSON no Google Drive e loga o link de acesso direto.
 */
function saveJsonToDrive(data) {
  try {
    const jsonData = JSON.stringify(data);
    const blob = Utilities.newBlob(jsonData, 'application/json', OUTPUT_FILENAME);
    
    const files = DriveApp.getFilesByName(OUTPUT_FILENAME);
    let file;
    if (files.hasNext()) {
      file = files.next();
      file.setContent(jsonData);
      Logger.log(`Arquivo "${OUTPUT_FILENAME}" atualizado no Google Drive.`);
    } else {
      file = DriveApp.createFile(blob);
      Logger.log(`Arquivo "${OUTPUT_FILENAME}" criado no Google Drive.`);
    }
    
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    
    const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${file.getId()}`;
    Logger.log(`--- URL DE DADOS PARA O DASHBOARD ---`);
    Logger.log(directDownloadUrl);
    Logger.log(`------------------------------------`);

  } catch (e) {
    Logger.log(`Erro ao salvar JSON no Drive: ${e.toString()}`);
  }
}
