/**
 * STRAY DOG MENU — Google Apps Script API
 * Attach this script to the MASTER MENU Google Spreadsheet.
 *
 * Deploy > New deployment > Web app
 * Execute as: Me
 * Who has access: Anyone
 * Copy the /exec URL into CONFIG.apiUrl in app.js
 */
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const output = {};

  ss.getSheets().forEach(sheet => {
    const values = sheet.getDataRange().getDisplayValues();
    if (values.length < 5) return;

    // Find the row containing ITEM instead of assuming a fixed row.
    let headerIndex = values.findIndex(row =>
      row.some(cell => String(cell).trim().toUpperCase() === 'ITEM')
    );
    if (headerIndex < 0) return;

    const headers = values[headerIndex].map(v => String(v).trim().toUpperCase());
    const ix = name => headers.indexOf(name);
    const itemIx = ix('ITEM');
    if (itemIx < 0) return;

    let currentCategory = '';
    const rows = [];

    values.slice(headerIndex + 1).forEach(row => {
      const categoryIx = ix('CATEGORY');
      const cat = categoryIx >= 0 ? String(row[categoryIx] || '').trim() : '';
      if (cat) currentCategory = cat;

      const item = String(row[itemIx] || '').trim();
      if (!item) return;

      const rawPrice = ix('PRICE') >= 0 ? String(row[ix('PRICE')] || '') : '';
      const numericPrice = rawPrice.replace(/[^\d]/g, '');

      rows.push({
        category: currentCategory,
        item: item,
        description: ix('DESCRIPTION') >= 0 ? row[ix('DESCRIPTION')] : '',
        price: numericPrice ? Number(numericPrice) : '',
        notes: ix('NOTES') >= 0 ? row[ix('NOTES')] : '',
        update: ix('UPDATE') >= 0 ? row[ix('UPDATE')] : ''
      });
    });

    output[sheet.getName()] = rows;
  });

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}