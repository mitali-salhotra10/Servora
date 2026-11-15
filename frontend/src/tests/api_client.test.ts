import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredToken, setStoredToken, apiClient } from '../api/client';

describe('Frontend API Client & Token Lifecycle', () => {
  beforeEach(() => {
    setStoredToken(null);
    sessionStorage.clear();
  });

  it('stores and retrieves access tokens via memory and sessionStorage', () => {
    expect(getStoredToken()).toBeNull();

    setStoredToken('test-access-token-12345');
    expect(getStoredToken()).toBe('test-access-token-12345');
    expect(sessionStorage.getItem('servora_auth_token')).toBe('test-access-token-12345');

    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
    expect(sessionStorage.getItem('servora_auth_token')).toBeNull();
  });

  it('configures standard timeout and JSON content-type header', () => {
    expect(apiClient.defaults.timeout).toBe(15000);
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('attaches Authorization header when token is stored', async () => {
    setStoredToken('active-jwt-token');

    // Test request interceptor directly
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const config = await interceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer active-jwt-token');
  });

  it('does not attach Authorization header when token is null', async () => {
    setStoredToken(null);

    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const config = await interceptor({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });
});
