import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Snackbar, Alert, CircularProgress, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './components/Login/LoginPage';
import WelcomeScreen from './components/Layout/WelcomeScreen';
import MainLayout from './components/Layout/MainLayout';
import OpportunitiesTable from './components/Opportunities/OpportunitiesTable';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import PeopleManagement from './components/People/PeopleManagement';
import { opportunityService, authService } from './services/api';
import { GOOGLE_CLIENT_ID } from './utils/constants';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const SESSION_CHECK_INTERVAL = 1000; // Check every second

function App() {
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [showIdleDialog, setShowIdleDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef(null);
  const sessionCheckRef = useRef(null);

  // Track user activity
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  // Check for idle timeout
  const checkIdleTimeout = useCallback(() => {
    if (!user) return;

    const now = Date.now();
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || lastActivityRef.current.toString());
    const timeSinceActivity = now - lastActivity;

    if (timeSinceActivity >= IDLE_TIMEOUT) {
      setShowIdleDialog(true);
      handleLogout(true);
    }
  }, [user]);

  // Set up activity tracking
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Start checking for idle timeout
    sessionCheckRef.current = setInterval(checkIdleTimeout, SESSION_CHECK_INTERVAL);
    
    // Initialize last activity
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, [user, updateActivity, checkIdleTimeout]);

  // Check for existing session across tabs - WITH JWT VERIFICATION
  useEffect(() => {
    const checkExistingSession = async () => {
      const token = localStorage.getItem('flux_token');
      const savedUser = localStorage.getItem('flux_user'); // Changed from sessionStorage to localStorage
      const lastActivity = localStorage.getItem('lastActivity');
      
      console.log('🔍 Checking for existing session...');
      console.log('  - Token exists:', !!token);
      console.log('  - User data exists:', !!savedUser);
      console.log('  - Last activity:', lastActivity);
      
      if (token && savedUser && lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        
        if (timeSinceActivity < IDLE_TIMEOUT) {
          try {
            // Verify the token is still valid with the backend
            console.log('🔐 Verifying JWT token with backend...');
            const verifyResponse = await authService.verifyToken();
            
            if (verifyResponse.data.valid) {
              const parsedUser = JSON.parse(savedUser);
              console.log('✅ Token valid - Loading user session:', parsedUser);
              setUser(parsedUser);
              setShowWelcome(true);
              updateActivity();
            } else {
              console.log('❌ Token invalid - Clearing session');
              authService.logout();
            }
          } catch (error) {
            console.error('❌ Token verification failed:', error.message);
            authService.logout();
          }
        } else {
          // Session expired due to inactivity
          console.log('⏰ Session expired due to inactivity');
          authService.logout();
        }
      } else {
        console.log('ℹ️ No existing session found');
      }
      
      setLoading(false);
    };

    checkExistingSession();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'logout-event') {
        // Another tab logged out
        console.log('🔄 Logout detected from another tab');
        handleLogout(false);
      } else if (e.key === 'lastActivity') {
        // Update activity from another tab
        lastActivityRef.current = parseInt(e.newValue || Date.now().toString());
      } else if (e.key === 'flux_user' && e.newValue && !user) {
        // User logged in from another tab
        console.log('🔄 Login detected from another tab');
        try {
          const parsedUser = JSON.parse(e.newValue);
          setUser(parsedUser);
          setShowWelcome(true);
        } catch (err) {
          console.error('Failed to parse user data from storage:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
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
    
    console.log('💾 User data stored in localStorage (JWT token already stored by api.js)');
    
    setUser(cleanUserData);
    localStorage.setItem('flux_user', JSON.stringify(cleanUserData)); // Changed from sessionStorage to localStorage
    updateActivity();
    setShowWelcome(true);
    setLoading(false);
  };

  const handleProceedFromWelcome = () => {
    setShowWelcome(false);
  };

  const handleBackToWelcome = () => {
    setShowWelcome(true);
  };

  const handleLogout = (isIdle = false) => {
    console.log('👋 Logging out user' + (isIdle ? ' (idle timeout)' : ''));
    
    // Use authService logout to clear everything including JWT token
    authService.logout();
    
    setUser(null);
    setShowWelcome(false);
    
    if (sessionCheckRef.current) {
      clearInterval(sessionCheckRef.current);
    }
  };

  const handleCloseIdleDialog = () => {
    setShowIdleDialog(false);
  };

  const handleAddOpportunity = async (data) => {
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

  // Show loading spinner while checking session
  if (loading && !user) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Box textAlign="center">
          <CircularProgress 
            size={60}
            sx={{ 
              color: 'white',
              mb: 2,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }} 
          />
          <Typography variant="h6" color="white" fontWeight={500}>
            Loading Flux...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show login page
  if (!user) {
    return (
      <>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <LoginPage onLogin={handleLogin} />
        </GoogleOAuthProvider>

        {/* Idle Timeout Dialog */}
        <Dialog open={showIdleDialog} onClose={handleCloseIdleDialog}>
          <DialogTitle sx={{ color: '#ef4444', fontWeight: 600 }}>
            Session Expired
          </DialogTitle>
          <DialogContent>
            <Typography>
              You have been logged out due to 10 minutes of inactivity. 
              Please log in again to continue.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseIdleDialog}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                }
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </>
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
      <MainLayout user={user} onLogout={() => handleLogout(false)} onBackToWelcome={handleBackToWelcome}>
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