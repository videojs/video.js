// @vitest-environment node

import type { APIContext } from 'astro';
import { getActionContext } from 'astro:actions';
import { jwtVerify } from 'jose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { onRequest } from '@/middleware/index';
import { refreshToken, seal, unseal } from '@/utils/auth';

type AstroActionContext = ReturnType<typeof getActionContext>;

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

vi.mock('astro:actions', () => ({
  getActionContext: vi.fn(),
}));

vi.mock('@/utils/auth', () => ({
  refreshToken: vi.fn(),
  exchangeAuthorizationCode: vi.fn(),
  seal: vi.fn(),
  unseal: vi.fn(),
  SESSION_COOKIE_NAME: 'session',
  INACTIVITY_EXPIRY: 300,
  getJWKS: vi.fn(() => 'https://auth.example.com'),
}));

const mockOAuthResponse = {
  access_token: 'valid-access-token',
  refresh_token: 'valid-refresh-token',
  id_token: 'valid-id-token',
  token_type: 'bearer' as const,
  expires_in: 3600,
};

const mockUserPayload = {
  sub: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  email_verified: true,
};

function createMockContext(sessionCookie?: string): APIContext {
  return {
    request: new Request('https://example.com/'),
    cookies: {
      get: vi.fn((name: string) => {
        if (name === 'session' && sessionCookie) {
          return { value: sessionCookie };
        }

        return undefined;
      }),
      set: vi.fn(),
      delete: vi.fn(),
    },
    locals: {},
    redirect: vi.fn(),
  } as unknown as APIContext;
}

const next = vi.fn().mockResolvedValue(new Response('OK'));

describe('onRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PROD', false);

    vi.mocked(getActionContext).mockReturnValue({ action: undefined } as AstroActionContext);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('unauthenticated requests', () => {
    it('should pass through when no session cookie exists', async () => {
      const context = createMockContext();

      await onRequest(context, next);

      expect(next).toHaveBeenCalled();
      expect(context.locals.user).toBeUndefined();
      expect(context.locals.accessToken).toBeUndefined();
    });

    it('should fail when no session cookie exists and attempted to access gated endpoint', async () => {
      const context = createMockContext();

      vi.mocked(getActionContext).mockReturnValue({ action: { name: 'mux.list' } } as AstroActionContext);

      const response = (await onRequest(context, next)) as Response;

      expect(response.status).toEqual(401);

      expect(next).not.toHaveBeenCalled();
      expect(context.locals.user).toBeUndefined();
      expect(context.locals.accessToken).toBeUndefined();
    });
  });

  describe('valid session', () => {
    it('should populate context.locals with user data and access token', async () => {
      vi.mocked(unseal).mockResolvedValueOnce(mockOAuthResponse);
      vi.mocked(jwtVerify)
        .mockResolvedValueOnce({ payload: {} } as any) // access_token verification
        .mockResolvedValueOnce({ payload: mockUserPayload } as any); // id_token verification

      const context = createMockContext('encrypted-session');

      await onRequest(context, next);

      expect(unseal).toHaveBeenCalledWith('encrypted-session');
      expect(jwtVerify).toHaveBeenCalledTimes(2);
      expect(jwtVerify).toHaveBeenNthCalledWith(1, 'valid-access-token', 'https://auth.example.com');
      expect(jwtVerify).toHaveBeenNthCalledWith(2, 'valid-id-token', 'https://auth.example.com');

      expect(context.locals.user).toEqual({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(context.locals.accessToken).toBe('valid-access-token');

      // doesn't need a refresh token
      expect(refreshToken).not.toHaveBeenCalled();
      expect(context.cookies.set).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalled();
    });
  });

  describe('token refresh', () => {
    it('should refresh expired access token automatically', async () => {
      const newTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        id_token: 'new-id-token',
        token_type: 'bearer' as const,
        expires_in: 3600,
      };

      vi.mocked(unseal).mockResolvedValueOnce(mockOAuthResponse);
      vi.mocked(jwtVerify)
        .mockRejectedValueOnce(new Error('Token expired')) // access_token expired
        .mockResolvedValueOnce({ payload: {} } as any) // access_token verification
        .mockResolvedValueOnce({ payload: mockUserPayload } as any); // id_token verification

      vi.mocked(refreshToken).mockResolvedValueOnce(newTokens);
      vi.mocked(seal).mockResolvedValueOnce('new-encrypted-session');

      const context = createMockContext('encrypted-session');

      await onRequest(context, next);

      expect(refreshToken).toHaveBeenCalledWith('valid-refresh-token');

      expect(seal).toHaveBeenCalledWith(newTokens);
      expect(context.cookies.set).toHaveBeenCalledWith(
        'session',
        'new-encrypted-session',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 300,
          path: '/',
        })
      );

      expect(context.locals.accessToken).toBe('new-access-token');
      expect(next).toHaveBeenCalled();
    });

    it('should use secure cookie in production during refresh', async () => {
      vi.stubEnv('PROD', true);

      vi.mocked(unseal).mockResolvedValueOnce(mockOAuthResponse);
      vi.mocked(jwtVerify)
        .mockRejectedValueOnce(new Error('Token expired')) // access_token expired
        .mockResolvedValueOnce({ payload: {} } as any) // access_token verification
        .mockResolvedValueOnce({ payload: mockUserPayload } as any); // id_token verification

      vi.mocked(refreshToken).mockResolvedValueOnce(mockOAuthResponse);
      vi.mocked(seal).mockResolvedValueOnce('new-encrypted-session');

      const context = createMockContext('encrypted-session');

      await onRequest(context, next);

      expect(context.cookies.set).toHaveBeenCalledWith(
        'session',
        'new-encrypted-session',
        expect.objectContaining({
          secure: true,
        })
      );
    });
  });

  describe('error handling', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.clearAllMocks();

      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should clear session when unseal fails', async () => {
      vi.mocked(unseal).mockRejectedValueOnce(new Error('Decryption failed'));

      const context = createMockContext('corrupted-session');

      await onRequest(context, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Session error:', expect.any(Error));
      expect(context.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
      expect(context.locals.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should clear session when refresh token is invalid', async () => {
      vi.mocked(unseal).mockResolvedValueOnce(mockOAuthResponse);
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Token expired'));
      vi.mocked(refreshToken).mockRejectedValueOnce(new Error('Invalid refresh token'));

      const context = createMockContext('encrypted-session');

      await onRequest(context, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Session error:', expect.any(Error));
      expect(context.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
      expect(context.locals.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should clear session and return 401 when refresh token is invalid and accessing gated endpoint', async () => {
      vi.mocked(getActionContext).mockReturnValue({ action: { name: 'mux.list' } } as AstroActionContext);

      vi.mocked(unseal).mockResolvedValueOnce(mockOAuthResponse);
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Token expired'));
      vi.mocked(refreshToken).mockRejectedValueOnce(new Error('Invalid refresh token'));

      const context = createMockContext('encrypted-session');

      const response = (await onRequest(context, next)) as Response;

      expect(response.status).toEqual(401);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Session error:', expect.any(Error));
      expect(context.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
      expect(context.locals.user).toBeUndefined();
      expect(next).not.toHaveBeenCalled();
    });

    it('should clear session when ID token verification fails', async () => {
      vi.mocked(unseal).mockResolvedValueOnce(mockOAuthResponse);
      vi.mocked(jwtVerify)
        .mockResolvedValueOnce({ payload: {} } as any) // access_token valid
        .mockRejectedValueOnce(new Error('Invalid ID token')); // id_token invalid

      const context = createMockContext('encrypted-session');

      await onRequest(context, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Session error:', expect.any(Error));
      expect(context.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
      expect(next).toHaveBeenCalled();
    });

    it('should clear session when seal fails during refresh', async () => {
      const newTokens = mockOAuthResponse;

      vi.mocked(unseal).mockResolvedValueOnce(mockOAuthResponse);
      vi.mocked(jwtVerify)
        .mockRejectedValueOnce(new Error('Token expired'))
        .mockResolvedValueOnce({ payload: {} } as any);

      vi.mocked(refreshToken).mockResolvedValueOnce(newTokens);
      vi.mocked(seal).mockRejectedValueOnce(new Error('Encryption failed'));

      const context = createMockContext('encrypted-session');

      await onRequest(context, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Session error:', expect.any(Error));
      expect(context.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
      expect(next).toHaveBeenCalled();
    });
  });
});
