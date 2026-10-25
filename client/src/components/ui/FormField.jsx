import React from 'react';
import { cn } from '../../lib/utils';

export function FormField({
  label,
  error,
  hint,
  required = false,
  className = '',
  children
}) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}

export default FormField;
