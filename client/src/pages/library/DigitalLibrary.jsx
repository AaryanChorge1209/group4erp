import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Eye, Loader2, FileText, BookOpen } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useDropzone } from 'react-dropzone';

const TYPES = ['EBOOK', 'JOURNAL', 'PAPER'];
const CATEGORIES = ['Computer Science', 'Electronics', 'Mathematics', 'Physics', 'Chemistry', 'Management', 'Literature', 'Research'];

function UploadModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', author: '', category: '', type: 'EBOOK', description: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] },
    maxSize: 50 * 1024 * 1024,
    onDrop: (accepted) => { if (accepted[0]) setFile(accepted[0]); },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !file) { toast.error('Title, category and file are required'); return; }
    setUploading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    try {
      await api.post('/library/digital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Resource uploaded successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Upload Digital Resource" size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSubmit} disabled={uploading} className="btn-primary">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Upload</button></>}
    >
      <div className="space-y-4">
        <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Author</label><input className="input" value={form.author} onChange={e => set('author', e.target.value)} /></div>
          <div>
            <label className="label">Category *</label>
            <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Type</label>
          <div className="flex gap-2">
            {TYPES.map(t => (
              <button key={t} type="button" onClick={() => set('type', t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.type === t ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
        <div>
          <label className="label">File (PDF or DOCX, max 50MB) *</label>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-slate-600 hover:border-primary-400'}`}>
            <input {...getInputProps()} />
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            {file ? <p className="text-sm font-medium text-primary-600">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
              : <><p className="text-sm text-gray-500">Drag & drop a PDF here, or click to browse</p><p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 50MB</p></>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function DigitalLibrary() {
  const { user } = useAuth();
  const canUpload = ['ADMIN', 'LIBRARIAN'].includes(user?.role);
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchResources = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ ...(search && { q: search }), ...(category && { category }), ...(type && { type }) });
    api.get(`/library/digital?${params}`).then(res => {
      setResources(res.data.resources || res.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search, category, type]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const handleDownload = async (resource) => {
    try {
      await api.get(`/library/digital/${resource.id}`);
      window.open(`/uploads/digital/${resource.fileUrl?.split('/').pop()}`, '_blank');
      fetchResources();
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const typeIcon = (t) => ({ EBOOK: '📚', JOURNAL: '📰', PAPER: '📄' }[t] || '📄');
  const typeColor = (t) => ({ EBOOK: 'badge-blue', JOURNAL: 'badge-green', PAPER: 'badge-purple' }[t] || 'badge-gray');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Digital Library</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">E-books, journals, and research papers</p>
        </div>
        {canUpload && (
          <button onClick={() => setUploadOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Upload Resource
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <input className="input pl-9 text-sm" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} />
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <select className="select w-auto text-sm" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select w-auto text-sm" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No resources found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resources.map(r => (
            <div key={r.id} className="card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow">
              <div className="text-4xl text-center py-4 bg-gray-50 dark:bg-slate-700 rounded-lg">{typeIcon(r.type)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">{r.title}</h3>
                {r.author && <p className="text-xs text-gray-500 mt-0.5">{r.author}</p>}
                <div className="flex gap-2 mt-2">
                  <span className={typeColor(r.type)}>{r.type}</span>
                  <span className="badge-gray">{r.category}</span>
                </div>
                {r.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{r.description}</p>}
                <p className="text-xs text-gray-400 mt-2">{r.downloads || 0} downloads</p>
              </div>
              <button onClick={() => handleDownload(r)} className="btn-primary w-full justify-center btn-sm">
                <Download className="w-3.5 h-3.5" /> Download / View
              </button>
            </div>
          ))}
        </div>
      )}

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={fetchResources} />
    </div>
  );
}
