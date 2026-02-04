import React, { useState, useEffect, useCallback } from 'react';
import { Snackbar, Alert, CircularProgress, Box } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './components/Login/LoginPage';
import WelcomeScreen from './components/Layout/WelcomeScreen';
import MainLayout from './components/Layout/MainLayout';
import OpportunitiesTable from './components/Opportunities/OpportunitiesTable';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import PeopleManagement from './components/People/PeopleManagement';
import { opportunityService } from './services/api';
import { GOOGLE_CLIENT_ID } from './utils/constants';

function App() {
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('📦 Loaded user from session:', parsedUser);
        setUser(parsedUser);
        setShowWelcome(true);
      } catch (error) {
        console.error('❌ Error parsing saved user:', error);
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await opportunityService.getAll();
      setOpportunities(response.data.data || []);
    } catch (error) {
      showSnackbar('Failed to load opportunities: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadOpportunities();
    }
  }, [user, loadOpportunities]);

  const handleLogin = (userData) => {
    console.log('🔐 Login handler received:', userData);
    
    const cleanUserData = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      isAuthenticated: true,
    };
    
    console.log('💾 Storing user data:', cleanUserData);
    
    setUser(cleanUserData);
    sessionStorage.setItem('user', JSON.stringify(cleanUserData));
    setShowWelcome(true);
  };

  const handleProceedFromWelcome = () => {
    setShowWelcome(false);
  };

  const handleBackToWelcome = () => {
    setShowWelcome(true);
  };

  const handleLogout = () => {
    console.log('👋 Logging out user');
    setUser(null);
    sessionStorage.removeItem('user');
    setShowWelcome(false);
  };

  const handleAddOpportunity = async (data) => {
    // Check permission - creators and admins can add
    if (user.role === 'presales_viewer') {
      showSnackbar('Viewers cannot add opportunities', 'error');
      return;
    }

    try {
      await opportunityService.create(data);
      await loadOpportunities();
      showSnackbar('Opportunity created successfully');
    } catch (error) {
      showSnackbar(error.message || 'Failed to create opportunity', 'error');
    }
  };

  const handleEditOpportunity = async (id, data) => {
    // Admin and creators can edit
    if (user.role === 'presales_viewer') {
      showSnackbar('Viewers cannot edit opportunities', 'error');
      return;
    }

    if (user.role !== 'presales_admin' && user.role !== 'presales_creator') {
      showSnackbar('You do not have permission to edit opportunities', 'error');
      return;
    }

    try {
      await opportunityService.update(id, data);
      await loadOpportunities();
      showSnackbar('Opportunity updated successfully');
    } catch (error) {
      showSnackbar(error.message || 'Failed to update opportunity', 'error');
    }
  };

  const handleDeleteOpportunity = async (id) => {
    // Only admin can delete
    if (user.role !== 'presales_admin') {
      showSnackbar('Only admins can delete opportunities', 'error');
      return;
    }

    try {
      await opportunityService.delete(id);
      await loadOpportunities();
      showSnackbar('Opportunity deleted successfully');
    } catch (error) {
      showSnackbar(error.message || 'Failed to delete opportunity', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Show login page
  if (!user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <LoginPage onLogin={handleLogin} />
      </GoogleOAuthProvider>
    );
  }

  // Show welcome screen
  if (showWelcome) {
    return (
      <WelcomeScreen 
        onProceed={handleProceedFromWelcome}
        user={user}
        opportunities={opportunities}
      />
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <MainLayout user={user} onLogout={handleLogout} onBackToWelcome={handleBackToWelcome}>
        {(currentTab) => {
          if (loading) {
            return (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="400px"
              >
                <CircularProgress 
                  sx={{ 
                    color: '#667eea',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    }
                  }} 
                />
              </Box>
            );
          }

          // Tab 0: Opportunities
          if (currentTab === 0) {
            return (
              <OpportunitiesTable
                opportunities={opportunities}
                onAdd={handleAddOpportunity}
                onEdit={handleEditOpportunity}
                onDelete={handleDeleteOpportunity}
                userRole={user.role}
              />
            );
          }

          // Tab 1: Analytics
          if (currentTab === 1) {
            return <AnalyticsDashboard opportunities={opportunities} />;
          }

          // Tab 2: People Management (only for admins)
          if (currentTab === 2 && user.role === 'presales_admin') {
            return <PeopleManagement user={user} />;
          }

          return null;
        }}
      </MainLayout>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </GoogleOAuthProvider>
  );
}

export default App;