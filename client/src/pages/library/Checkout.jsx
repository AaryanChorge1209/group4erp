import { useState, useEffect, useRef } from 'react';
import { Scan, User, BookOpen, CheckCircle, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../../lib/api';

function ResultCard({ result }) {
  if (!result) return null;
  if (result.error) return (
    <div className="card p-5 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-700 dark:text-red-300">Checkout Failed</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{result.error}</p>
        </div>
      </div>
    </div>
  );
  const issue = result.issue || result;
  return (
    <div className="card p-5 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-700 dark:text-green-300">Book Checked Out Successfully!</p>
          <p className="text-sm text-green-600 dark:text-green-400">Issue recorded in the system</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-gray-500 dark:text-gray-400">Student</p><p className="font-semibold text-gray-800 dark:text-gray-200">{issue?.student?.user?.name}</p></div>
        <div><p className="text-gray-500 dark:text-gray-400">Roll No</p><p className="font-semibold text-gray-800 dark:text-gray-200">{issue?.student?.rollNumber}</p></div>
        <div><p className="text-gray-500 dark:text-gray-400">Book Title</p><p className="font-semibold text-gray-800 dark:text-gray-200">{issue?.bookCopy?.book?.title}</p></div>
        <div><p className="text-gray-500 dark:text-gray-400">Barcode</p><p className="font-mono font-semibold text-gray-800 dark:text-gray-200">{issue?.bookCopy?.barcode}</p></div>
        <div><p className="text-gray-500 dark:text-gray-400">Issued Date</p><p className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(issue?.issuedAt)}</p></div>
        <div><p className="text-gray-500 dark:text-gray-400">Due Date</p><p className="font-semibold text-amber-600 dark:text-amber-400">{formatDate(issue?.dueDate)}</p></div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState(user?.student?.rollNumber || user?.student?.id || '');
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const barcodeRef = useRef(null);

  useEffect(() => {
    if ((user?.student?.rollNumber || user?.student?.id) && !studentId) {
      setStudentId(user.student?.rollNumber || user.student?.id);
    }
  }, [user]);

  const fetchRecent = () => {
    api.get('/library/issues?limit=8&sort=desc').then(res => {
      const list = res.data.data || res.data.issues || (Array.isArray(res.data) ? res.data : []);
      setRecentIssues(Array.isArray(list) ? list : []);
    }).catch(() => {});
  };

  useEffect(() => { fetchRecent(); }, []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    const effectiveStudentId = studentId.trim() || user?.student?.rollNumber || user?.student?.id;
    if (!effectiveStudentId) { toast.error('Please enter Student ID or Roll Number'); return; }
    if (!barcode.trim()) { toast.error('Please enter Book Barcode'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/library/issues/checkout', { studentId: effectiveStudentId, barcode: barcode.trim() });
      setResult(res.data);
      toast.success('Book checked out successfully!');
      setBarcode('');
      barcodeRef.current?.focus();
      fetchRecent();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Checkout failed';
      setResult({ error: errMsg });
      toast.error(errMsg);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Book Checkout</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Scan or enter student ID and book barcode to issue a book</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleCheckout} className="space-y-5">
          <div>
            <label className="label">
              <User className="w-4 h-4 inline mr-1.5 text-gray-400" />
              Student ID / Roll Number *
            </label>
            <input
              className="input text-lg font-mono h-12"
              placeholder="e.g. 22CS001 or student user ID"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">
              <Scan className="w-4 h-4 inline mr-1.5 text-gray-400" />
              Book Barcode / RFID Tag *
            </label>
            <input
              ref={barcodeRef}
              className="input text-lg font-mono h-12"
              placeholder="e.g. BC001 — scan or type"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Connect a barcode scanner (keyboard-wedge) and scan the copy barcode</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center h-11 text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
            {loading ? 'Processing...' : 'Issue Book'}
          </button>
        </form>
      </div>

      {result && <ResultCard result={result} />}

      {/* Recent Issues */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Checkouts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Roll No</th><th>Book Title</th><th>Barcode</th><th>Issued</th><th>Due</th></tr></thead>
            <tbody>
              {recentIssues.filter(i => !i.returnedAt).map(issue => (
                <tr key={issue.id}>
                  <td className="font-medium">{issue.student?.user?.name}</td>
                  <td className="font-mono text-xs">{issue.student?.rollNumber}</td>
                  <td className="max-w-48 truncate">{issue.bookCopy?.book?.title}</td>
                  <td className="font-mono text-xs">{issue.bookCopy?.barcode}</td>
                  <td>{formatDate(issue.issuedAt)}</td>
                  <td className={new Date(issue.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                    {formatDate(issue.dueDate)}
                  </td>
                </tr>
              ))}
              {recentIssues.filter(i => !i.returnedAt).length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No recent checkouts</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
