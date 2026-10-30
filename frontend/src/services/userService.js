import api from '../utils/api';

export const userService = {
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  getVendors: async (params = {}) => {
    const response = await api.get('/users/vendors', { params });
    return response.data;
  },

  getVendorProfile: async (vendorId) => {
    const response = await api.get(`/users/vendors/${vendorId}`);
    return response.data;
  },
};
