import axios from 'axios';
const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '') + '/api', timeout: 30000 });
api.interceptors.request.use((c) => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = 'Bearer ' + t; return c; });
export const err = (e) => e?.response?.data?.message || (e?.code === 'ECONNABORTED' ? 'Server is waking up, please try again in a few seconds' : e?.message) || 'Something went wrong';
export default api;
