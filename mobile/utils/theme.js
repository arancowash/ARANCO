export const COLORS = {
  primary: '#0f2b46',
  primaryLight: '#1a3d5c',
  primaryAccent: '#c9a96e',
  accent: '#c9a96e',
  accentLight: '#f5efe3',
  secondary: '#6b7b8d',
  success: '#2ecc71',
  successLight: '#eafaf1',
  warning: '#f39c12',
  warningLight: '#fef9e7',
  danger: '#e74c3c',
  dangerLight: '#fdedec',
  info: '#3498db',
  infoLight: '#ebf5fb',
  white: '#ffffff',
  bg: '#f0f2f5',
  card: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#4a5568',
  textLight: '#718096',
  border: '#e2e8f0',
  borderLight: '#edf2f7',
  shadow: 'rgba(15, 43, 70, 0.08)',
  shadowDark: 'rgba(15, 43, 70, 0.15)',
  gradient: ['#0f2b46', '#1a3d5c'],
  gradientAccent: ['#c9a96e', '#d4b896'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 18 },
  small: { fontSize: 12, lineHeight: 16 },
};

export const SHADOWS = {
  small: {
    shadowColor: '#0f2b46',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0f2b46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#0f2b46',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  accent: {
    shadowColor: '#c9a96e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const STATUS_COLORS = {
  CONFIRMED: COLORS.info,
  VEHICLE_RECEIVED: '#e67e22',
  WASHING: '#3498db',
  CLEANING: '#9b59b6',
  READY: COLORS.success,
  COMPLETED: COLORS.success,
  CANCELLED: COLORS.danger,
  NO_SHOW: COLORS.danger,
};

export const getStatusColor = (status) => STATUS_COLORS[status] || COLORS.textSecondary;

export const formatPrice = (price) => `\u20B9${price}`;

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
