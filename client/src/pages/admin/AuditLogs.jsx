import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Shield, Filter, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import usePagination from '../../hooks/usePagination';
import { formatDate } from '../../lib/utils';

export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const { page, pageSize, total, setTotal, onPageChange, onPageSizeChange } = usePagination(1, 15);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        action: actionFilter || undefined
      };
      const res = await api.get('/admin/audit-logs', { params });
      let list = res.data.data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (l) =>
            l.user?.name?.toLowerCase().includes(q) ||
            l.action?.toLowerCase().includes(q) ||
            l.entity?.toLowerCase().includes(q)
        );
      }
      setLogs(list);
      setTotal(res.data.pagination?.total || list.length);
    } catch {
      toast.error('Failed to load audit trails');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, search, setTotal]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      sortable: true,
      render: (val) => (
        <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
          {formatDate(val, 'dd MMM yyyy, hh:mm:ss a')}
        </span>
      )
    },
    {
      key: 'user',
      label: 'Acting User',
      render: (u) => (
        <div>
          <p className="font-bold text-xs text-gray-900 dark:text-white">
            {u?.name || 'System / Batch'}
          </p>
          <p className="text-[11px] font-mono text-gray-500">{u?.email || 'N/A'}</p>
        </div>
      )
    },
    {
      key: 'action',
      label: 'System Action',
      sortable: true,
      render: (val) => (
        <span className="badge badge-purple font-mono text-[11px]">
          {val}
        </span>
      )
    },
    {
      key: 'entity',
      label: 'Target Entity',
      render: (val, row) => (
        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
          {val} {row.entityId ? `(#${row.entityId.slice(0, 8)})` : ''}
        </span>
      )
    },
    {
      key: 'details',
      label: 'Payload & Changes',
      render: (val) => {
        if (!val) return <span className="text-gray-400 text-xs">-</span>;
        return (
          <span className="font-mono text-[11px] text-gray-600 dark:text-gray-300 max-w-sm truncate block" title={val}>
            {val}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Audit & Compliance Ledger"
        subtitle="Immutable ledger recording all administrative, circulation, and placement system transactions"
      />

      {/* Filter Row */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold uppercase text-gray-500">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              onPageChange(1);
            }}
            className="input py-1 px-2.5 h-8 w-auto text-xs"
          >
            <option value="">All Security Events</option>
            <option value="LOGIN">LOGIN</option>
            <option value="ISSUE_BOOK">ISSUE_BOOK</option>
            <option value="RETURN_BOOK">RETURN_BOOK</option>
            <option value="PAY_FINE">PAY_FINE</option>
            <option value="CREATE_USER">CREATE_USER</option>
            <option value="UPDATE_SETTINGS">UPDATE_SETTINGS</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        onSearch={(term) => {
          setSearch(term);
          onPageChange(1);
        }}
        searchPlaceholder="Search audit trails by user or action..."
        pagination={{
          page,
          pageSize,
          total,
          onPageChange,
          onPageSizeChange
        }}
      />
    </div>
  );
}

export default AuditLogs;
