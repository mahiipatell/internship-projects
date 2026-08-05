import { extractTransactionsFromText } from './baseParser';

export const id = 'icici';
export const label = 'ICICI Bank';
export const detectionKeywords = ['icici bank', 'icici bank limited'];

export function parse(text) {
  return extractTransactionsFromText(text, {
    noisePatterns: [/icici bank limited/i, /transaction remarks/i],
  });
}
