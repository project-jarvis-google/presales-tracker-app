// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://presales-backend-455538062800.us-central1.run.app';

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '455538062800-d4q7u1r4r8h82qjofeqev4nq5d1hbbe6.apps.googleusercontent.com';

// Status Options with colors
export const STATUS_OPTIONS = [
  { value: 'Not Assigned', label: 'Not Assigned', color: '#9E9E9E' },
  { value: 'In Progress', label: 'In Progress', color: '#FFC107' },
  { value: 'Sent for Signature', label: 'Sent for Signature', color: '#2196F3' },
  { value: 'Lost', label: 'Lost', color: '#F44336' },
  { value: 'Won', label: 'Won', color: '#4CAF50' },
  { value: 'Not Required', label: 'Not Required', color: '#9C27B0' },
  { value: 'Proposal Under Review', label: 'Proposal Under Review', color: '#FFB6C1' },
  { value: 'Staffing in Progress', label: 'Staffing in Progress', color: '#8B7BB8' },
];

// Charging on Vector Options with colors
export const CHARGING_OPTIONS = [
  { value: 'Not Yet', label: 'Not Yet', color: '#9E9E9E' },
  { value: 'Allocated', label: 'Allocated', color: '#4CAF50' },
  { value: 'In Progress', label: 'In Progress', color: '#FFC107' },
  { value: 'Not Allocated', label: 'Not Allocated', color: '#F44336' },
];

// Helper function to get status color
export const getStatusColor = (status) => {
  const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
  return statusOption ? statusOption.color : '#94a3b8';
};

// Helper function to get charging color
export const getChargingColor = (charging) => {
  const chargingOption = CHARGING_OPTIONS.find(opt => opt.value === charging);
  return chargingOption ? chargingOption.color : '#94a3b8';
};

// Region Options
export const REGION_OPTIONS = [
  'NORTHAM',
  'EMEA',
  'JAPAC',
];

export const SUB_REGION_OPTIONS = [
  'SEA',
  'US FS',
  'US SOUTH',
  'Canada',
  'India',
  'US North',
  'Japan',
];

// Role Options
export const ROLE_OPTIONS = [
  { value: 'presales_viewer', label: 'Presales Viewer' },
  { value: 'presales_creator', label: 'Presales Creator' },
  { value: 'presales_admin', label: 'Presales Admin' },
];

// Role Permissions
export const ROLE_PERMISSIONS = {
  presales_admin: ['view', 'create', 'edit', 'delete', 'manage_users'],
  presales_creator: ['view', 'create', 'edit'],
  presales_viewer: ['view'],
};

// Get role display name
export const getRoleLabel = (role) => {
  const labels = {
    presales_admin: 'Admin',
    presales_creator: 'Creator',
    presales_viewer: 'Viewer',
  };
  return labels[role] || role;
};

// Get role color
export const getRoleColor = (role) => {
  const colors = {
    presales_admin: '#EA4335',
    presales_creator: '#34A853',
    presales_viewer: '#4285F4',
  };
  return colors[role] || '#5F6368';
};