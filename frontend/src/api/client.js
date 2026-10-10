import axios from 'axios';

const defaultApiUrl =
    typeof window !== 'undefined' && window.location.port !== '5173'
        ? window.location.origin
        : 'http://localhost:5001';
const rawApiUrl = import.meta.env.VITE_API_URL || defaultApiUrl;
const baseURL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const client = axios.create({
    baseURL,
    withCredentials: true // send cookies
});

// Intercept responses to provide operator-friendly error messages (Part 14)
client.interceptors.response.use(
    response => response,
    error => {
        let friendlyMessage = 'An unexpected system error occurred. Please retry.';
        if (!error.response) {
            if (error.code === 'ECONNABORTED') {
                friendlyMessage = 'Station communication timed out. Retrying link...';
            } else {
                friendlyMessage = 'Communication with polar station server is unavailable.';
            }
        } else {
            const status = error.response.status;
            if (status === 401) {
                friendlyMessage = 'Authentication session expired. Please log in again.';
            } else if (status === 403) {
                friendlyMessage = 'Access restricted to authorized Antarctic station personnel.';
            } else if (status === 404) {
                friendlyMessage = 'Requested station asset or operational record was not found.';
            } else if (status === 502 || status === 503) {
                friendlyMessage = 'ML intelligence service is offline.';
            } else if (status >= 500) {
                friendlyMessage = 'Station intelligence temporarily unavailable.';
            } else if (error.response.data?.message) {
                const msg = String(error.response.data.message);
                if (msg.includes('ECONNREFUSED') || msg.includes('127.0.0.1')) {
                    friendlyMessage = 'ML intelligence service is offline.';
                } else if (msg.toLowerCase().includes('mongo') || msg.includes('connection')) {
                    friendlyMessage = 'Station database telemetry repository temporarily unreachable.';
                } else {
                    friendlyMessage = msg;
                }
            }
        }
        error.userMessage = friendlyMessage;
        return Promise.reject(error);
    }
);

export default client;
