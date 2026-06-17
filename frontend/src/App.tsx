import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './modules/auth/Login';
import { AdminDashboard } from './modules/admin/AdminDashboard';
import { HodDashboard } from './modules/hod/HodDashboard';
import { CoordinatorDashboard } from './modules/coordinator/CoordinatorDashboard';
import { FacultyDashboard } from './modules/faculty/FacultyDashboard';

export const App: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { clearTransientState } = useUIStore();
  const [activeTab, setActiveTabRaw] = useState('dashboard');

  // Wrap tab setter — always clear transient UI state on every navigation
  const setActiveTab = useCallback((tab: string) => {
    clearTransientState();
    setActiveTabRaw(tab);
  }, [clearTransientState]);

  // Reset to dashboard on user change (login/logout)
  useEffect(() => {
    setActiveTab('dashboard');
  }, [user]);

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>

      {/* 1. ADMIN MODULE */}
      {user.role === 'Admin' && (
        <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* 2. HOD MODULE */}
      {user.role === 'HOD' && (
        <HodDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* 3. COURSE COORDINATOR MODULE */}
      {user.role === 'Coordinator' && (
        <CoordinatorDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* 4. FACULTY MODULE */}
      {user.role === 'Faculty' && (
        <FacultyDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

    </DashboardLayout>
  );
};

export default App;
