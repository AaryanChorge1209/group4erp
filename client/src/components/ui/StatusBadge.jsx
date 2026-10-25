// Status badge mapping
const statusConfig = {
  // Library
  AVAILABLE: { label: 'Available', cls: 'badge-green' },
  ISSUED: { label: 'Issued', cls: 'badge-blue' },
  RESERVED: { label: 'Reserved', cls: 'badge-amber' },
  LOST: { label: 'Lost', cls: 'badge-red' },
  RETURNED: { label: 'Returned', cls: 'badge-gray' },
  OVERDUE: { label: 'Overdue', cls: 'badge-red' },
  // Fines
  PAID: { label: 'Paid', cls: 'badge-green' },
  UNPAID: { label: 'Unpaid', cls: 'badge-red' },
  WAIVED: { label: 'Waived', cls: 'badge-gray' },
  // Reservations
  PENDING: { label: 'Pending', cls: 'badge-amber' },
  NOTIFIED: { label: 'Notified', cls: 'badge-blue' },
  FULFILLED: { label: 'Fulfilled', cls: 'badge-green' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-gray' },
  EXPIRED: { label: 'Expired', cls: 'badge-red' },
  // Companies
  APPROVED: { label: 'Approved', cls: 'badge-green' },
  REJECTED: { label: 'Rejected', cls: 'badge-red' },
  // Drives
  UPCOMING: { label: 'Upcoming', cls: 'badge-blue' },
  ONGOING: { label: 'Ongoing', cls: 'badge-amber' },
  COMPLETED: { label: 'Completed', cls: 'badge-green' },
  // Applications
  APPLIED: { label: 'Applied', cls: 'badge-blue' },
  SHORTLISTED: { label: 'Shortlisted', cls: 'badge-amber' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', cls: 'badge-indigo' },
  SELECTED: { label: 'Selected', cls: 'badge-green' },
  OFFER_ACCEPTED: { label: 'Offer Accepted', cls: 'badge-green' },
  WITHDRAWN: { label: 'Withdrawn', cls: 'badge-gray' },
  // Mentorship
  ACCEPTED: { label: 'Accepted', cls: 'badge-green' },
  DECLINED: { label: 'Declined', cls: 'badge-red' },
  // Users
  ACTIVE: { label: 'Active', cls: 'badge-green' },
  INACTIVE: { label: 'Inactive', cls: 'badge-red' },
  // Campaign
  SCHEDULED: { label: 'Scheduled', cls: 'badge-blue' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, cls: 'badge-gray' };
  return <span className={config.cls}>{config.label}</span>;
}
