import React, { useState, useEffect, useCallback } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Edit,
  UserX,
  Filter,
  CheckCircle,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import usePagination from '../../hooks/usePagination';
import { formatDate } from '../../lib/utils';

const ROLES = [
  'ADMIN',
  'LIBRARIAN',
  'STUDENT',
  'PLACEMENT_OFFICER',
  'COMPANY',
  'ALUMNI'
];

export function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const { page, pageSize, total, setTotal, onPageChange, onPageSizeChange } = usePagination(1, 10);

  // Add/Edit User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Deactivate dialog
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const initialForm = {
    name: '',
    email: '',
    password: 'Password@123',
    role: 'STUDENT',
    // Student specifics
    rollNumber: '',
    branch: 'CSE',
    batch: 2024,
    // Staff specifics
    employeeId: '',
    department: 'Computer Science',
    designation: 'Assistant Professor'
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined
      };
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter, setTotal]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (userItem) => {
    setIsEditing(true);
    setSelectedUser(userItem);
    setFormData({
      name: userItem.name || '',
      email: userItem.email || '',
      password: '',
      role: userItem.role || 'STUDENT',
      rollNumber: userItem.student?.rollNumber || '',
      branch: userItem.student?.branch || 'CSE',
      batch: userItem.student?.batch || 2024,
      employeeId: userItem.staff?.employeeId || '',
      department: userItem.staff?.department || '',
      designation: userItem.staff?.designation || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and institutional email are required');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await api.put(`/admin/users/${selectedUser.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
        toast.success('User updated successfully');
      } else {
        await api.post('/admin/users', formData);
        toast.success('New user account provisioned successfully!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save user account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;
    try {
      await api.put(`/admin/users/${deactivateTarget.id}/deactivate`);
      toast.success(`${deactivateTarget.name}'s account has been deactivated`);
      setDeactivateTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User Name & Email',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-bold text-xs text-gray-900 dark:text-white">{val}</p>
          <p className="text-[11px] font-mono text-gray-500 mt-0.5">{row.email}</p>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Institutional Role',
      sortable: true,
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'details',
      label: 'Profile Identifier',
      render: (_, row) => {
        if (row.student) {
          return <span className="font-mono text-xs">{row.student.rollNumber} ({row.student.branch})</span>;
        }
        if (row.staff) {
          return <span className="text-xs">{row.staff.designation}</span>;
        }
        if (row.companyUser) {
          return <span className="text-xs">{row.companyUser.company?.name || 'Recruiter'}</span>;
        }
        return <span className="text-xs text-gray-400">Standard User</span>;
      }
    },
    {
      key: 'isActive',
      label: 'Account Status',
      render: (val) => (
        <span className={`badge text-[10px] ${val ? 'badge-green' : 'badge-red'}`}>
          {val ? 'ACTIVE' : 'DEACTIVATED'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created On',
      render: (val) => <span className="text-xs text-gray-500">{formatDate(val)}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-navy-700 rounded transition"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
          {row.isActive && (
            <button
              type="button"
              onClick={() => setDeactivateTarget(row)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-navy-700 rounded transition"
              title="Deactivate Account"
            >
              <UserX className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional User Management"
        subtitle="Provision accounts, assign departmental roles, and enforce security policies"
        actions={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary btn-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision User</span>
          </button>
        }
      />

      {/* Filter Row */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold uppercase text-gray-500">Filter by Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              onPageChange(1);
            }}
            className="input py-1 px-2.5 h-8 w-auto text-xs"
          >
            <option value="ALL">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        onSearch={(term) => {
          setSearch(term);
          onPageChange(1);
        }}
        searchPlaceholder="Search by name or institutional email..."
        pagination={{
          page,
          pageSize,
          total,
          onPageChange,
          onPageSizeChange
        }}
      />

      {/* Add / Edit User Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit User Credentials' : 'Create User Account'}
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <FormField label="Full Name" required>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Ramesh Gupta"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </FormField>

          <FormField label="Institutional Email" required>
            <input
              type="email"
              required
              placeholder="e.g. ramesh@erp.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
            />
          </FormField>

          {!isEditing && (
            <FormField label="Initial Password" required hint="Default: Password@123">
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
              />
            </FormField>
          )}

          <FormField label="Institutional Role" required>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </FormField>

          {/* Role-specific fields when creating new user */}
          {!isEditing && formData.role === 'STUDENT' && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-navy-900 rounded-lg">
              <FormField label="Roll No" required>
                <input
                  type="text"
                  placeholder="24CS001"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  className="input"
                />
              </FormField>
              <FormField label="Branch">
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="input"
                >
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="IT">IT</option>
                  <option value="MECH">MECH</option>
                </select>
              </FormField>
              <FormField label="Batch">
                <input
                  type="number"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: parseInt(e.target.value) || 2024 })}
                  className="input"
                />
              </FormField>
            </div>
          )}

          {!isEditing && (formData.role === 'LIBRARIAN' || formData.role === 'PLACEMENT_OFFICER' || formData.role === 'ADMIN') && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-navy-900 rounded-lg">
              <FormField label="Employee ID">
                <input
                  type="text"
                  placeholder="EMP-102"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="input"
                />
              </FormField>
              <FormField label="Designation">
                <input
                  type="text"
                  placeholder="Officer"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="input"
                />
              </FormField>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary text-sm"
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Provision User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivateConfirm}
        title="Confirm Account Deactivation"
        message={`Are you sure you want to deactivate ${deactivateTarget?.name}'s account? The user will immediately be barred from signing in.`}
        confirmText="Deactivate User"
        variant="danger"
      />
    </div>
  );
}

export default Users;
