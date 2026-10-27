import React from 'react';
import { Printer, BookOpen, CheckCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';

export function FineReceipt({ fine, onClose }) {
  if (!fine) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName = fine.student?.user?.name || 'Student';
  const rollNumber = fine.student?.rollNumber || 'N/A';
  const bookTitle = fine.bookIssue?.bookCopy?.book?.title || 'Library Book';
  const barcode = fine.bookIssue?.bookCopy?.barcode || 'N/A';
  const receiptNo = fine.receiptNumber || `REC-${fine.id?.slice(0, 8).toUpperCase()}`;

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-navy-900 rounded-lg text-gray-900 dark:text-gray-100 max-w-lg mx-auto print:shadow-none print:p-0">
      {/* Receipt Letterhead */}
      <div className="text-center pb-4 border-b-2 border-gray-900 dark:border-white">
        <div className="flex items-center justify-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-black tracking-wide">KIRTI M DOONGURSEE COLLEGE OF ARTS, SCIENCE & COMMERCE</h2>
        </div>
        <p className="text-xs uppercase tracking-wider text-gray-500">Central Library & Learning Resource Center</p>
        <p className="text-[11px] text-gray-400">Official Electronic Cash Receipt for Overdue Fine</p>
      </div>

      {/* Stamp & Receipt Meta */}
      <div className="flex justify-between items-start my-4 text-xs">
        <div>
          <p><span className="text-gray-500">Receipt No:</span> <strong className="font-mono">{receiptNo}</strong></p>
          <p><span className="text-gray-500">Payment Date:</span> <strong>{formatDate(fine.paidAt || new Date())}</strong></p>
        </div>

        <div className="px-3 py-1 border-2 border-green-600 text-green-700 dark:text-green-400 font-black text-sm uppercase tracking-widest rounded rotate-[-6deg] select-none">
          PAID IN FULL
        </div>
      </div>

      {/* Details Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden text-xs my-4 divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-2.5 bg-gray-50 dark:bg-navy-800 flex justify-between">
          <span className="text-gray-500">Student Name:</span>
          <span className="font-bold">{studentName}</span>
        </div>
        <div className="p-2.5 flex justify-between">
          <span className="text-gray-500">Student Roll Number:</span>
          <span className="font-mono font-bold">{rollNumber}</span>
        </div>
        <div className="p-2.5 bg-gray-50 dark:bg-navy-800 flex justify-between">
          <span className="text-gray-500">Book Title:</span>
          <span className="font-medium max-w-[200px] truncate text-right">{bookTitle}</span>
        </div>
        <div className="p-2.5 flex justify-between">
          <span className="text-gray-500">Accession Barcode:</span>
          <span className="font-mono">{barcode}</span>
        </div>
        <div className="p-2.5 bg-gray-50 dark:bg-navy-800 flex justify-between">
          <span className="text-gray-500">Overdue Days:</span>
          <span>{fine.daysOverdue} days</span>
        </div>
        <div className="p-3 flex justify-between text-sm font-extrabold bg-primary-50/50 dark:bg-primary-950/20">
          <span>Total Fine Collected:</span>
          <span className="text-green-600 dark:text-green-400">{formatCurrency(fine.amount)}</span>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center italic mt-2">
        This is a computer-generated transaction acknowledgment. No physical signature is required.
      </p>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-2 print:hidden border-t border-gray-100 dark:border-gray-700 pt-3">
        {onClose && (
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        )}
        <button
          type="button"
          onClick={handlePrint}
          className="btn btn-primary btn-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>
    </div>
  );
}

export default FineReceipt;
