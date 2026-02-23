import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsService } from '../settings.service';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch company settings', async () => {
      const settings = { empresa_nombre: 'Mi Empresa', empresa_ruc: '12345678901' };
      mockApi.get.mockResolvedValue({ data: settings });

      const result = await settingsService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/settings');
      expect(result).toEqual(settings);
    });
  });

  describe('save', () => {
    it('should save company settings', async () => {
      const data = { empresa_nombre: 'Updated' };
      mockApi.post.mockResolvedValue({});

      await settingsService.save(data);

      expect(mockApi.post).toHaveBeenCalledWith('/settings', data);
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo file', async () => {
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      mockApi.post.mockResolvedValue({ data: { path: '/uploads/logo.png' } });

      const result = await settingsService.uploadLogo(file);

      expect(mockApi.post).toHaveBeenCalledWith('/settings/logo', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual({ path: '/uploads/logo.png' });
    });
  });

  describe('getLogoUrl', () => {
    it('should return empty string for empty path', () => {
      expect(settingsService.getLogoUrl('')).toBe('');
    });

    it('should return full URL as-is', () => {
      expect(settingsService.getLogoUrl('https://example.com/logo.png')).toBe('https://example.com/logo.png');
    });

    it('should prepend API URL for relative paths', () => {
      const result = settingsService.getLogoUrl('/uploads/logo.png');
      // import.meta.env.VITE_API_URL defaults to '' in test
      expect(result).toContain('/uploads/logo.png');
    });
  });
});
