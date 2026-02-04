export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '455538062800-d4q7u1r4r8h82qjofeqev4nq5d1hbbe6.apps.googleusercontent.com';

export const VALID_USERS = {
  'admin@flux.com': 'admin123',
  'user@flux.com': 'user123',
  'manager@flux.com': 'manager123'
};

export const STATUS_OPTIONS = [
  'Active',
  'On Hold',
  'Closed Won',
  'Closed Lost',
  'In Progress'
];

export const REGION_OPTIONS = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Middle East'
];