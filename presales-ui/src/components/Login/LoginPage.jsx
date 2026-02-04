import React, { useState } from 'react';
import { Box, Paper, Typography, Alert, CircularProgress, Container } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../../services/api';
import { keyframes } from '@mui/system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloudIcon from '@mui/icons-material/Cloud';

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;

const floatReverse = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(20px) rotate(-5deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const FloatingIcon = ({ icon, delay, animation = float, size = 48, color = '#667eea', ...props }) => (
  <Box
    sx={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: 2,
      background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
      backdropFilter: 'blur(10px)',
      border: `2px solid ${color}40`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: `${animation} 4s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      boxShadow: `0 8px 24px ${color}30`,
      ...props.sx,
    }}
  >
    {React.cloneElement(icon, { 
      sx: { fontSize: size * 0.5, color: color } 
    })}
  </Box>
);

const DataFlowLine = ({ delay }) => (
  <Box
    sx={{
      position: 'absolute',
      width: 2,
      height: 100,
      background: 'linear-gradient(180deg, transparent 0%, #667eea 50%, transparent 100%)',
      animation: `${pulse} 3s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      opacity: 0.3,
    }}
  />
);

const LoginPage = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const response = await authService.googleAuth(credentialResponse.credential);
      console.log('Login successful:', response.data);
      onLogin(response.data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Login failed. Please ensure you have been granted access by an administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In failed. Please try again.');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Large Gradient Orbs */}
        <Box
          sx={{
            position: 'absolute',
            width: '800px',
            height: '800px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
            top: '-300px',
            right: '-200px',
            animation: `${float} 8s ease-in-out infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
            bottom: '-200px',
            left: '-150px',
            animation: `${floatReverse} 10s ease-in-out infinite`,
          }}
        />

        {/* Floating Icons - Distributed Around the Page */}
        <FloatingIcon 
          icon={<CheckCircleIcon />} 
          delay={0} 
          size={56}
          color="#4ade80"
          sx={{ top: '15%', left: '10%' }}
        />
        <FloatingIcon 
          icon={<TrendingUpIcon />} 
          delay={0.5} 
          animation={floatReverse}
          size={64}
          color="#f093fb"
          sx={{ top: '25%', right: '12%' }}
        />
        <FloatingIcon 
          icon={<SpeedIcon />} 
          delay={1} 
          size={52}
          color="#fbbf24"
          sx={{ bottom: '20%', left: '8%' }}
        />
        <FloatingIcon 
          icon={<SecurityIcon />} 
          delay={1.5} 
          animation={floatReverse}
          size={60}
          color="#60a5fa"
          sx={{ bottom: '30%', right: '15%' }}
        />
        <FloatingIcon 
          icon={<BarChartIcon />} 
          delay={2} 
          size={58}
          color="#a78bfa"
          sx={{ top: '40%', left: '5%' }}
        />
        <FloatingIcon 
          icon={<CloudIcon />} 
          delay={2.5} 
          animation={floatReverse}
          size={54}
          color="#34d399"
          sx={{ top: '60%', right: '8%' }}
        />

        {/* Animated Grid Lines */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: `${pulse} 4s ease-in-out infinite`,
          }}
        />

        {/* Rotating Ring */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            animation: `${rotate} 30s linear infinite`,
          }}
        />
      </Box>

      {/* Login Container */}
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, px: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: `${slideIn} 0.8s ease-out`,
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              width: 100,
              height: 100,
              mx: 'auto',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `${float} 3s ease-in-out infinite`,
            }}
          >
            <img 
              src="/falcon.png" 
              alt="Flux Logo" 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(102, 126, 234, 0.4))',
              }} 
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h3"
            fontWeight="700"
            textAlign="center"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              fontSize: { xs: '2rem', sm: '2.5rem' },
            }}
          >
            Welcome to Flux
          </Typography>

          <Typography
            variant="subtitle1"
            textAlign="center"
            sx={{
              color: '#5F6368',
              fontWeight: 500,
              mb: 1,
              fontSize: '1rem',
            }}
          >
            Presales Tracking System
          </Typography>

          {/* Divider */}
          <Box
            sx={{
              width: '60px',
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              mx: 'auto',
              mb: 4,
            }}
          />

          {/* Feature Pills */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 1,
              mb: 3,
            }}
          >
            {[
              { icon: <SpeedIcon />, text: 'Fast' },
              { icon: <SecurityIcon />, text: 'Secure' },
              { icon: <BarChartIcon />, text: 'Analytics' },
            ].map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 2,
                  py: 0.5,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                }}
              >
                {React.cloneElement(item.icon, { sx: { fontSize: 16, color: '#667eea' } })}
                <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600 }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography
            variant="body2"
            textAlign="center"
            sx={{
              color: '#5F6368',
              mb: 4,
              lineHeight: 1.7,
              fontSize: '0.95rem',
            }}
          >
            Sign in with your Google account to access your dashboard.
            <br />
            <Box component="span" sx={{ fontWeight: 600, color: '#667eea' }}>
              Only @google.com accounts
            </Box>
            {' '}with approved access can sign in.
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress 
                sx={{ 
                  color: '#667eea',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} 
              />
            </Box>
          ) : (
            <Box display="flex" justifyContent="center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </Box>
          )}

          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: '1px solid rgba(102, 126, 234, 0.2)',
            }}
          >
            <Typography 
              variant="caption" 
              display="block" 
              textAlign="center" 
              sx={{ 
                color: '#5F6368',
                fontSize: '0.85rem',
              }}
            >
              Need access? Contact your administrator to be added to the system.
            </Typography>
          </Box>
        </Paper>

        {/* Bottom Feature Cards */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            mt: 3,
            flexWrap: 'wrap',
          }}
        >
          {[
            { icon: <TrendingUpIcon />, text: 'Track Progress', color: '#4ade80' },
            { icon: <BarChartIcon />, text: 'View Analytics', color: '#f093fb' },
            { icon: <CheckCircleIcon />, text: 'Close Deals', color: '#fbbf24' },
          ].map((item, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 2,
                animation: `${slideIn} 0.8s ease-out ${0.2 + index * 0.1}s both`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                }
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  background: `${item.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {React.cloneElement(item.icon, { sx: { fontSize: 18, color: item.color } })}
              </Box>
              <Typography variant="body2" fontWeight="600" color="#202124">
                {item.text}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;