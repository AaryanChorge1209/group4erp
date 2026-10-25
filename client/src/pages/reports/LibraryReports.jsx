import { useState, useEffect, useCallback } from 'react';
import { Download, Loader2, BookOpen, DollarSign } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import KpiCard from '../../components/ui/KpiCard';
import { formatDate, formatCurrency } from '../../lib/utils';
import api from '../../lib/api';

export default function LibraryReports() {
  const [tab, setTab] = useState('issues');
  const [issueData, setIssueData] = useState({ records: [], stats: {} });
  const [fineData, setFineData] = useState({ records: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchReports = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ ...(dateFrom && { from: dateFrom }), ...(dateTo && { to: dateTo }) });
    Promise.all([
      api.get(`/reports/library/issues?${params}`),
      api.get(`/reports/library/fines?${params}`),
    ]).then(([iRes, fRes]) => {
      setIssueData(iRes.data);
      setFineData(fRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const issueColumns = [
    { key: 'student', label: 'Student', render: (_, row) => row.student?.user?.name || '—' },
    { key: 'rollNo', label: 'Roll No', render: (_, row) => row.student?.rollNumber || '—' },
    { key: 'book', label: 'Book', render: (_, row) => row.bookCopy?.book?.title || '—' },
    { key: 'issuedAt', label: 'Issued', render: v => formatDate(v) },
    { key: 'dueDate', label: 'Due Date', render: v => formatDate(v) },
    { key: 'returnedAt', label: 'Returned', render: v => v ? formatDate(v) : 'Active' },
  ];

  const fineColumns = [
    { key: 'student', label: 'Student', render: (_, row) => row.student?.user?.name || '—' },
    { key: 'book', label: 'Book', render: (_, row) => row.bookIssue?.bookCopy?.book?.title || '—' },
    { key: 'daysOverdue', label: 'Days', render: v => `${v}d` },
    { key: 'amount', label: 'Amount', render: v => formatCurrency(v) },
    { key: 'isPaid', label: 'Status', render: (v, row) => row.isWaived ? <span className="badge-gray">Waived</span> : v ? <span className="badge-green">Paid</span> : <span className="badge-red">Unpaid</span> },
    { key: 'createdAt', label: 'Created', render: v => formatDate(v) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="page-title">Library Reports</h1>
        <button onClick={() => window.open(`/api/reports/library/${tab}?export=csv&from=${dateFrom}&to=${dateTo}`, '_blank')} className="btn-secondary btn-sm gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Date filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div>
          <label className="text-xs text-gray-500">From</label>
          <input type="date" className="input h-9 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500">To</label>
          <input type="date" className="input h-9 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-slate-700 flex gap-1">
        <button onClick={() => setTab('issues')} className={tab === 'issues' ? 'tab-active' : 'tab-inactive'}>Issue Report</button>
        <button onClick={() => setTab('fines')} className={tab === 'fines' ? 'tab-active' : 'tab-inactive'}>Fine Report</button>
      </div>

      {tab === 'issues' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Total Issues" value={issueData.stats?.totalIssues || 0} icon={BookOpen} color="blue" />
            <KpiCard title="Active" value={issueData.stats?.active || 0} icon={BookOpen} color="indigo" />
            <KpiCard title="Returned" value={issueData.stats?.returned || 0} icon={BookOpen} color="green" />
            <KpiCard title="Overdue" value={issueData.stats?.overdue || 0} icon={BookOpen} color="red" />
          </div>
          <DataTable columns={issueColumns} data={issueData.records || []} loading={loading} total={(issueData.records || []).length} />
        </>
      )}

      {tab === 'fines' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Total Fines" value={formatCurrency(fineData.stats?.totalAmount || 0)} icon={DollarSign} color="blue" />
            <KpiCard title="Collected" value={formatCurrency(fineData.stats?.paidAmount || 0)} icon={DollarSign} color="green" />
            <KpiCard title="Pending" value={formatCurrency(fineData.stats?.pendingAmount || 0)} icon={DollarSign} color="red" />
            <KpiCard title="Waived" value={formatCurrency(fineData.stats?.waivedAmount || 0)} icon={DollarSign} color="gray" />
          </div>
          <DataTable columns={fineColumns} data={fineData.records || []} loading={loading} total={(fineData.records || []).length} />
        </>
      )}
    </div>
  );
}
