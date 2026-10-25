import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Eye, Edit2, BookCopy } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['Computer Science', 'Electronics', 'Mathematics', 'Physics', 'Chemistry', 'Management', 'Literature', 'History', 'Economics', 'Law', 'Medical', 'Other'];

function AddBookModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', author: '', isbn: '', category: '', publisher: '', edition: '', language: 'English', description: '', shelfLocation: '', totalCopies: 1 });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (!form.isbn.trim()) e.isbn = 'ISBN is required';
    if (!form.category) e.category = 'Category is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/library/books', form);
      toast.success('Book added successfully!');
      onSuccess();
      onClose();
      setForm({ title: '', author: '', isbn: '', category: '', publisher: '', edition: '', language: 'English', description: '', shelfLocation: '', totalCopies: 1 });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add book');
    } finally { setSaving(false); }
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  return (
    <Modal open={open} onClose={onClose} title="Add New Book" size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? <span className="spinner w-4 h-4" /> : <Plus className="w-4 h-4" />}Add Book</button></>}
    >
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><label className="label">Title *</label><input className={`input ${errors.title ? 'border-red-500' : ''}`} value={form.title} onChange={e => set('title', e.target.value)} />{errors.title && <p className="form-error">{errors.title}</p>}</div>
        <div><label className="label">Author *</label><input className={`input ${errors.author ? 'border-red-500' : ''}`} value={form.author} onChange={e => set('author', e.target.value)} />{errors.author && <p className="form-error">{errors.author}</p>}</div>
        <div><label className="label">ISBN *</label><input className={`input ${errors.isbn ? 'border-red-500' : ''}`} value={form.isbn} onChange={e => set('isbn', e.target.value)} />{errors.isbn && <p className="form-error">{errors.isbn}</p>}</div>
        <div>
          <label className="label">Category *</label>
          <select className={`select ${errors.category ? 'border-red-500' : ''}`} value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="form-error">{errors.category}</p>}
        </div>
        <div><label className="label">Publisher</label><input className="input" value={form.publisher} onChange={e => set('publisher', e.target.value)} /></div>
        <div><label className="label">Edition</label><input className="input" value={form.edition} onChange={e => set('edition', e.target.value)} /></div>
        <div><label className="label">Language</label><input className="input" value={form.language} onChange={e => set('language', e.target.value)} /></div>
        <div><label className="label">Shelf Location</label><input className="input" placeholder="e.g. A-2-3" value={form.shelfLocation} onChange={e => set('shelfLocation', e.target.value)} /></div>
        <div><label className="label">Number of Copies</label><input type="number" min={1} max={100} className="input" value={form.totalCopies} onChange={e => set('totalCopies', Number(e.target.value))} /></div>
        <div className="md:col-span-2"><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>
      </form>
    </Modal>
  );
}

export default function BookCatalog() {
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'LIBRARIAN'].includes(user?.role);
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchBooks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, pageSize, ...(search && { q: search }), ...(categoryFilter && { category: categoryFilter }), ...(availFilter && { available: availFilter }) });
    api.get(`/library/books?${params}`).then(res => {
      setBooks(res.data.books || res.data || []);
      setTotal(res.data.total || (res.data || []).length);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, pageSize, search, categoryFilter, availFilter]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  useEffect(() => { setPage(1); }, [search, categoryFilter, availFilter]);

  const columns = [
    { key: 'title', label: 'Title', sortable: true, render: (v, row) => (
      <div>
        <Link to={`/library/books/${row.id}`} className="font-medium text-primary-600 hover:underline">{v}</Link>
        <p className="text-xs text-gray-400 mt-0.5">{row.author}</p>
      </div>
    )},
    { key: 'isbn', label: 'ISBN', sortable: true },
    { key: 'category', label: 'Category', render: v => <span className="badge-indigo">{v}</span> },
    { key: 'publisher', label: 'Publisher' },
    { key: 'copies', label: 'Copies', render: (v, row) => (
      <span className="font-medium">
        <span className="text-green-600">{row.availableCopies ?? 0}</span>
        <span className="text-gray-400"> / {row.totalCopies}</span>
      </span>
    )},
    { key: 'shelfLocation', label: 'Shelf' },
    ...(canEdit ? [{
      key: 'actions', label: '', width: '80px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link to={`/library/books/${row.id}`} className="btn-icon btn-ghost btn-sm" title="View"><Eye className="w-4 h-4" /></Link>
          <button className="btn-icon btn-ghost btn-sm" title="Edit"><Edit2 className="w-4 h-4" /></button>
        </div>
      )
    }] : [{
      key: 'actions', label: '',
      render: (_, row) => <Link to={`/library/books/${row.id}`} className="btn-ghost btn-sm">View</Link>
    }]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Book Catalog</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} books in the library</p>
        </div>
        {canEdit && (
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Book
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select className="select w-auto text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select w-auto text-sm" value={availFilter} onChange={e => setAvailFilter(e.target.value)}>
          <option value="">All Availability</option>
          <option value="true">Available</option>
          <option value="false">Not Available</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={books}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={ps => { setPageSize(ps); setPage(1); }}
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search by title, author, ISBN..."
        onExportCsv={() => toast.success('Exporting CSV...')}
      />

      <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchBooks} />
    </div>
  );
}
