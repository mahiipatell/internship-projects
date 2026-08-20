import React from 'react';

const COLOR_MAP = {
  available: 'bg-green-100 text-green-700',
  occupied: 'bg-red-100 text-red-700',
  reserved: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  served: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }) {
  const classes = COLOR_MAP[status] || 'bg-gray-100 text-gray-600';
  return <span className={`badge ${classes}`}>{status}</span>;
}
