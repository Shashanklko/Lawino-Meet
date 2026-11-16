/**
 * LawinoMeet Domain & Microservice Topology Configuration
 * Supports independent deployment of Client Portal vs Platform Admin Console across separate domains/subdomains.
 */

export const DOMAIN_CONFIG = {
  // Public client-facing website URL
  CLIENT_PORTAL_URL: import.meta.env.VITE_CLIENT_URL || window.location.origin,
  
  // Standalone Platform Admin Console URL (separate domain, e.g. https://admin.lawinomeet.com or port 5174 in dev)
  ADMIN_PORTAL_URL: import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174',

  // Microservices API Gateway or Direct Service Roots
  API_GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL || '',
  
  // Environment identifier ('development' | 'production' | 'staging')
  ENVIRONMENT: import.meta.env.MODE || 'development',
};

export const getClientPortalUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${DOMAIN_CONFIG.CLIENT_PORTAL_URL}${cleanPath}`;
};

export const getAdminPortalUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${DOMAIN_CONFIG.ADMIN_PORTAL_URL}${cleanPath}`;
};
