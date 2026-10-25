import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen, Download, Eye, Loader2 } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['All', 'Computer Science', 'Electronics', 'Mathematics', 'Physics', 'Chemistry', 'Management', 'Literature'];

export default function OPAC() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availOnly, setAvailOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [reserving, setReserving] = useState(false);

  const fetchBooks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ ...(search && { q: search }), ...(category && { category }), ...(availOnly && { available: 'true' }) });
    api.get(`/library/books/opac/search?${params}`).then(res => {
      setBooks(res.data.books || res.data || []);
      setTotal(res.data.total || 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search, category, availOnly]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleReserve = async (bookId) => {
    if (!user?.studentId) { toast.error('Please log in as a student to reserve books'); return; }
    setReserving(true);
    try {
      await api.post('/library/reservations', { bookId, studentId: user.studentId });
      toast.success('Book reserved! You have been added to the queue.');
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reservation failed');
    } finally { setReserving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="card p-8 bg-gradient-to-br from-primary-600 to-primary-800 text-white text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-80" />
        <h1 className="text-3xl font-bold mb-2">Library Catalog</h1>
        <p className="text-primary-200 mb-6">Search our collection of {total}+ books</p>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="input pl-12 h-12 text-base"
            placeholder="Search by title, author, ISBN, subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c === 'All' ? '' : c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (c === 'All' && !category) || c === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 ml-auto cursor-pointer">
          <input type="checkbox" checked={availOnly} onChange={e => setAvailOnly(e.target.checked)} className="w-4 h-4 accent-primary-600" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Available only</span>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No books found</p>
          <p className="text-sm mt-1">Try a different search term or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map(book => {
            const available = book.availableCopies > 0;
            return (
              <div key={book.id} className="card p-4 flex flex-col gap-3 hover:shadow-card-hover transition-shadow">
                <div className="w-full h-36 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{book.author}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge-indigo text-xs">{book.category}</span>
                    <span className={available ? 'badge-green text-xs' : 'badge-red text-xs'}>
                      {available ? `${book.availableCopies} Available` : 'Not Available'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">ISBN: {book.isbn}</p>
                  {book.shelfLocation && <p className="text-xs text-gray-400">Shelf: {book.shelfLocation}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedBook(book)} className="btn-secondary btn-sm flex-1">
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>
                  {user?.role === 'STUDENT' && !available && (
                    <button onClick={() => handleReserve(book.id)} disabled={reserving} className="btn-primary btn-sm flex-1">
                      Reserve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Detail Modal */}
      <Modal open={!!selectedBook} onClose={() => setSelectedBook(null)} title={selectedBook?.title} size="md">
        {selectedBook && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Author', selectedBook.author], ['ISBN', selectedBook.isbn], ['Category', selectedBook.category],
                ['Publisher', selectedBook.publisher || '—'], ['Edition', selectedBook.edition || '—'],
                ['Language', selectedBook.language], ['Shelf Location', selectedBook.shelfLocation || '—'],
                ['Available Copies', `${selectedBook.availableCopies} of ${selectedBook.totalCopies}`]
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">{k}</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{v}</p>
                </div>
              ))}
            </div>
            {selectedBook.description && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{selectedBook.description}</p>}
            {user?.role === 'STUDENT' && selectedBook.availableCopies === 0 && (
              <button onClick={() => { handleReserve(selectedBook.id); setSelectedBook(null); }} disabled={reserving} className="btn-primary w-full justify-center">
                {reserving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Reserve this Book
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
