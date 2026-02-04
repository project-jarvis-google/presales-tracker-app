import React, { useState } from 'react';
import { Box, Grid, Paper, Typography, TextField, MenuItem, Button } from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessIcon from '@mui/icons-material/Business';
import AssessmentIcon from '@mui/icons-material/Assessment';

const AnalyticsDashboard = ({ opportunities }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const allStatuses = [...new Set(opportunities.map((o) => o.status).filter(Boolean))];
  const allRegions = [...new Set(opportunities.map((o) => o.region).filter(Boolean))];

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesStatus = !statusFilter || opp.status === statusFilter;
    const matchesRegion = !regionFilter || opp.region === regionFilter;
    return matchesStatus && matchesRegion;
  });

  const totalDealValue = filteredOpportunities.reduce(
    (sum, o) => sum + (o.deal_value_usd || 0),
    0
  );
  const activeOpportunities = filteredOpportunities.filter(
    (o) => o.status === 'Active'
  ).length;
  const avgDealValue = filteredOpportunities.length > 0 
    ? totalDealValue / filteredOpportunities.length 
    : 0;

  // Monthly trend data
  const monthlyData = filteredOpportunities.reduce((acc, opp) => {
    const date = opp.presales_start_date || opp.expected_planned_start || new Date().toISOString();
    const month = new Date(date).toLocaleDateString('en-US', { month: 'short' });
    
    if (!acc[month]) {
      acc[month] = { month, count: 0, value: 0 };
    }
    acc[month].count += 1;
    acc[month].value += opp.deal_value_usd || 0;
    return acc;
  }, {});

  const trendData = Object.values(monthlyData).slice(0, 7);

  // Region data
  const regionData = filteredOpportunities.reduce((acc, opp) => {
    const region = opp.region || 'Unknown';
    if (!acc[region]) {
      acc[region] = { name: region, count: 0, value: 0 };
    }
    acc[region].count += 1;
    acc[region].value += opp.deal_value_usd || 0;
    return acc;
  }, {});

  const regionChartData = Object.values(regionData);

  // Status data
  const statusData = filteredOpportunities.reduce((acc, opp) => {
    const status = opp.status || 'Unknown';
    if (!acc[status]) {
      acc[status] = { name: status, value: 0 };
    }
    acc[status].value += 1;
    return acc;
  }, {});

  const statusChartData = Object.values(statusData);

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" fontWeight="600" mb={0.5} color="#1e293b">{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 
                ? formatCurrency(entry.value) 
                : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Metric Card Component
  const MetricCard = ({ title, value, icon, color }) => (
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
        transition: 'all 0.2s ease',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box
        sx={{
          bgcolor: `${color}15`,
          color: color,
          p: 2,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 60,
          minHeight: 60,
        }}
      >
        {icon}
      </Box>
      <Box flex={1}>
        <Typography 
          variant="body2" 
          color="#64748b" 
          fontWeight="500" 
          gutterBottom
          sx={{ fontSize: '0.875rem' }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h4" 
          fontWeight="600" 
          sx={{ 
            color: '#1e293b',
            fontSize: { xs: '1.5rem', sm: '1.75rem' }
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );

  // Progress Ring Component
  const ProgressRing = ({ percentage, label, color }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <svg width="160" height="160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="12"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            style={{
              transition: 'stroke-dashoffset 0.5s ease',
            }}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h3" fontWeight="600" color={color}>
            {percentage}%
          </Typography>
          <Typography variant="caption" color="#64748b" fontWeight="500">
            {label}
          </Typography>
        </Box>
      </Box>
    );
  };

  const completionPercentage = filteredOpportunities.length > 0
    ? Math.round((activeOpportunities / filteredOpportunities.length) * 100)
    : 0;

  return (
    <Box>
      {/* Filters */}
      <Paper 
        sx={{ 
          p: 2.5, 
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          background: 'white',
        }}
      >
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Typography variant="h6" fontWeight="600" sx={{ mr: 2, color: '#1e293b' }}>
            Filter Analytics
          </Typography>
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {allStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Regions</MenuItem>
            {allRegions.map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </TextField>
          {(statusFilter || regionFilter) && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setStatusFilter('');
                setRegionFilter('');
              }}
              sx={{ ml: 'auto', color: '#64748b', borderColor: '#e2e8f0' }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Top Row - Metric Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Opportunities"
            value={filteredOpportunities.length}
            icon={<BusinessIcon sx={{ fontSize: 28 }} />}
            color="#4285F4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Deal Value"
            value={formatCurrency(totalDealValue)}
            icon={<AttachMoneyIcon sx={{ fontSize: 28 }} />}
            color="#34A853"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Opportunities"
            value={activeOpportunities}
            icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
            color="#FBBC04"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Deal Value"
            value={formatCurrency(avgDealValue)}
            icon={<AssessmentIcon sx={{ fontSize: 28 }} />}
            color="#EA4335"
          />
        </Grid>
      </Grid>

      {/* Main Charts Section */}
      <Grid container spacing={3}>
        {/* Wave Chart - Deal Trends */}
        <Grid item xs={12} lg={8}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="600" color="#1e293b" mb={3}>
              Deal Value Trends
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4285F4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4285F4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34A853" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#34A853" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4285F4" 
                  strokeWidth={2}
                  fill="url(#colorValue)" 
                  name="Deal Value"
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#34A853" 
                  strokeWidth={2}
                  fill="url(#colorCount)" 
                  name="Count"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Progress Ring */}
        <Grid item xs={12} lg={4}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="600" color="#1e293b" mb={2}>
              Active Rate
            </Typography>
            <ProgressRing 
              percentage={completionPercentage} 
              label="Active"
              color="#4285F4"
            />
            <Typography variant="body2" color="#64748b" mt={2} textAlign="center">
              {activeOpportunities} out of {filteredOpportunities.length} opportunities are active
            </Typography>
          </Paper>
        </Grid>

        {/* Region Bar Chart */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="600" color="#1e293b" mb={3}>
              Regional Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={regionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#34A853" 
                  name="Opportunities" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Status Breakdown */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="600" color="#1e293b" mb={3}>
              Status Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#64748b" 
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="#FBBC04" 
                  name="Count" 
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;