import { useState, useEffect, useCallback } from 'react';
import { BookCopy, X, Loader2 } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReservations = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, pageSize, ...(search && { q: search }), ...(statusFilter && { status: statusFilter }) });
    api.get(`/library/reservations?${params}`).then(res => {
      setReservations(res.data.reservations || res.data || []);
      setTotal(res.data.total || 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleCancel = async () => {
    if (!cancelConfirm) return;
    setActionLoading(true);
    try {
      await api.delete(`/library/reservations/${cancelConfirm.id}`);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    } finally { setActionLoading(false); setCancelConfirm(null); }
  };

  const handleNotifyNext = async (bookId) => {
    try {
      await api.post(`/library/reservations/notify`, { bookId });
      toast.success('Next student notified');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to notify');
    }
  };

  const columns = [
    { key: 'queue', label: '#', width: '50px', render: (_, row) => (
      <span className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center text-sm font-bold">
        {row.queuePosition}
      </span>
    )},
    { key: 'book', label: 'Book', render: (_, row) => (
      <div>
        <p className="font-medium">{row.book?.title}</p>
        <p className="text-xs text-gray-400">{row.book?.author}</p>
      </div>
    )},
    { key: 'student', label: 'Student', render: (_, row) => (
      <div>
        <p className="font-medium">{row.student?.user?.name}</p>
        <p className="text-xs text-gray-400 font-mono">{row.student?.rollNumber}</p>
      </div>
    )},
    { key: 'createdAt', label: 'Reserved On', sortable: true, render: v => formatDate(v) },
    { key: 'notifiedAt', label: 'Notified', render: v => v ? formatDate(v) : '—' },
    { key: 'expiresAt', label: 'Expires', render: v => v ? formatDate(v) : '—' },
    { key: 'status', label: 'Status', render: (_, row) => <StatusBadge status={row.status} /> },
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex gap-1">
        {row.status === 'PENDING' && (
          <button onClick={() => setCancelConfirm(row)} className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Book Reservations</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">FIFO queue management for reserved books</p>
        </div>
        <select className="select w-auto text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="NOTIFIED">Notified</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={reservations}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={ps => { setPageSize(ps); setPage(1); }}
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search by book title or student name..."
      />

      <ConfirmDialog
        open={!!cancelConfirm}
        onClose={() => setCancelConfirm(null)}
        onConfirm={handleCancel}
        title="Cancel Reservation"
        message={`Cancel reservation #${cancelConfirm?.queuePosition} for ${cancelConfirm?.student?.user?.name} for "${cancelConfirm?.book?.title}"?`}
        confirmText="Cancel Reservation"
        loading={actionLoading}
      />
    </div>
  );
}
