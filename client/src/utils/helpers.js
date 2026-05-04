import { formatDistanceToNow, format, isAfter, parseISO } from 'date-fns';

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
};

export const getAvatarColor = (name = '') => {
  const colors = [
    '#6366f1','#8b5cf6','#ec4899','#ef4444',
    '#f97316','#eab308','#22c55e','#14b8a6',
    '#0ea5e9','#3b82f6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const formatDate = (date) => {
  if (!date) return '—';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy');
  } catch {
    return '—';
  }
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  try {
    return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true });
  } catch {
    return '';
  }
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  try {
    return isAfter(new Date(), typeof dueDate === 'string' ? parseISO(dueDate) : dueDate);
  } catch {
    return false;
  }
};

export const getStatusLabel = (status) => {
  const labels = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'in-review': 'In Review',
    'done': 'Done',
  };
  return labels[status] || status;
};

export const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return labels[priority] || priority;
};

export const getProjectStatusLabel = (status) => {
  const labels = {
    active: 'Active',
    'on-hold': 'On Hold',
    completed: 'Completed',
    archived: 'Archived',
  };
  return labels[status] || status;
};

export const getErrorMessage = (err) => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?.errors?.[0]?.msg) return err.response.data.errors[0].msg;
  return 'Something went wrong. Please try again.';
};

export const truncate = (str, n = 60) => {
  if (!str) return '';
  return str.length > n ? str.substring(0, n) + '…' : str;
};
