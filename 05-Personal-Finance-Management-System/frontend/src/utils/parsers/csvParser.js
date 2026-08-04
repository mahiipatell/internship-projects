import Papa from 'papaparse';

/**
 * Parses a .csv File into { headers, rows }. Shared by Bank Statement,
 * Credit Card Statement, and UPI Export — they all go through PapaParse,
 * they just differ in which column-alias/provider detection runs after.
 */
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          reject(new Error('This CSV file has no rows we can import.'));
          return;
        }
        resolve({ headers: results.meta.fields || [], rows: results.data });
      },
      error: () => reject(new Error('Invalid CSV file — it could not be parsed.')),
    });
  });
}
