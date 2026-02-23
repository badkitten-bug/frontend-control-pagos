import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services';

vi.mock('../../services', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getUser: vi.fn(),
  },
}));

const mockAuthService = vi.mocked(authService);

// Test component that exposes AuthContext values
function TestConsumer() {
  const { user, isLoading, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.nombre : 'null'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getUser.mockReturnValue(null);
  });

  it('should provide initial state with no user', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('should load stored user on mount', async () => {
    mockAuthService.getUser.mockReturnValue({
      id: 1, email: 'test@test.com', nombre: 'Carlos', apellido: null, rol: 'admin' as const,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('Carlos');
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    spy.mockRestore();
  });
});
