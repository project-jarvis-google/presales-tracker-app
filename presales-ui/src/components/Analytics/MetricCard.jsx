import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

const MetricCard = ({ title, value, icon, color }) => {
  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        borderRadius: 3,
        background: 'white',
        borderTop: `4px solid ${color}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 20px ${color}30`,
        },
      }}
    >
      <Box
        sx={{
          bgcolor: `${color}15`,
          color: color,
          p: 2,
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 64,
          minHeight: 64,
        }}
      >
        {icon}
      </Box>
      <Box flex={1}>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          fontWeight="500" 
          gutterBottom
          sx={{ fontSize: '0.875rem' }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h4" 
          fontWeight="700" 
          sx={{ 
            color: '#202124',
            fontSize: { xs: '1.5rem', sm: '1.75rem' }
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
};

export default MetricCard;