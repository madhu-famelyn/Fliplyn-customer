import React from 'react';
import AdminLayout from './AdminLayout';
import ManagerLayout from './ManagerLayout';
import { useAuth } from '../AuthContex/ContextAPI';

export default function DashboardLayout({ children }) {
  const { role } = useAuth();

  if (role === 'admin') return <AdminLayout>{children}</AdminLayout>;
  if (role === 'manager') return <ManagerLayout>{children}</ManagerLayout>;

  return <>{children}</>; // fallback (for unauthenticated routes)
}
