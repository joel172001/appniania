import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <div className="text-white text-xl">Cargando...</div>
        </div>
      </div>
    );
  }

  if (currentRoute === '/admin') {
    return <AdminPanel />;
  }

  if (user) return <Dashboard />;
  if (showAuth) return <AuthForm onBack={() => setShowAuth(false)} />;
  return <LandingPage onGetStarted={() => setShowAuth(true)} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
