import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Bell, Loader2 } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import KpiCard from '../../components/ui/KpiCard';
import { formatDate, formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function OverdueList() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);

  const fetchOverdue = useCallback(() => {
    setLoading(true);
    api.get('/library/issues/overdue').then(res => {
      setIssues(Array.isArray(res.data) ? res.data : (res.data.data || res.data.issues || []));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOverdue(); }, [fetchOverdue]);

  const sendReminders = async () => {
    setReminding(true);
    try {
      await api.post('/library/reminders/send');
      toast.success('Overdue reminders sent to all students!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reminders');
    } finally { setReminding(false); }
  };

  const totalFine = issues.reduce((sum, i) => {
    const days = Math.ceil((new Date() - new Date(i.dueDate)) / (1000 * 60 * 60 * 24));
    return sum + days * 2;
  }, 0);

  const columns = [
    { key: 'student', label: 'Student', render: (_, row) => (
      <div>
        <p className="font-medium">{row.student?.user?.name}</p>
        <p className="text-xs text-gray-400 font-mono">{row.student?.rollNumber}</p>
      </div>
    )},
    { key: 'branch', label: 'Branch', render: (_, row) => <span className="badge-indigo">{row.student?.branch}</span> },
    { key: 'book', label: 'Book', render: (_, row) => (
      <div>
        <p className="font-medium max-w-xs truncate">{row.bookCopy?.book?.title}</p>
        <p className="text-xs text-gray-400 font-mono">{row.bookCopy?.barcode}</p>
      </div>
    )},
    { key: 'dueDate', label: 'Due Date', sortable: true, render: v => <span className="text-red-600 font-medium">{formatDate(v)}</span> },
    { key: 'daysOverdue', label: 'Days Overdue', sortable: true, render: (_, row) => {
      const days = Math.ceil((new Date() - new Date(row.dueDate)) / (1000 * 60 * 60 * 24));
      return <span className="badge-red">{days} days</span>;
    }},
    { key: 'fine', label: 'Est. Fine', render: (_, row) => {
      const days = Math.ceil((new Date() - new Date(row.dueDate)) / (1000 * 60 * 60 * 24));
      return <span className="font-semibold text-amber-600">{formatCurrency(days * 2)}</span>;
    }},
    { key: 'phone', label: 'Contact', render: (_, row) => row.student?.phone || '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Overdue Books</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Books that have crossed their due date</p>
        </div>
        <button onClick={sendReminders} disabled={reminding} className="btn-danger">
          {reminding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          Send Reminders to All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard title="Total Overdue" value={issues.length} icon={AlertTriangle} color="red" />
        <KpiCard title="Est. Total Fine" value={formatCurrency(totalFine)} icon={AlertTriangle} color="amber" />
        <KpiCard title="Fine Rate" value="₹2 / day" icon={AlertTriangle} color="indigo" />
      </div>

      <DataTable
        columns={columns}
        data={issues}
        loading={loading}
        total={issues.length}
        searchPlaceholder="Search by student name or roll no..."
        onExportCsv={() => window.open('/api/reports/library/issues?status=overdue&export=csv', '_blank')}
      />
    </div>
  );
}
