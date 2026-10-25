import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Printer } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate, formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const TABS = [
  { key: '', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'paid', label: 'Paid' },
  { key: 'waived', label: 'Waived' },
];

function ReceiptModal({ open, onClose, fine }) {
  if (!fine) return null;
  return (
    <Modal open={open} onClose={onClose} title="Fine Receipt" size="md">
      <div className="text-center border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 space-y-4" id="fine-receipt">
        <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">VVIT College of Engineering</h2>
          <p className="text-sm text-gray-500">Library Fine Receipt</p>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Receipt No.</span>
          <span className="font-mono font-semibold">{fine.receiptNumber}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Date</span>
          <span className="font-semibold">{formatDate(fine.paidAt)}</span>
        </div>
        <div className="border-t border-b border-gray-200 dark:border-slate-700 py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Student</span>
            <span className="font-semibold">{fine.student?.user?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Roll No.</span>
            <span className="font-mono">{fine.student?.rollNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Book</span>
            <span className="font-semibold text-right max-w-48">{fine.bookIssue?.bookCopy?.book?.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Days Overdue</span>
            <span className="font-semibold text-red-600">{fine.daysOverdue} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Rate</span>
            <span>₹2 per day</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">Total Paid</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(fine.amount)}</span>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3">
          <p className="text-green-700 dark:text-green-300 font-bold text-xl tracking-widest">✓ PAID</p>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button onClick={() => window.print()} className="btn-secondary gap-2">
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </div>
    </Modal>
  );
}

export default function FineManagement() {
  const [fines, setFines] = useState([]);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, waived: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [payConfirm, setPayConfirm] = useState(null);
  const [waiveConfirm, setWaiveConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [receiptFine, setReceiptFine] = useState(null);

  const fetchFines = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, pageSize, ...(search && { q: search }), ...(tab && { status: tab }) });
    Promise.all([
      api.get(`/library/fines?${params}`),
      api.get('/library/fines/report')
    ]).then(([res, repRes]) => {
      const data = res.data;
      const list = data.data || data.fines || (Array.isArray(data) ? data : []);
      setFines(list);
      setTotal(data.pagination?.total ?? data.total ?? list.length);
      if (repRes.data?.summary) {
        const s = repRes.data.summary;
        setStats({
          total: (s.totalCollected || 0) + (s.totalPending || 0) + (s.totalWaived || 0),
          paid: s.totalCollected || 0,
          pending: s.totalPending || 0,
          waived: s.totalWaived || 0
        });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, pageSize, search, tab]);

  useEffect(() => { fetchFines(); }, [fetchFines]);
  useEffect(() => { setPage(1); }, [search, tab]);

  const handlePay = async () => {
    if (!payConfirm) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/library/fines/${payConfirm.id}/pay`);
      toast.success(`Fine paid! Receipt: ${res.data.fine?.receiptNumber}`);
      setReceiptFine(res.data.fine);
      fetchFines();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally { setActionLoading(false); setPayConfirm(null); }
  };

  const handleWaive = async () => {
    if (!waiveConfirm) return;
    setActionLoading(true);
    try {
      await api.post(`/library/fines/${waiveConfirm.id}/waive`);
      toast.success('Fine waived successfully');
      fetchFines();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Waive failed');
    } finally { setActionLoading(false); setWaiveConfirm(null); }
  };

  const columns = [
    { key: 'student', label: 'Student', render: (_, row) => (
      <div>
        <p className="font-medium">{row.student?.user?.name}</p>
        <p className="text-xs text-gray-400 font-mono">{row.student?.rollNumber}</p>
      </div>
    )},
    { key: 'book', label: 'Book', render: (_, row) => (
      <p className="max-w-xs truncate">{row.bookIssue?.bookCopy?.book?.title}</p>
    )},
    { key: 'daysOverdue', label: 'Days Overdue', sortable: true, render: v => <span className="badge-red">{v}d</span> },
    { key: 'amount', label: 'Amount', sortable: true, render: v => <span className="font-semibold text-amber-600">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: (_, row) => {
      if (row.isWaived) return <StatusBadge status="WAIVED" />;
      if (row.isPaid) return <StatusBadge status="PAID" />;
      return <StatusBadge status="UNPAID" />;
    }},
    { key: 'createdAt', label: 'Created', sortable: true, render: v => formatDate(v) },
    { key: 'actions', label: 'Actions', render: (_, row) => {
      if (row.isPaid) return (
        <button onClick={() => setReceiptFine(row)} className="btn-ghost btn-sm gap-1"><Printer className="w-3.5 h-3.5" />Receipt</button>
      );
      if (row.isWaived) return null;
      return (
        <div className="flex gap-1">
          <button onClick={() => setPayConfirm(row)} className="btn-success btn-sm">Pay</button>
          <button onClick={() => setWaiveConfirm(row)} className="btn-secondary btn-sm">Waive</button>
        </div>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Fine Management</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage library fines, payments, and waivers</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Fines" value={formatCurrency(stats.total)} icon={DollarSign} color="blue" />
        <KpiCard title="Pending" value={formatCurrency(stats.pending)} icon={DollarSign} color="red" />
        <KpiCard title="Collected" value={formatCurrency(stats.paid)} icon={DollarSign} color="green" />
        <KpiCard title="Waived" value={formatCurrency(stats.waived)} icon={DollarSign} color="gray" />
      </div>

      <div className="border-b border-gray-200 dark:border-slate-700 flex gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={tab === t.key ? 'tab-active' : 'tab-inactive'}>{t.label}</button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={fines}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={ps => { setPageSize(ps); setPage(1); }}
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search by student name or roll no..."
        onExportCsv={() => window.open('/api/reports/library/fines?export=csv', '_blank')}
      />

      <ConfirmDialog
        open={!!payConfirm}
        onClose={() => setPayConfirm(null)}
        onConfirm={handlePay}
        title="Confirm Fine Payment"
        message={`Mark fine of ${formatCurrency(payConfirm?.amount)} for ${payConfirm?.student?.user?.name} as paid? This will generate a receipt.`}
        confirmText="Mark as Paid"
        variant="warning"
        loading={actionLoading}
      />
      <ConfirmDialog
        open={!!waiveConfirm}
        onClose={() => setWaiveConfirm(null)}
        onConfirm={handleWaive}
        title="Waive Fine"
        message={`Waive fine of ${formatCurrency(waiveConfirm?.amount)} for ${waiveConfirm?.student?.user?.name}? This action cannot be undone.`}
        confirmText="Waive Fine"
        variant="warning"
        loading={actionLoading}
      />
      <ReceiptModal open={!!receiptFine} onClose={() => setReceiptFine(null)} fine={receiptFine} />
    </div>
  );
}
