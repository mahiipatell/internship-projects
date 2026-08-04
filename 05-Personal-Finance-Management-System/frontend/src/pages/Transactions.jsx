import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionList from '../components/transactions/TransactionList';
import transactionService from '../services/transaction.service';
import categoryService from '../services/category.service';
import reportService from '../services/report.service';

const DEFAULT_FILTERS = {
  search: '',
  type: '',
  categoryId: '',
  sortBy: 'date',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

function Transactions() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const loadTransactions = useCallback(() => {
    transactionService.getTransactions(filters).then((data) => {
      setTransactions(data.transactions);
      setPagination(data.pagination);
    });
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    categoryService.getCategories().then(setCategories);
  }, []);

  const openAddForm = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEditForm = (transaction) => {
    setEditing(transaction);
    setFormOpen(true);
  };

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await transactionService.updateTransaction(editing.id, data);
      } else {
        await transactionService.createTransaction(data);
      }
      setFormOpen(false);
      loadTransactions();
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    await transactionService.deleteTransaction(deleting.id);
    setDeleting(null);
    loadTransactions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Transactions</h1>
          <p className="text-sm text-olive-600/70">Manage your income and expenses.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/import">
            <Button variant="secondary">
              <Upload size={16} /> Import
            </Button>
          </Link>
          <div className="relative">
            <Button variant="secondary" onClick={() => setExportOpen((o) => !o)}>
              <Download size={16} /> Export
            </Button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 rounded-xl shadow-lift border border-olive-900/5 dark:border-gray-800 py-1 z-10">
                <button
                  onClick={() => {
                    reportService.downloadCsv();
                    setExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-cream dark:hover:bg-gray-800"
                >
                  <FileText size={15} /> CSV
                </button>
                <button
                  onClick={() => {
                    reportService.downloadExcel();
                    setExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-cream dark:hover:bg-gray-800"
                >
                  <FileSpreadsheet size={15} /> Excel
                </button>
                <button
                  onClick={() => {
                    reportService.downloadPdf();
                    setExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-cream dark:hover:bg-gray-800"
                >
                  <FileText size={15} /> PDF Report
                </button>
              </div>
            )}
          </div>
          <Button onClick={openAddForm}>
            <Plus size={16} /> Add Transaction
          </Button>
        </div>
      </div>

      <Card>
        <TransactionFilters filters={filters} onChange={setFilters} categories={categories} />
        <TransactionList
          transactions={transactions}
          pagination={pagination}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          onEdit={openEditForm}
          onDelete={setDeleting}
        />
      </Card>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          submitting={submitting}
        />
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Transaction" maxWidth="max-w-sm">
        <p className="text-sm text-olive-700 dark:text-gray-300 mb-6">
          Are you sure you want to delete "{deleting?.title}"? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Transactions;
