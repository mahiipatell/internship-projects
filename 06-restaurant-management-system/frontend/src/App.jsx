import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Menu from './pages/menu/Menu';
import Categories from './pages/categories/Categories';
import Tables from './pages/tables/Tables';
import Orders from './pages/orders/Orders';
import Billing from './pages/billing/Billing';
import SalesHistory from './pages/sales/SalesHistory';
import Reports from './pages/reports/Reports';
import Users from './pages/users/Users';
import Profile from './pages/profile/Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/menu"
          element={
            <ProtectedRoute roles={['admin', 'waiter']}>
              <Menu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute roles={['admin']}>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoute roles={['admin', 'waiter']}>
              <Tables />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute roles={['admin', 'waiter', 'cashier']}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute roles={['admin', 'cashier']}>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-history"
          element={
            <ProtectedRoute roles={['admin', 'cashier']}>
              <SalesHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
