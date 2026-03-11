import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth.service';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should post credentials and store token/user', async () => {
      const mockResponse = {
        data: {
          accessToken: 'test-token',
          user: { id: 1, email: 'test@test.com', nombre: 'Test', apellido: null, rol: 'admin' as const },
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@test.com', 'password123');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
      });
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.data.user));
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('register', () => {
    it('should post registration data and return message', async () => {
      const mockResponse = {
        data: {
          message: 'Cuenta creada exitosamente. Su cuenta está pendiente de aprobación por un administrador.',
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await authService.register('new@test.com', 'pass', 'New', 'User');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
        email: 'new@test.com',
        password: 'pass',
        nombre: 'New',
        apellido: 'User',
      });
      expect(localStorage.getItem('token')).toBeNull();
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    it('should clear localStorage and redirect', () => {
      localStorage.setItem('token', 'some-token');
      localStorage.setItem('user', '{}');

      authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should fetch the current user profile', async () => {
      const mockUser = { id: 1, email: 'test@test.com', nombre: 'Test' };
      mockApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getProfile();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', 'test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getUser', () => {
    it('should return parsed user from localStorage', () => {
      const user = { id: 1, nombre: 'Test' };
      localStorage.setItem('user', JSON.stringify(user));
      expect(authService.getUser()).toEqual(user);
    });

    it('should return null when no user stored', () => {
      expect(authService.getUser()).toBeNull();
    });
  });
});
