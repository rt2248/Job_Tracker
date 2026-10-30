// Centralized API configuration utility
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();

// Clean API Base URL by removing any trailing slashes
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

/**
 * Builds a full API endpoint URL
 * @param {string} path - API endpoint path (e.g. '/api/auth/login')
 * @returns {string} Clean formatted URL (relative by default, or prefixed with API_BASE_URL if set)
 */
export const getApiUrl = (path) => {
    if (!path) return API_BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
};
