import axios from 'axios';

/**
 * Configure global Axios defaults.
 *
 * In production on Vercel:
 *   VITE_API_URL should be set to: https://quicksolutions.onrender.com
 *   (trailing slashes are automatically sanitized).
 *
 * In local development:
 *   If VITE_API_URL is empty or not set, baseURL remains empty,
 *   allowing Vite's local dev proxy in vite.config.ts to forward /api requests.
 */
const rawBaseURL = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = rawBaseURL.replace(/\/+$/, '');

if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}

// Ensure credentials (cookies, sessions) are sent with cross-origin requests
axios.defaults.withCredentials = true;

export default axios;
export { axios as api };
