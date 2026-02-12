import api from './api';

export interface CompanySettings {
  empresa_nombre: string;
  empresa_ruc: string;
  empresa_direccion: string;
  empresa_telefono: string;
  empresa_email: string;
  empresa_logo: string;
  recibo_mensaje: string;
}

export const settingsService = {
  getAll: async (): Promise<CompanySettings> => {
    const response = await api.get('/settings');
    return response.data;
  },

  save: async (data: Partial<CompanySettings>): Promise<void> => {
    await api.post('/settings', data);
  },

  uploadLogo: async (file: File): Promise<{ path: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getLogoUrl: (path: string): string => {
    if (!path) return '';
    // If it's already a full URL, return as is
    if (path.startsWith('http')) return path;
    // Otherwise, prepend the API base URL
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}${path}`;
  },
};
