import { useState, useCallback } from 'react';
import {
  Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Download, Printer, ChevronsLeft, ChevronsRight
} from 'lucide-react';

function Skeleton({ rows = 5, cols = 5 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="border-b border-gray-100 dark:border-slate-700">
      {Array.from({ length: cols }).map((_, c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded animate-pulse" style={{ width: `${60 + (c * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  ));
}

function EmptyRow({ cols, message = 'No records found' }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-16">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onSearch,
  searchPlaceholder = 'Search...',
  actions,
  onExportCsv,
  onPrint,
  title,
  searchValue,
  pagination,
}) {
  const effectivePage = pagination?.page ?? page;
  const effectivePageSize = pagination?.pageSize ?? pageSize;
  const effectiveTotal = pagination?.total ?? total;
  const effectiveOnPageChange = pagination?.onPageChange ?? onPageChange;
  const effectiveOnPageSizeChange = pagination?.onPageSizeChange ?? onPageSizeChange;

  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (col) => {
    if (!col.sortable) return;
    if (sortCol === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col.key); setSortDir('asc'); }
  };

  const totalPages = Math.max(1, Math.ceil(effectiveTotal / effectivePageSize));

  const sortedData = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    const va = a[sortCol]; const vb = b[sortCol];
    if (va === vb) return 0;
    const cmp = String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const pageNumbers = [];
  const delta = 1;
  for (let i = Math.max(1, effectivePage - delta); i <= Math.min(totalPages, effectivePage + delta); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200 dark:border-slate-700">
        {title && <h3 className="font-semibold text-gray-900 dark:text-white mr-2">{title}</h3>}
        {onSearch && (
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9 h-9 text-sm"
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {actions}
          {onExportCsv && (
            <button onClick={onExportCsv} className="btn-secondary btn-sm gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
          {onPrint && (
            <button onClick={onPrint} className="btn-secondary btn-sm gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          )}
          {effectiveOnPageSizeChange && (
            <select
              className="select h-9 text-sm w-auto px-2 pr-7"
              value={effectivePageSize}
              onChange={e => effectiveOnPageSizeChange(Number(e.target.value))}
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={col.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-800' : ''}
                  style={col.width ? { width: col.width } : {}}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="text-gray-300 dark:text-gray-600">
                        {sortCol === col.key ? (
                          sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary-600" /> : <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
                        ) : (
                          <ChevronUp className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <Skeleton rows={effectivePageSize > 10 ? 10 : effectivePageSize} cols={columns.length} />
            ) : sortedData.length === 0 ? (
              <EmptyRow cols={columns.length} />
            ) : (
              sortedData.map((row, i) => (
                <tr key={row.id || i}>
                  {columns.map(col => (
                    <td key={col.key} className={col.className || ''}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {effectiveOnPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {effectiveTotal > 0 ? `Showing ${Math.min((effectivePage - 1) * effectivePageSize + 1, effectiveTotal)}–${Math.min(effectivePage * effectivePageSize, effectiveTotal)} of ${effectiveTotal}` : 'No records'}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => effectiveOnPageChange(1)} disabled={effectivePage === 1} className="btn-icon btn-ghost btn-sm" title="First">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => effectiveOnPageChange(effectivePage - 1)} disabled={effectivePage === 1} className="btn-icon btn-ghost btn-sm" title="Previous">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {effectivePage > 2 && <span className="px-2 text-gray-400">...</span>}
            {pageNumbers.map(n => (
              <button
                key={n}
                onClick={() => effectiveOnPageChange(n)}
                className={`w-8 h-8 rounded text-sm font-medium ${n === effectivePage ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
              >
                {n}
              </button>
            ))}
            {effectivePage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <button onClick={() => effectiveOnPageChange(effectivePage + 1)} disabled={effectivePage === totalPages} className="btn-icon btn-ghost btn-sm" title="Next">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => effectiveOnPageChange(totalPages)} disabled={effectivePage === totalPages} className="btn-icon btn-ghost btn-sm" title="Last">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
