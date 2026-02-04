import React from 'react';
import { Box, Button, Typography, Container, Grid, Card, CardContent } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloudIcon from '@mui/icons-material/Cloud';
import { keyframes } from '@mui/system';

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

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

const FeatureCard = ({ icon, title, description, color, delay }) => (
  <Card
    sx={{
      height: '100%',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: `2px solid rgba(255, 255, 255, 0.3)`,
      borderRadius: 3,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: `${slideIn} 0.6s ease-out ${delay}s both`,
      '&:hover': {
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: `0 12px 32px rgba(0, 0, 0, 0.2)`,
        border: `2px solid ${color}`,
        background: 'rgba(255, 255, 255, 1)',
      },
    }}
  >
    <CardContent sx={{ p: 4 }}>
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          boxShadow: `0 4px 12px ${color}60`,
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 32, color: 'white' } })}
      </Box>
      <Typography variant="h6" fontWeight="700" color="#202124" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#5F6368', lineHeight: 1.6 }}>
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const StatCard = ({ value, label, color }) => (
  <Box
    sx={{
      textAlign: 'center',
      p: 3,
      borderRadius: 2,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        border: `2px solid ${color}`,
        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.2)`,
      }
    }}
  >
    <Typography variant="h3" sx={{ color, fontWeight: 800, mb: 1 }}>
      {value}
    </Typography>
    <Typography variant="body2" sx={{ color: '#202124', fontWeight: 500 }}>
      {label}
    </Typography>
  </Box>
);

const WelcomeScreen = ({ onProceed, user, opportunities = [] }) => {
  // Calculate stats from opportunities
  const totalOpportunities = opportunities.length;
  const totalDealValue = opportunities.reduce((sum, opp) => sum + (opp.deal_value_usd || 0), 0);
  const closedWon = opportunities.filter(opp => opp.status === 'Closed Won').length;
  const successRate = totalOpportunities > 0 
    ? Math.round((closedWon / totalOpportunities) * 100) 
    : 0;

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
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

        {/* Floating Icons */}
        <FloatingIcon 
          icon={<TrendingUpIcon />} 
          delay={0} 
          size={56}
          color="#4ade80"
          sx={{ top: '15%', left: '10%' }}
        />
        <FloatingIcon 
          icon={<AssessmentIcon />} 
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

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
        {/* Hero Section */}
        <Box textAlign="center" mb={8}>
          <Box
            sx={{
              width: 120,
              height: 120,
              mx: 'auto',
              mb: 3,
              animation: `${slideIn} 0.8s ease-out, ${float} 3s ease-in-out infinite 0.8s`,
            }}
          >
            <img 
              src="/falcon.png" 
              alt="Flux Logo" 
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 24px rgba(255, 255, 255, 0.5))',
              }} 
            />
          </Box>

          <Typography
            variant="h2"
            fontWeight="800"
            sx={{
              color: 'white',
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              letterSpacing: '-0.02em',
              animation: `${slideIn} 0.8s ease-out 0.2s both`,
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            Welcome, {user?.name?.split(' ')[0]}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 400,
              mb: 4,
              animation: `${slideIn} 0.8s ease-out 0.4s both`,
            }}
          >
            Your command center for presales excellence
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={onProceed}
            startIcon={<RocketLaunchIcon />}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              background: 'white',
              color: '#667eea',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              textTransform: 'none',
              animation: `${slideIn} 0.8s ease-out 0.6s both`,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.95)',
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            Launch Dashboard
          </Button>
        </Box>

        {/* Stats Section */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={4}>
            <StatCard value={totalOpportunities} label="Opportunities" color="#667eea" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard value={formatCurrency(totalDealValue)} label="Pipeline Value" color="#f093fb" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard value={`${successRate}%`} label="Success Rate" color="#4ade80" />
          </Grid>
        </Grid>

        {/* Features Grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard
              icon={<TrendingUpIcon />}
              title="Track Everything"
              description="Monitor your entire presales pipeline with real-time insights and analytics"
              color="#667eea"
              delay={0.8}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard
              icon={<AssessmentIcon />}
              title="Data-Driven Decisions"
              description="Powerful analytics dashboard with interactive charts and reports"
              color="#f093fb"
              delay={1.0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard
              icon={<SpeedIcon />}
              title="Lightning Fast"
              description="Instant updates and blazing-fast performance for your workflow"
              color="#fb923c"
              delay={1.2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard
              icon={<RocketLaunchIcon />}
              title="Scale with Confidence"
              description="Built to grow with your business from startup to enterprise"
              color="#8b5cf6"
              delay={1.4}
            />
          </Grid>
        </Grid>

        {/* Footer CTA */}
        <Box textAlign="center" mt={8}>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2 }}>
            Ready to accelerate your presales process?
          </Typography>
          <Button
            variant="outlined"
            onClick={onProceed}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 2,
              px: 4,
              py: 1.5,
              '&:hover': {
                borderColor: 'white',
                borderWidth: 2,
                background: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Get Started →
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default WelcomeScreen;