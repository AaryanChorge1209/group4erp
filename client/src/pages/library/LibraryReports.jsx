import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download, Printer, Filter, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate, formatCurrency } from '../../lib/utils';

export function LibraryReports() {
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' or 'fines'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(true);

  // Issues report data
  const [issuesData, setIssuesData] = useState([]);
  const [issuesSummary, setIssuesSummary] = useState(null);

  // Fines report data
  const [finesData, setFinesData] = useState([]);
  const [finesSummary, setFinesSummary] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'issues') {
        const res = await api.get('/reports/library/issues', {
          params: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            branch: branch || undefined
          }
        });
        setIssuesData(res.data.data || []);
        setIssuesSummary(res.data.summary || null);
      } else {
        const res = await api.get('/reports/library/fines', {
          params: {
            startDate: startDate || undefined,
            endDate: endDate || undefined
          }
        });
        setFinesData(res.data.data || []);
        setFinesSummary(res.data.summary || null);
      }
    } catch {
      toast.error('Failed to generate report dataset');
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, branch]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = async () => {
    try {
      const endpoint = activeTab === 'issues' ? '/reports/library/issues' : '/reports/library/fines';
      const res = await api.get(endpoint, {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          branch: branch || undefined,
          export: 'csv'
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `library_${activeTab}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report exported to CSV');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Issues columns
  const issueColumns = [
    {
      key: 'student',
      label: 'Student & Branch',
      render: (_, row) => (
        <div>
          <p className="font-bold text-xs text-gray-900 dark:text-white">{row.student?.user?.name}</p>
          <p className="text-[11px] text-gray-500 font-mono">{row.student?.rollNumber} • {row.student?.branch}</p>
        </div>
      )
    },
    {
      key: 'book',
      label: 'Book Title',
      render: (_, row) => (
        <div>
          <p className="font-medium text-xs text-gray-900 dark:text-white max-w-xs truncate">{row.bookCopy?.book?.title}</p>
          <p className="text-[11px] font-mono text-gray-400">{row.bookCopy?.barcode}</p>
        </div>
      )
    },
    {
      key: 'issuedAt',
      label: 'Issued Date',
      render: (val) => <span className="text-xs">{formatDate(val)}</span>
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (val) => <span className="text-xs font-semibold">{formatDate(val)}</span>
    },
    {
      key: 'returnedAt',
      label: 'Returned Date',
      render: (val) => (
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {val ? formatDate(val) : <span className="text-amber-600 font-semibold">Active Loan</span>}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const now = new Date();
        const isOverdue = !row.returnedAt && new Date(row.dueDate) < now;
        return <StatusBadge status={row.returnedAt ? 'RETURNED' : isOverdue ? 'OVERDUE' : 'ISSUED'} />;
      }
    }
  ];

  // Fines columns
  const fineColumns = [
    {
      key: 'student',
      label: 'Student',
      render: (_, row) => (
        <div>
          <p className="font-bold text-xs text-gray-900 dark:text-white">{row.student?.user?.name}</p>
          <p className="text-[11px] text-gray-500 font-mono">{row.student?.rollNumber}</p>
        </div>
      )
    },
    {
      key: 'book',
      label: 'Book Title',
      render: (_, row) => (
        <span className="text-xs font-medium">{row.bookIssue?.bookCopy?.book?.title || 'Book'}</span>
      )
    },
    {
      key: 'daysOverdue',
      label: 'Days Overdue',
      render: (val) => <span className="text-xs font-semibold text-red-600">+{val} Days</span>
    },
    {
      key: 'amount',
      label: 'Amount (₹)',
      render: (val) => <span className="font-bold text-xs text-red-600">{formatCurrency(val)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const s = row.isWaived ? 'WAIVED' : row.isPaid ? 'PAID' : 'PENDING';
        return <StatusBadge status={s} />;
      }
    },
    {
      key: 'receiptNumber',
      label: 'Receipt #',
      render: (val) => <span className="font-mono text-xs text-gray-500">{val || 'Unpaid'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library Analytics & Compliance Reports"
        subtitle="Auditable circulation metrics, department usage breakdowns, and cash fine logs"
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <button type="button" onClick={handleExportCSV} className="btn btn-secondary btn-sm">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button type="button" onClick={handlePrint} className="btn btn-secondary btn-sm">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6 text-sm font-semibold print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          className={`py-3 border-b-2 transition ${
            activeTab === 'issues'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Book Circulation Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fines')}
          className={`py-3 border-b-2 transition ${
            activeTab === 'fines'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Fine Revenue & Ledger Report
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input py-1 px-2 h-8 w-auto text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input py-1 px-2 h-8 w-auto text-xs"
            />
          </div>

          {activeTab === 'issues' && (
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="input py-1 px-2 h-8 w-auto text-xs"
            >
              <option value="">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="IT">IT</option>
              <option value="MECH">MECH</option>
            </select>
          )}

          <button
            type="button"
            onClick={fetchReports}
            className="btn btn-primary btn-sm text-xs py-1 px-3"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {activeTab === 'issues' && issuesSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard title="Total Loans" value={issuesSummary.totalIssues} color="blue" />
          <KpiCard title="Active Loans" value={issuesSummary.activeIssues} color="purple" />
          <KpiCard title="Returned" value={issuesSummary.returnedIssues} color="green" />
          <KpiCard title="Overdue" value={issuesSummary.overdueIssues} color="red" />
        </div>
      )}

      {activeTab === 'fines' && finesSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard title="Total Penalties" value={finesSummary.totalFines} color="amber" />
          <KpiCard title="Collected (₹)" value={formatCurrency(finesSummary.totalCollected || 0)} color="green" />
          <KpiCard title="Pending (₹)" value={formatCurrency(finesSummary.totalPending || 0)} color="red" />
          <KpiCard title="Waived (₹)" value={formatCurrency(finesSummary.totalWaived || 0)} color="purple" />
        </div>
      )}

      {/* Report DataTable */}
      <DataTable
        columns={activeTab === 'issues' ? issueColumns : fineColumns}
        data={activeTab === 'issues' ? issuesData : finesData}
        loading={loading}
        searchPlaceholder="Filter report records..."
      />
    </div>
  );
}

export default LibraryReports;
