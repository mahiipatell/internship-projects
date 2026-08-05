import { extractTransactionsFromText } from './baseParser';

export const id = 'kotak';
export const label = 'Kotak Mahindra Bank';
export const detectionKeywords = ['kotak mahindra bank', 'kotak bank'];

export function parse(text) {
  return extractTransactionsFromText(text, {
    noisePatterns: [/kotak mahindra bank/i, /chq\/ref no/i],
  });
}
