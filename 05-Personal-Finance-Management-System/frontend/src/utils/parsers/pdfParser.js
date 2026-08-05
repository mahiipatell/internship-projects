import * as pdfjsLib from 'pdfjs-dist';

// Vite-friendly worker setup for pdfjs-dist v4 (ESM build).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extracts raw text from a text-based PDF bank statement. Scanned (image-
 * only) PDFs are explicitly out of scope for this version — we detect
 * that case and raise a friendly error rather than silently returning
 * nothing.
 */
export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    if (err?.name === 'PasswordException') {
      throw new Error('This PDF is password protected. Please remove the password and try again.');
    }
    throw new Error('This PDF could not be read. It may be corrupted or in an unsupported format.');
  }

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(' ') + '\n';
  }

  // A scanned/image-only PDF yields little to no extractable text.
  if (fullText.replace(/\s/g, '').length < 20) {
    throw new Error(
      "This looks like a scanned PDF — scanned statement support isn't available yet. Please upload a text-based statement PDF, or export as CSV/Excel instead."
    );
  }

  return fullText;
}
