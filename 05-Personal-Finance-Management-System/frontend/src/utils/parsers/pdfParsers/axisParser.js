import { extractTransactionsFromText } from './baseParser';

export const id = 'axis';
export const label = 'Axis Bank';
export const detectionKeywords = ['axis bank', 'axis bank limited'];

export function parse(text) {
  return extractTransactionsFromText(text, {
    noisePatterns: [/axis bank limited/i, /tran date/i],
  });
}
