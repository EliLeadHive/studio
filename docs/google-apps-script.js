// v1 - Asynchronous Sync Model

// ========= CONFIGURATION =========
// The ID of the Google Sheet containing the ad data.
var SPREADSHEET_ID = "15i8L_30a5X5uY22dCgy3yH7t3gC9_a1G4T2FkMKSX3E";

// The name of the file that will be created/updated in Google Drive with the data.
var OUTPUT_FILENAME = "meta_ads_data.json";
// ===============================


/**
 * @OnlyCurrentDoc
 * This function adds a custom menu to the spreadsheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Sinal Intel Hub')
      .addItem('Sincronizar Dados Agora', 'syncData')
      .addToUi();
}

/**
 * Main function to be called by a time-based trigger or manually.
 * It fetches the data from all sheets and saves it to a file in Google Drive.
 */
function syncData() {
  try {
    console.log("Iniciando a sincronização dos dados...");
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var allSheetsData = {};
    var sheets = spreadsheet.getSheets();

    sheets.forEach(function(sheet) {
      var sheetName = sheet.getName();
      // Pula a sincronização se o nome da planilha for 'Visão Geral'
      if (sheetName === 'Visão Geral') {
          console.log("Pulando a planilha 'Visão Geral'.");
          return;
      }
      
      console.log("Processando a planilha: " + sheetName);
      var data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        var headers = data[0];
        var jsonData = [];
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          // Ignora linhas vazias
          if (row.join("").length === 0) continue;
          var obj = {};
          for (var j = 0; j < headers.length; j++) {
            var header = headers[j];
            if (header) { // Garante que o cabeçalho não está vazio
                var value = row[j];
                 // Formata a data se o cabeçalho for "Reporting starts"
                if (header === "Reporting starts" && value instanceof Date) {
                    value = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
                }
                obj[header] = value;
            }
          }
          jsonData.push(obj);
        }
        allSheetsData[sheetName] = jsonData;
      } else {
        console.log("Nenhum dado encontrado na planilha: " + sheetName);
      }
    });

    var jsonString = JSON.stringify(allSheetsData, null, 2);
    
    saveOrUpdateFile(OUTPUT_FILENAME, jsonString, 'application/json');
    
    console.log("Sincronização concluída com sucesso.");

  } catch(e) {
    console.error("Ocorreu um erro durante a sincronização: " + e.toString());
    // Optional: Send an email notification on failure
    // MailApp.sendEmail("your-email@example.com", "Erro na Sincronização do Sinal Intel Hub", e.toString());
  }
}

/**
 * Saves or updates a file in the root of Google Drive.
 * @param {string} fileName The name of the file.
 * @param {string} content The content of the file.
 * @param {string} mimeType The MIME type of the file.
 */
function saveOrUpdateFile(fileName, content, mimeType) {
    var files = DriveApp.getFilesByName(fileName);
    var file;
    
    if (files.hasNext()) {
        // File exists, update it
        file = files.next();
        file.setContent(content);
        console.log("Arquivo '" + fileName + "' atualizado no Google Drive.");
    } else {
        // File does not exist, create it
        file = DriveApp.createFile(fileName, content, mimeType);
        console.log("Arquivo '" + fileName + "' criado no Google Drive.");
    }
    
    // Ensure the file is publicly accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
}

/**
 * This is the web app entry point. It serves the cached JSON data.
 * It's called by the Next.js backend.
 */
function doGet(e) {
  try {
    console.log("Recebida uma requisição GET para os dados.");
    var files = DriveApp.getFilesByName(OUTPUT_FILENAME);
    
    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString();
      console.log("Dados encontrados no arquivo '" + OUTPUT_FILENAME + "'. Retornando conteúdo.");
      return ContentService.createContent(content).setMimeType(ContentService.MimeType.JSON);
    } else {
      console.error("Arquivo de dados '" + OUTPUT_FILENAME + "' não encontrado. Execute a sincronização primeiro.");
      // Return an empty object or an error message as JSON
      return ContentService.createContent(JSON.stringify({ error: "Arquivo de dados não encontrado. Execute a sincronização manual." }))
                         .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(e) {
     console.error("Erro na função doGet: " + e.toString());
     return ContentService.createContent(JSON.stringify({ error: "Ocorreu um erro no servidor do Apps Script.", details: e.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
