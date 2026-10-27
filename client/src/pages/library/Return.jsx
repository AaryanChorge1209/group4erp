import { useState, useEffect } from 'react';
import { Scan, CheckCircle, AlertTriangle, Loader2, Clock, DollarSign } from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';
import api from '../../lib/api';

function ReturnResultCard({ result }) {
  if (!result) return null;
  if (result.error) return (
    <div className="card p-5 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-700 dark:text-red-300">Return Failed</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{result.error}</p>
        </div>
      </div>
    </div>
  );
  const issue = result.issue || result;
  return (
    <div className={`card p-5 ${result.fine ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20' : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'}`}>
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className={`w-8 h-8 flex-shrink-0 ${result.fine ? 'text-amber-600' : 'text-green-600'}`} />
        <div>
          <p className={`font-semibold ${result.fine ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}`}>
            Book Returned {result.fine ? 'with Fine' : 'Successfully'}
          </p>
          <p className={`text-sm mt-0.5 ${result.fine ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
            {result.fine ? `A fine of ${formatCurrency(result.fine.amount)} has been applied` : 'No fine — returned on time!'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-gray-500 dark:text-gray-400">Student</p><p className="font-semibold text-gray-800 dark:text-gray-200">{issue?.student?.user?.name || 'Student'}</p></div>
        <div><p className="text-gray-500 dark:text-gray-400">Roll No</p><p className="font-mono font-semibold text-gray-800 dark:text-gray-200">{issue?.student?.rollNumber || '—'}</p></div>
        <div><p className="text-gray-500 dark:text-gray-400">Book</p><p className="font-semibold text-gray-800 dark:text-gray-200">{issue?.bookCopy?.book?.title || 'Book'}</p></div>
        <div><p className="text-gray-500 dark:text-gray-400">Returned On</p><p className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(issue?.returnedAt || new Date())}</p></div>
        {result.fine && (
          <>
            <div><p className="text-gray-500 dark:text-gray-400">Days Overdue</p><p className="font-semibold text-red-600">{result.fine.daysOverdue} days</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Fine Amount</p><p className="font-bold text-amber-600 text-lg">{formatCurrency(result.fine.amount)}</p></div>
          </>
        )}
        {result.nextReservation && (
          <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">📬 Next in queue notified</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              {result.nextReservation.student?.user?.name} has been notified. Book held for 48 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Return() {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recentReturns, setRecentReturns] = useState([]);

  const fetchRecent = () => {
    api.get('/library/issues?status=returned&limit=8').then(res => {
      const list = res.data.data || res.data.issues || (Array.isArray(res.data) ? res.data : []);
      setRecentReturns(Array.isArray(list) ? list : []);
    }).catch(() => {});
  };

  useEffect(() => { fetchRecent(); }, []);

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) { toast.error('Please enter a book barcode'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/library/issues/return', { barcode: barcode.trim() });
      setResult(res.data);
      toast.success('Book returned successfully!');
      setBarcode('');
      fetchRecent();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Return failed';
      setResult({ error: errMsg });
      toast.error(errMsg);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Book Return</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Scan or enter the book barcode to process a return</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleReturn} className="space-y-5">
          <div>
            <label className="label">
              <Scan className="w-4 h-4 inline mr-1.5 text-gray-400" />
              Book Barcode / RFID Tag *
            </label>
            <input
              className="input text-lg font-mono h-12"
              placeholder="e.g. BC001 — scan or type"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">Scan the barcode on the book copy to process the return</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center h-11 text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {loading ? 'Processing...' : 'Return Book'}
          </button>
        </form>
      </div>

      {result && <ReturnResultCard result={result} />}

      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Returns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Book Title</th><th>Barcode</th><th>Returned</th><th>Fine</th></tr></thead>
            <tbody>
              {recentReturns.map(issue => (
                <tr key={issue.id}>
                  <td className="font-medium">{issue.student?.user?.name}</td>
                  <td className="max-w-48 truncate">{issue.bookCopy?.book?.title}</td>
                  <td className="font-mono text-xs">{issue.bookCopy?.barcode}</td>
                  <td>{formatDate(issue.returnedAt)}</td>
                  <td>{issue.fine ? <span className="badge-amber">{formatCurrency(issue.fine.amount)}</span> : <span className="badge-green">None</span>}</td>
                </tr>
              ))}
              {!recentReturns.length && <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No recent returns</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
