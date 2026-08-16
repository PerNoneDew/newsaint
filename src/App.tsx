import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { FeedbackProvider } from './context/FeedbackContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/users/UserManagement';
import HealthRecords from './pages/health/HealthRecords';
import HealthForm from './pages/health/HealthForm';
import RequestManagement from './pages/requests/RequestManagement';
import InventoryManagement from './pages/inventory/InventoryManagement';
import Liquidation from './pages/liquidation/Liquidation';
import Notifications from './pages/notifications/Notifications';
import Reports from './pages/reports/Reports';
import AuditTrail from './pages/audit/AuditTrail';
import BackupRecovery from './pages/backup/BackupRecovery';
import { Page } from './types';

function AppContent() {
  const { currentUser, loading: authLoading } = useAuth();
  const { loading: dataLoading, loadError } = useData();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your data…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 max-w-md text-center">
          <p className="font-semibold text-rose-700">Couldn't load your data</p>
          <p className="text-sm text-slate-500 mt-1">{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-xl">Retry</button>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  const isAdmin = currentUser.role === 'admin';
  const isOfficer = currentUser.role === 'health_officer';
  const isAdminOrOfficer = isAdmin || isOfficer;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'users':
        return isAdmin ? <UserManagement /> : <Dashboard onNavigate={setCurrentPage} />;
      case 'health-records':
        return <HealthRecords />;
      case 'health-form':
        return <HealthForm />;
      case 'requests':
        return <RequestManagement />;
      case 'inventory':
        return isAdminOrOfficer ? <InventoryManagement /> : <Dashboard onNavigate={setCurrentPage} />;
      case 'liquidation':
        return isAdminOrOfficer ? <Liquidation /> : <Dashboard onNavigate={setCurrentPage} />;
      case 'notifications':
        return <Notifications />;
      case 'reports':
        return isAdminOrOfficer ? <Reports /> : <Dashboard onNavigate={setCurrentPage} />;
      case 'audit-trail':
        return isAdmin ? <AuditTrail /> : <Dashboard onNavigate={setCurrentPage} />;
      case 'backup-recovery':
        return isAdmin ? <BackupRecovery /> : <Dashboard onNavigate={setCurrentPage} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <FeedbackProvider>
          <AppContent />
        </FeedbackProvider>
      </DataProvider>
    </AuthProvider>
  );
}
