import api from './client';

export const loginUser    = (data) => api.post('/auth/user/login', data);
export const loginPartner = (data) => api.post('/auth/partner/login', data);
export const registerUser    = (data) => api.post('/auth/user/register', data);
export const registerPartner = (data) => api.post('/auth/partner/register', data);
export const logout       = ()     => api.post('/auth/logout');
export const verifyEmail  = (data, role = 'user') => api.post(`/auth/${role}/verify-email`, data);
export const forgotPassword = (data, role = 'user') => api.post(`/auth/${role}/forgot-password`, data);
export const resetPassword  = (data, role = 'user') => api.post(`/auth/${role}/reset-password`, data);
export const refresh      = ()     => api.post('/auth/refresh');

