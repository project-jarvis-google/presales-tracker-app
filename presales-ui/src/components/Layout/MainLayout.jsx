import React, { useState } from 'react';
import { Box, Container, Tabs, Tab, Paper, IconButton } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TableChartIcon from '@mui/icons-material/TableChart';
import PeopleIcon from '@mui/icons-material/People';
import HomeIcon from '@mui/icons-material/Home';
import Header from './Header';

const MainLayout = ({ user, onLogout, onBackToWelcome, children }) => {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        background: '#F8F9FA',
      }}
    >
      <Header user={user} onLogout={onLogout} />

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Paper 
          sx={{ 
            mb: 3,
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
          }}
        >
          {/* Home Button - Positioned Absolutely */}
          <IconButton
            onClick={onBackToWelcome}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              width: 40,
              height: 40,
              zIndex: 2,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-50%) scale(1.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }
            }}
          >
            <HomeIcon />
          </IconButton>

          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{
              pl: 8,
              '& .MuiTab-root': {
                py: 2.5,
                px: 4,
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.2s ease',
                minHeight: 64,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 3,
                  background: 'white',
                  transition: 'width 0.3s ease',
                  borderRadius: '3px 3px 0 0',
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                },
                '&.Mui-selected': {
                  color: 'white',
                  fontWeight: 600,
                  '&::before': {
                    width: '80%',
                  }
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            <Tab 
              icon={<TableChartIcon />} 
              iconPosition="start" 
              label="Opportunities" 
            />
            <Tab 
              icon={<AssessmentIcon />} 
              iconPosition="start" 
              label="Analytics" 
            />
            {user.role === 'presales_admin' && (
              <Tab 
                icon={<PeopleIcon />} 
                iconPosition="start" 
                label="People" 
              />
            )}
          </Tabs>
        </Paper>

        <Box>{children(currentTab)}</Box>
      </Container>
    </Box>
  );
};

export default MainLayout;