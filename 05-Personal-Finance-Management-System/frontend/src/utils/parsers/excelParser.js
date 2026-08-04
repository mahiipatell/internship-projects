import * as XLSX from 'xlsx';

/**
 * Parses a .xlsx File into { headers, rows, sheetName }. Automatically
 * detects worksheets and picks the one that looks most like a transaction
 * table (the sheet with the most non-empty rows), so users don't have to
 * manually pick a tab if their export has a summary sheet plus a data sheet.
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('This Excel file has no worksheets.'));
          return;
        }

        let bestSheet = null;
        let bestRows = [];

        workbook.SheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          if (json.length > bestRows.length) {
            bestRows = json;
            bestSheet = name;
          }
        });

        if (!bestSheet || bestRows.length === 0) {
          reject(new Error('No transaction data was found in any worksheet.'));
          return;
        }

        const headers = Object.keys(bestRows[0]);
        resolve({ headers, rows: bestRows, sheetName: bestSheet });
      } catch (err) {
        reject(new Error('This Excel file could not be read. Please check the format and try again.'));
      }
    };

    reader.onerror = () => reject(new Error('This Excel file could not be read.'));
    reader.readAsArrayBuffer(file);
  });
}
