import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import FileDropzone from './FileDropzone';
import ImportFormatSelector, { IMPORT_FORMATS } from './ImportFormatSelector';
import ImportTransactionTable from './ImportTransactionTable';
import ImportSummary from './ImportSummary';
import ManualColumnMapper from './ManualColumnMapper';
import { detectColumns, validateColumnMap, normalizeRows } from '../../utils/importUtils';
import { parseCsvFile } from '../../utils/parsers/csvParser';
import { parseExcelFile } from '../../utils/parsers/excelParser';
import { detectUpiProvider } from '../../utils/parsers/upiProviders';
import { extractPdfText } from '../../utils/parsers/pdfParser';
import { detectBank, getParserById, parseGeneric } from '../../utils/parsers/pdfParsers/parserFactory';
import { computeImportStats } from '../../utils/importStats';
import transactionService from '../../services/transaction.service';
import categoryService from '../../services/category.service';
import budgetService from '../../services/budget.service';
import importHistoryService from '../../services/importHistory.service';
import BankSelector from './BankSelector';

const STEPS = ['Choose Import Type', 'Upload File', 'Preview Transactions', 'Review Categories', 'Import Summary'];

function ProgressHeader({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
              ${i <= step ? 'bg-primary-500 text-olive-900' : 'bg-olive-900/10 text-olive-600/50'}`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs font-medium hidden md:block ${
              i <= step ? 'text-olive-900' : 'text-olive-600/40'
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px ${i < step ? 'bg-primary-400' : 'bg-olive-900/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ImportWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState('bank-csv');
  const [fileError, setFileError] = useState('');
  const [fileName, setFileName] = useState('');
  const [detectedLabel, setDetectedLabel] = useState('');
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [budgetSnapshot, setBudgetSnapshot] = useState(null);
  const [manualMapping, setManualMapping] = useState(null); // { headers } when auto-detect fails
  const [pendingBankSelection, setPendingBankSelection] = useState(null); // { text } when bank detection fails
  const [bankChoice, setBankChoice] = useState('');
  const [importMeta, setImportMeta] = useState({ detectedBank: null, parserUsed: null, startedAt: null });

  useEffect(() => {
    categoryService.getCategories('expense').then((expenseCats) => {
      categoryService.getCategories('income').then((incomeCats) => {
        setCategories([...expenseCats, ...incomeCats]);
      });
    });
  }, []);

  const selectedFormat = IMPORT_FORMATS.find((f) => f.id === format);

  const finishParsing = async (normalized) => {
    if (normalized.length === 0) {
      setFileError('No valid transaction rows were found in this file.');
      setProcessing(false);
      return;
    }

    const dupResults = await transactionService.checkDuplicates(
      normalized.map((r) => ({ title: r.title, amount: r.amount, date: r.date }))
    );
    const dupMap = new Map(dupResults.map((d) => [d.index, d.isDuplicate]));
    const withDuplicates = normalized.map((r, i) => ({ ...r, isDuplicate: dupMap.get(i) || false }));

    setRows(withDuplicates);
    setManualMapping(null);
    setProcessing(false);
    setStep(2);
  };

  const runDetection = async (headers, rawRows) => {
    if (format === 'upi-csv') {
      const provider = detectUpiProvider(headers);
      setDetectedLabel(provider ? `Detected: ${provider.label} export` : '');
      setImportMeta((m) => ({ ...m, detectedBank: provider ? provider.label : null, parserUsed: 'upi' }));
    } else if (selectedFormat.parserId !== 'pdf') {
      setDetectedLabel('');
      setImportMeta((m) => ({ ...m, parserUsed: selectedFormat.parserId }));
    }

    const columnMap = detectColumns(headers);
    const validation = validateColumnMap(columnMap);

    if (!validation.valid) {
      // Fall back to manual mapping instead of a dead-end error.
      setManualMapping({ headers, rawRows });
      setProcessing(false);
      return;
    }

    await finishParsing(normalizeRows(rawRows, columnMap));
  };

  const handleFileSelected = async (file) => {
    setFileError('');
    setDetectedLabel('');

    const expectedExt = selectedFormat.fileAccept;
    if (!file.name.toLowerCase().endsWith(expectedExt)) {
      setFileError(`Unsupported format — please upload a ${expectedExt} file.`);
      return;
    }
    if (file.size === 0) {
      setFileError('This file is empty.');
      return;
    }

    setFileName(file.name);
    setProcessing(true);
    setImportMeta({ detectedBank: null, parserUsed: null, startedAt: Date.now() });

    try {
      if (selectedFormat.parserId === 'pdf') {
        const text = await extractPdfText(file);
        const bankParser = detectBank(text);

        if (bankParser) {
          setDetectedLabel(`Detected: ${bankParser.label} statement`);
          setImportMeta((m) => ({ ...m, detectedBank: bankParser.label, parserUsed: bankParser.id }));
          const { headers, rows: rawRows } = bankParser.parse(text);
          if (rawRows.length === 0) {
            setFileError('This statement format is not supported yet. Please select your bank below, or try CSV/Excel export instead.');
            setPendingBankSelection({ text });
            setProcessing(false);
            return;
          }
          await runDetection(headers, rawRows);
        } else {
          // Detection failed — let the user pick their bank manually.
          setPendingBankSelection({ text });
          setProcessing(false);
        }
        return;
      }

      let headers, rawRows;
      if (selectedFormat.parserId === 'excel') {
        const parsed = await parseExcelFile(file);
        headers = parsed.headers;
        rawRows = parsed.rows;
      } else {
        const parsed = await parseCsvFile(file);
        headers = parsed.headers;
        rawRows = parsed.rows;
      }
      await runDetection(headers, rawRows);
    } catch (err) {
      setFileError(err.message || 'Something went wrong reading this file.');
      setProcessing(false);
    }
  };

  const handleBankConfirm = async () => {
    setProcessing(true);
    setFileError('');
    const { text } = pendingBankSelection;

    const parser = bankChoice ? getParserById(bankChoice) : null;
    const parserLabel = parser ? parser.label : 'Generic';
    setImportMeta((m) => ({ ...m, detectedBank: parserLabel, parserUsed: parser ? parser.id : 'generic' }));
    setDetectedLabel(`Using: ${parserLabel} parser`);

    const { headers, rows: rawRows } = parser ? parser.parse(text) : parseGeneric(text);

    if (rawRows.length === 0) {
      setFileError("Unable to detect any transactions in this statement. Please try a different bank selection, or export as CSV/Excel instead.");
      setProcessing(false);
      return;
    }

    setPendingBankSelection(null);
    await runDetection(headers, rawRows);
  };

  const handleManualMappingConfirm = async (columnMap) => {
    setProcessing(true);
    await finishParsing(normalizeRows(manualMapping.rawRows, columnMap));
  };

  const readyCount = rows.filter((r) => r.isValid).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const incomeCount = rows.filter((r) => r.type === 'income').length;
  const expenseCount = rows.filter((r) => r.type === 'expense').length;

  const handleCommitImport = async () => {
    setProcessing(true);
    const toImport = rows.filter(
      (r) => r.include && r.isValid && r.type && (!r.isDuplicate || r.duplicateAction === 'import')
    );
    const skippedDuplicates = rows.filter((r) => r.isDuplicate && r.duplicateAction === 'skip').length;

    try {
      const result = await transactionService.bulkImport(
        toImport.map((r) => ({
          title: r.title,
          amount: r.amount,
          type: r.type,
          categoryName: r.categoryName,
          date: r.date,
        }))
      );
      const budget = await budgetService.getBudget();

      setImportResult({ ...result, skippedDuplicates });
      setImportStats(computeImportStats(toImport));
      setBudgetSnapshot(budget);

      const status = result.failed > 0 ? (result.imported > 0 ? 'partial' : 'failed') : 'success';
      importHistoryService
        .createRecord({
          fileName,
          importType: format,
          detectedBank: importMeta.detectedBank,
          parserUsed: importMeta.parserUsed,
          totalRows: rows.length,
          transactionsImported: result.imported,
          duplicatesSkipped: skippedDuplicates,
          failedRows: result.failed,
          importDurationMs: importMeta.startedAt ? Date.now() - importMeta.startedAt : null,
          status,
        })
        .catch(() => {});

      setStep(4);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="max-w-5xl mx-auto">
      <ProgressHeader step={step} />

      {step === 0 && (
        <div className="space-y-6">
          <h2 className="font-semibold text-olive-900">Choose a format</h2>
          <ImportFormatSelector selected={format} onSelect={setFormat} />
          <div className="flex justify-end">
            <Button onClick={() => setStep(1)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="font-semibold text-olive-900">
            Upload your {selectedFormat.label.toLowerCase()}
          </h2>

          {manualMapping ? (
            <ManualColumnMapper
              headers={manualMapping.headers}
              onConfirm={handleManualMappingConfirm}
              onCancel={() => setManualMapping(null)}
            />
          ) : pendingBankSelection ? (
            <>
              {fileError && (
                <div className="text-sm text-expense bg-expense/10 rounded-xl px-4 py-2.5">{fileError}</div>
              )}
              <BankSelector
                value={bankChoice}
                onChange={setBankChoice}
                onConfirm={handleBankConfirm}
                onCancel={() => setPendingBankSelection(null)}
              />
            </>
          ) : (
            <>
              <FileDropzone
                accept={selectedFormat.fileAccept}
                onFileSelected={handleFileSelected}
                error={fileError}
              />
              {processing && (
                <div className="flex items-center gap-2 text-sm text-olive-600/70">
                  <Spinner size={16} /> Reading {fileName}...
                </div>
              )}
              {detectedLabel && (
                <div className="text-sm text-primary-700 bg-primary-100 rounded-xl px-4 py-2.5">
                  {detectedLabel}
                </div>
              )}
            </>
          )}

          <div className="flex justify-start">
            <Button variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-cream p-4 text-center">
              <p className="text-lg font-bold text-olive-900">{rows.length}</p>
              <p className="text-[11px] text-olive-600/60 uppercase">Detected</p>
            </div>
            <div className="rounded-xl bg-cream p-4 text-center">
              <p className="text-lg font-bold text-income">{incomeCount}</p>
              <p className="text-[11px] text-olive-600/60 uppercase">Income</p>
            </div>
            <div className="rounded-xl bg-cream p-4 text-center">
              <p className="text-lg font-bold text-expense">{expenseCount}</p>
              <p className="text-[11px] text-olive-600/60 uppercase">Expense</p>
            </div>
            <div className="rounded-xl bg-cream p-4 text-center">
              <p className="text-lg font-bold text-primary-600">{duplicateCount}</p>
              <p className="text-[11px] text-olive-600/60 uppercase">Possible Duplicates</p>
            </div>
          </div>

          <ImportTransactionTable rows={rows} editable={false} categories={categories} onRowChange={() => {}} />

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Continue to Review</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <p className="text-sm text-olive-600/70">
            Edit categories, types, or amounts before importing. Uncheck any row to leave it out.
          </p>
          <ImportTransactionTable rows={rows} editable categories={categories} onRowChange={setRows} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleCommitImport} disabled={processing || readyCount === 0}>
              {processing ? 'Importing...' : `Import ${readyCount} Transactions`}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && importResult && importStats && (
        <ImportSummary
          result={importResult}
          stats={importStats}
          budget={budgetSnapshot}
          onViewTransactions={() => navigate('/transactions')}
          onGoToDashboard={() => navigate('/dashboard')}
        />
      )}
    </Card>
  );
}

export default ImportWizard;
