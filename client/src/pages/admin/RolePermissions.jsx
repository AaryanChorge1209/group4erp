import React from 'react';
import { Shield, Check, X } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

const PERMISSION_MATRIX = [
  { module: 'User & System Administration', permission: 'Manage Users & Permissions', admin: true, librarian: false, student: false, officer: false, company: false, alumni: false },
  { module: 'User & System Administration', permission: 'View Security Audit Logs', admin: true, librarian: false, student: false, officer: false, company: false, alumni: false },
  { module: 'User & System Administration', permission: 'Configure Institution Policies', admin: true, librarian: false, student: false, officer: false, company: false, alumni: false },
  { module: 'Circulation & Library Desk', permission: 'Issue & Check In Books', admin: true, librarian: true, student: false, officer: false, company: false, alumni: false },
  { module: 'Circulation & Library Desk', permission: 'Assess, Collect & Waive Fines', admin: true, librarian: true, student: false, officer: false, company: false, alumni: false },
  { module: 'Circulation & Library Desk', permission: 'Upload & Curate Digital Assets', admin: true, librarian: true, student: false, officer: false, company: false, alumni: false },
  { module: 'Circulation & Library Desk', permission: 'Borrow & Reserve Holdings', admin: true, librarian: true, student: true, officer: true, company: false, alumni: false },
  { module: 'Placement & Corporate Hiring', permission: 'Register & Approve Recruiters', admin: true, librarian: false, student: false, officer: true, company: false, alumni: false },
  { module: 'Placement & Corporate Hiring', permission: 'Schedule Placement Drives', admin: true, librarian: false, student: false, officer: true, company: true, alumni: false },
  { module: 'Placement & Corporate Hiring', permission: 'Advance Candidate Pipeline', admin: true, librarian: false, student: false, officer: true, company: true, alumni: false },
  { module: 'Placement & Corporate Hiring', permission: 'Apply & Track Applications', admin: false, librarian: false, student: true, officer: false, company: false, alumni: false },
  { module: 'Alumni Network & Community', permission: 'Connect for Mentorship', admin: true, librarian: false, student: true, officer: false, company: false, alumni: true },
  { module: 'Alumni Network & Community', permission: 'Donate to Institutional Funds', admin: true, librarian: true, student: true, officer: true, company: true, alumni: true }
];

export function RolePermissions() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Role-Based Access Control (RBAC) Matrix"
        subtitle="Operational security clearance and functional entitlements mapped across enterprise user roles"
      />

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Module / Functional Domain</th>
                <th>Operation Clearance</th>
                <th className="text-center">ADMIN</th>
                <th className="text-center">LIBRARIAN</th>
                <th className="text-center">STUDENT</th>
                <th className="text-center">TPO</th>
                <th className="text-center">COMPANY</th>
                <th className="text-center">ALUMNI</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-xs font-semibold text-gray-900 dark:text-white">
                    {item.module}
                  </td>
                  <td className="text-xs text-gray-700 dark:text-gray-300">
                    {item.permission}
                  </td>
                  <td className="text-center">
                    {item.admin ? (
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="text-center">
                    {item.librarian ? (
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="text-center">
                    {item.student ? (
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="text-center">
                    {item.officer ? (
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="text-center">
                    {item.company ? (
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="text-center">
                    {item.alumni ? (
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RolePermissions;
