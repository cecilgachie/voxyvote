import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { socketService } from './services/socket';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('voxvote_token');
      if (token) {
        socketService.connect(token);
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  // Simple routing based on URL path
  const path = window.location.pathname;

  const getContent = () => {
    if (!isAuthenticated) {
      if (path === '/register') {
        return <RegisterForm />;
      }
      return <LoginForm />;
    }

    return <Dashboard />;
  };

  return (
    <Layout>
      {getContent()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;