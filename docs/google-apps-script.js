// ========= CONFIGURATION =========
// The ID of the Google Sheet containing the ad data.
var SPREADSHEET_ID = "15i8L_30a5X5uY22dCgy3yH7t3gC9_a1G4T2FkMKSX3E";
// ===============================

/**
 * @OnlyCurrentDoc
 * This function adds a custom menu to the spreadsheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Sinal Intel Hub')
      .addItem('Sincronizar Dados (Manual)', 'doGet')
      .addToUi();
}

/**
 * This is the web app entry point.
 * It's called by the Next.js backend.
 * It fetches data from all sheets, formats it as JSON, and returns it.
 */
function doGet(e) {
  try {
    console.log("Iniciando a busca de dados de todas as planilhas...");
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

    console.log("Busca de dados concluída. Retornando JSON.");
    return ContentService.createContent(JSON.stringify(allSheetsData))
                         .setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    console.error("Ocorreu um erro durante a execução: " + e.toString());
    // Retorna um erro em formato JSON para o cliente
    return ContentService.createContent(JSON.stringify({ error: "Ocorreu um erro no servidor do Apps Script.", details: e.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
