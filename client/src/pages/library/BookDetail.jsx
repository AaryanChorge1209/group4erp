import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, BookCopy, History, Bookmark, Loader2 } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate, formatDateTime } from '../../lib/utils';
import api from '../../lib/api';

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={active ? 'tab-active' : 'tab-inactive'}>
      {children}
    </button>
  );
}

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/library/books/${id}`).then(res => setBook(res.data.book || res.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  if (!book) return <div className="text-center py-20 text-gray-400">Book not found</div>;

  const availableCopies = book.copies?.filter(c => c.status === 'AVAILABLE').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/library/books" className="btn-ghost btn-sm"><ArrowLeft className="w-4 h-4" /> Back</Link>
      </div>

      {/* Header Card */}
      <div className="card p-6 flex flex-col sm:flex-row gap-6">
        <div className="w-28 h-36 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-12 h-12 text-primary-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{book.title}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">by {book.author}</p>
            </div>
            <span className={availableCopies > 0 ? 'badge-green text-sm' : 'badge-red text-sm'}>
              {availableCopies > 0 ? `${availableCopies} Available` : 'Not Available'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {[
              ['ISBN', book.isbn],
              ['Category', book.category],
              ['Publisher', book.publisher || '—'],
              ['Edition', book.edition || '—'],
              ['Language', book.language],
              ['Shelf', book.shelfLocation || '—'],
              ['Total Copies', book.totalCopies],
              ['Available', availableCopies],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          {book.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">{book.description}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700 flex gap-1 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: BookOpen },
          { key: 'copies', label: `Copies (${book.copies?.length || 0})`, icon: BookCopy },
          { key: 'history', label: 'Issue History', icon: History },
          { key: 'reservations', label: 'Reservations', icon: Bookmark },
        ].map(t => (
          <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            <t.icon className="w-4 h-4" /> {t.label}
          </TabButton>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'copies' && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Barcode</th><th>RFID Tag</th><th>Status</th><th>Condition</th><th>Acquired</th></tr></thead>
            <tbody>
              {(book.copies || []).map(copy => (
                <tr key={copy.id}>
                  <td className="font-mono font-medium">{copy.barcode}</td>
                  <td className="font-mono text-xs">{copy.rfidTag || '—'}</td>
                  <td><StatusBadge status={copy.status} /></td>
                  <td><span className="badge-gray">{copy.condition}</span></td>
                  <td>{formatDate(copy.acquisitionDate)}</td>
                </tr>
              ))}
              {!book.copies?.length && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No copies registered</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'history' && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Roll No</th><th>Copy</th><th>Issued</th><th>Due</th><th>Returned</th><th>Status</th></tr></thead>
            <tbody>
              {(book.copies || []).flatMap(c => c.issues || []).sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt)).map(issue => (
                <tr key={issue.id}>
                  <td className="font-medium">{issue.student?.user?.name}</td>
                  <td className="font-mono text-xs">{issue.student?.rollNumber}</td>
                  <td className="font-mono text-xs">{issue.bookCopy?.barcode}</td>
                  <td>{formatDate(issue.issuedAt)}</td>
                  <td>{formatDate(issue.dueDate)}</td>
                  <td>{issue.returnedAt ? formatDate(issue.returnedAt) : '—'}</td>
                  <td><StatusBadge status={issue.returnedAt ? 'RETURNED' : new Date(issue.dueDate) < new Date() ? 'OVERDUE' : 'ISSUED'} /></td>
                </tr>
              ))}
              {!(book.copies || []).flatMap(c => c.issues || []).length && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No issue history</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reservations' && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>#</th><th>Student</th><th>Roll No</th><th>Reserved On</th><th>Status</th></tr></thead>
            <tbody>
              {(book.reservations || []).map(r => (
                <tr key={r.id}>
                  <td className="font-bold text-primary-600">#{r.queuePosition}</td>
                  <td className="font-medium">{r.student?.user?.name}</td>
                  <td className="font-mono text-xs">{r.student?.rollNumber}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {!book.reservations?.length && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No reservations</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Copies', value: book.totalCopies, color: 'text-blue-600' },
            { label: 'Available', value: availableCopies, color: 'text-green-600' },
            { label: 'Issued', value: book.copies?.filter(c => c.status === 'ISSUED').length || 0, color: 'text-indigo-600' },
            { label: 'Reserved', value: book.copies?.filter(c => c.status === 'RESERVED').length || 0, color: 'text-amber-600' },
            { label: 'In Queue', value: book.reservations?.filter(r => r.status === 'PENDING').length || 0, color: 'text-purple-600' },
            { label: 'Lost/Damaged', value: book.copies?.filter(c => c.status === 'LOST').length || 0, color: 'text-red-600' },
          ].map(item => (
            <div key={item.label} className="card p-5 text-center">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
