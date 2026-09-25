// Centralized API configuration utility
const rawApiUrl = import.meta.env.VITE_API_URL || '';

// Clean API Base URL by removing any trailing slashes
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

/**
 * Builds a full API endpoint URL
 * @param {string} path - API endpoint path (e.g. '/api/auth/login')
 * @returns {string} Clean formatted URL
 */
export const getApiUrl = (path) => {
    if (!path) return API_BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
};
