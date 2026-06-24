import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './modules/auth/Login';
import { AdminDashboard } from './modules/admin/AdminDashboard';
import { HodDashboard } from './modules/hod/HodDashboard';
import { CoordinatorDashboard } from './modules/coordinator/CoordinatorDashboard';
import { FacultyDashboard } from './modules/faculty/FacultyDashboard';
import { NotificationCenter } from './components/NotificationCenter';

export const App: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { clearTransientState } = useUIStore();
  const [activeTab, setActiveTabRaw] = useState(() => {
    return window.location.hash.replace('#', '') || 'dashboard';
  });

  // Wrap tab setter — clear transient UI state and update URL hash
  const setActiveTab = useCallback((tab: string) => {
    clearTransientState();
    if (window.location.hash !== `#${tab}`) {
      window.history.pushState(null, '', `#${tab}`);
    }
    setActiveTabRaw(tab);
  }, [clearTransientState]);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const hashTab = window.location.hash.replace('#', '');
      clearTransientState();
      setActiveTabRaw(hashTab || 'dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [clearTransientState]);

  // Initialize or reset on user change (login/logout)
  useEffect(() => {
    if (user) {
      const hashTab = window.location.hash.replace('#', '');
      setActiveTab(hashTab || 'dashboard');
    }
  }, [user, setActiveTab]);

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

      {/* 5. NOTIFICATIONS MODULE */}
      {activeTab === 'notifications' && (
        <NotificationCenter />
      )}

    </DashboardLayout>
  );
};

export default App;
