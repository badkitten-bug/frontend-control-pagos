import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// We test the api module behavior by importing it fresh
// The module uses import.meta.env.VITE_API_URL which defaults to ''

describe('api module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create an axios instance with /api baseURL', async () => {
    // Dynamically import the api module
    const { default: api } = await import('../api');

    expect(api.defaults.baseURL).toContain('/api');
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should add Authorization header when token exists', async () => {
    localStorage.setItem('token', 'my-test-token');

    const { default: api } = await import('../api');

    // Get the request interceptor and simulate a config
    const interceptors = (api.interceptors.request as any).handlers;
    const requestInterceptor = interceptors[0];

    const config = { headers: {} as any };
    const result = requestInterceptor.fulfilled(config);

    expect(result.headers.Authorization).toBe('Bearer my-test-token');
  });

  it('should not add Authorization header when no token', async () => {
    const { default: api } = await import('../api');

    const interceptors = (api.interceptors.request as any).handlers;
    const requestInterceptor = interceptors[0];

    const config = { headers: {} as any };
    const result = requestInterceptor.fulfilled(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should clear storage on 401 response', async () => {
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('user', '{"id":1}');

    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });

    const { default: api } = await import('../api');

    const interceptors = (api.interceptors.response as any).handlers;
    const responseInterceptor = interceptors[0];

    const error = { response: { status: 401 } };

    await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
