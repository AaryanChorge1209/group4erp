import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, CheckCircle, XCircle, Eye, Globe } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Consulting', 'E-Commerce', 'Automotive', 'Telecom', 'Education', 'Other'];

function AddCompanyModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', industry: '', website: '', email: '', phone: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.industry || !form.email) { toast.error('Name, industry, and email are required'); return; }
    setSaving(true);
    try {
      await api.post('/placement/companies', form);
      toast.success('Company registered!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register');
    } finally { setSaving(false); }
  };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Register Company" size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSubmit} disabled={saving} className="btn-primary"><Plus className="w-4 h-4" />Register</button></>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><label className="label">Company Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div>
          <label className="label">Industry *</label>
          <select className="select" value={form.industry} onChange={e => set('industry', e.target.value)}>
            <option value="">Select...</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div><label className="label">Website</label><input className="input" placeholder="https://" value={form.website} onChange={e => set('website', e.target.value)} /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
        <div className="md:col-span-2"><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>
      </div>
    </Modal>
  );
}

export default function Companies() {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'PLACEMENT_OFFICER'].includes(user?.role);
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [approveConfirm, setApproveConfirm] = useState(null);
  const [rejectConfirm, setRejectConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompanies = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, pageSize, ...(search && { q: search }), ...(statusFilter && { status: statusFilter }) });
    api.get(`/placement/companies?${params}`).then(res => {
      const list = res.data.data || res.data.companies || (Array.isArray(res.data) ? res.data : []);
      setCompanies(list);
      setTotal(res.data.pagination?.total ?? res.data.total ?? list.length);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/placement/companies/${approveConfirm.id}/approve`);
      toast.success('Company approved!');
      fetchCompanies();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setActionLoading(false); setApproveConfirm(null); }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await api.post(`/placement/companies/${rejectConfirm.id}/reject`);
      toast.success('Company rejected');
      fetchCompanies();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setActionLoading(false); setRejectConfirm(null); }
  };

  const columns = [
    { key: 'name', label: 'Company', sortable: true, render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <Link to={`/placement/companies/${row.id}`} className="font-medium text-primary-600 hover:underline">{v}</Link>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'industry', label: 'Industry', render: v => <span className="badge-indigo">{v}</span> },
    { key: 'website', label: 'Website', render: v => v ? <a href={v} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline flex items-center gap-1"><Globe className="w-3.5 h-3.5" />Link</a> : '—' },
    { key: '_count', label: 'Drives', render: (v) => <span className="font-medium">{v?.drives || 0}</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'createdAt', label: 'Registered', sortable: true, render: v => formatDate(v) },
    ...(canManage ? [{
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <Link to={`/placement/companies/${row.id}`} className="btn-ghost btn-sm"><Eye className="w-4 h-4" /></Link>
          {row.status === 'PENDING' && (
            <>
              <button onClick={() => setApproveConfirm(row)} className="btn-success btn-sm"><CheckCircle className="w-3.5 h-3.5" /></button>
              <button onClick={() => setRejectConfirm(row)} className="btn-danger btn-sm"><XCircle className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      )
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Registered recruitment partners</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select className="select w-auto text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          {canManage && <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Company</button>}
        </div>
      </div>

      <DataTable columns={columns} data={companies} loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={setPage} onPageSizeChange={ps => { setPageSize(ps); setPage(1); }}
        onSearch={setSearch} searchValue={search} searchPlaceholder="Search by company name..."
      />

      <AddCompanyModal open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchCompanies} />
      <ConfirmDialog open={!!approveConfirm} onClose={() => setApproveConfirm(null)} onConfirm={handleApprove}
        title="Approve Company" message={`Approve ${approveConfirm?.name}? They will be able to post drives.`}
        confirmText="Approve" variant="warning" loading={actionLoading} />
      <ConfirmDialog open={!!rejectConfirm} onClose={() => setRejectConfirm(null)} onConfirm={handleReject}
        title="Reject Company" message={`Reject ${rejectConfirm?.name}?`}
        confirmText="Reject" variant="danger" loading={actionLoading} />
    </div>
  );
}
