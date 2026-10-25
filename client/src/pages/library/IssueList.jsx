import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate, daysFromNow } from '../../lib/utils';
import api from '../../lib/api';

const TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'returned', label: 'Returned' },
  { key: 'overdue', label: 'Overdue' },
];

export default function IssueList() {
  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, pageSize, ...(search && { q: search }), ...(statusTab && { status: statusTab }) });
    api.get(`/library/issues?${params}`).then(res => {
      setIssues(res.data.issues || res.data || []);
      setTotal(res.data.total || 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, pageSize, search, statusTab]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);
  useEffect(() => { setPage(1); }, [search, statusTab]);

  const columns = [
    { key: 'student', label: 'Student', sortable: true, render: (_, row) => (
      <div>
        <p className="font-medium text-gray-800 dark:text-gray-200">{row.student?.user?.name}</p>
        <p className="text-xs text-gray-400 font-mono">{row.student?.rollNumber}</p>
      </div>
    )},
    { key: 'book', label: 'Book', render: (_, row) => (
      <div>
        <p className="font-medium text-gray-800 dark:text-gray-200 max-w-xs truncate">{row.bookCopy?.book?.title}</p>
        <p className="text-xs text-gray-400 font-mono">Barcode: {row.bookCopy?.barcode}</p>
      </div>
    )},
    { key: 'issuedAt', label: 'Issued', sortable: true, render: v => formatDate(v) },
    { key: 'dueDate', label: 'Due Date', sortable: true, render: (v, row) => {
      if (row.returnedAt) return formatDate(v);
      const days = daysFromNow(v);
      const isOverdue = days < 0;
      return (
        <span className={isOverdue ? 'text-red-600 font-medium' : days <= 2 ? 'text-amber-600 font-medium' : ''}>
          {formatDate(v)}
          {!row.returnedAt && <span className="block text-xs mt-0.5">{isOverdue ? `${Math.abs(days)}d overdue` : `${days}d left`}</span>}
        </span>
      );
    }},
    { key: 'returnedAt', label: 'Returned', render: v => v ? formatDate(v) : '—' },
    { key: 'status', label: 'Status', render: (_, row) => {
      if (row.returnedAt) return <StatusBadge status="RETURNED" />;
      if (new Date(row.dueDate) < new Date()) return <StatusBadge status="OVERDUE" />;
      return <StatusBadge status="ISSUED" />;
    }},
    { key: 'fine', label: 'Fine', render: (_, row) => row.fine ? (
      <span className={row.fine.isPaid ? 'badge-green' : 'badge-red'}>
        ₹{row.fine.amount} {row.fine.isPaid ? '(Paid)' : '(Pending)'}
      </span>
    ) : '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Issue Tracking</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">All book issues and returns</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700 flex gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setStatusTab(t.key)}
            className={statusTab === t.key ? 'tab-active' : 'tab-inactive'}>
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={issues}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={ps => { setPageSize(ps); setPage(1); }}
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search by student name, roll no, book title..."
        onExportCsv={() => window.open(`/api/reports/library/issues?export=csv`, '_blank')}
        onPrint={() => window.print()}
      />
    </div>
  );
}
