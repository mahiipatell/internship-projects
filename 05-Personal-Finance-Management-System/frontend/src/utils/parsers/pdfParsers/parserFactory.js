import * as hdfc from './hdfcParser';
import * as sbi from './sbiParser';
import * as icici from './iciciParser';
import * as axis from './axisParser';
import * as kotak from './kotakParser';
import * as idfc from './idfcParser';
import * as bob from './bobParser';
import { extractTransactionsFromText } from './baseParser';

// Registry of every bank-specific parser. Adding a new bank later is just
// adding one more small file here — the rest of the Import Center (upload,
// preview, categorize, duplicate detection, summary) needs no changes.
export const PDF_BANK_PARSERS = [hdfc, sbi, icici, axis, kotak, idfc, bob];

export function detectBank(text) {
  const lower = text.toLowerCase();
  return PDF_BANK_PARSERS.find((parser) => parser.detectionKeywords.some((k) => lower.includes(k))) || null;
}

export function getParserById(id) {
  return PDF_BANK_PARSERS.find((parser) => parser.id === id) || null;
}

// Generic fallback when no specific bank is detected/selected — uses the
// same shared extractor with no bank-specific noise-line tuning.
export function parseGeneric(text) {
  return extractTransactionsFromText(text);
}
