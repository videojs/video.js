import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { CreateUploadResult, LoginResult } from '../auth-flow';
import { createEndpointCoordinator, initiateAuthPopup } from '../auth-flow';

describe('initiateAuthPopup', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open');
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens centered popup with correct dimensions', () => {
    openSpy.mockReturnValue({} as Window);

    initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    expect(openSpy).toHaveBeenCalledWith(
      'https://auth.example.com',
      'oauth-login',
      expect.stringMatching(/width=1366,height=768/)
    );
  });

  it('adds message event listener when popup opens', () => {
    openSpy.mockReturnValue({} as Window);

    initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('redirects when popup is blocked', () => {
    openSpy.mockReturnValue(null);

    // Save original location
    const originalLocation = window.location;

    // Mock location with a writable href
    const mockLocation = { ...originalLocation, href: '' };

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    try {
      initiateAuthPopup({
        authorizationUrl: 'https://auth.example.com/oauth',
        onSuccess: vi.fn(),
        onError: vi.fn(),
      });

      expect(mockLocation.href).toBe('https://auth.example.com/oauth');
    } finally {
      // Restore original location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    }
  });

  it('ignores messages from different origins', () => {
    openSpy.mockReturnValue({} as Window);
    const onSuccess = vi.fn();

    // Capture the handler when addEventListener is called
    let messageHandler: ((event: MessageEvent) => void) | null = null;

    addEventListenerSpy.mockImplementation((type: string, handler: EventListener) => {
      if (type === 'message') {
        messageHandler = handler as (event: MessageEvent) => void;
      }
    });

    initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess,
      onError: vi.fn(),
    });

    // Simulate message from different origin
    messageHandler!(
      new MessageEvent('message', {
        origin: 'https://evil.com',
        data: { type: 'auth-complete' },
      })
    );

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('ignores messages with wrong type', () => {
    openSpy.mockReturnValue({} as Window);
    const onSuccess = vi.fn();

    // Capture the handler when addEventListener is called
    let messageHandler: ((event: MessageEvent) => void) | null = null;

    addEventListenerSpy.mockImplementation((type: string, handler: EventListener) => {
      if (type === 'message') {
        messageHandler = handler as (event: MessageEvent) => void;
      }
    });

    initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess,
      onError: vi.fn(),
    });

    // Simulate message with wrong type
    messageHandler!(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { type: 'something-else' },
      })
    );

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('calls onSuccess when auth-complete received from same origin', () => {
    openSpy.mockReturnValue({} as Window);
    const onSuccess = vi.fn();

    // Capture the handler when addEventListener is called
    let messageHandler: ((event: MessageEvent) => void) | null = null;

    addEventListenerSpy.mockImplementation((type: string, handler: EventListener) => {
      if (type === 'message') {
        messageHandler = handler as (event: MessageEvent) => void;
      }
    });

    initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess,
      onError: vi.fn(),
    });

    expect(messageHandler).not.toBeNull();

    // Simulate message from same origin
    messageHandler!(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { type: 'auth-complete' },
      })
    );

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('removes listener after successful auth', () => {
    openSpy.mockReturnValue({} as Window);

    // Capture the handler when addEventListener is called
    let messageHandler: ((event: MessageEvent) => void) | null = null;

    addEventListenerSpy.mockImplementation((type: string, handler: EventListener) => {
      if (type === 'message') {
        messageHandler = handler as (event: MessageEvent) => void;
      }
    });

    initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    // Simulate message from same origin
    messageHandler!(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { type: 'auth-complete' },
      })
    );

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('returns cleanup function that removes listener', () => {
    openSpy.mockReturnValue({} as Window);

    const cleanup = initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    cleanup();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });
});

describe('createEndpointCoordinator', () => {
  it('returns URL immediately when authenticated', async () => {
    const createUpload = vi.fn<() => Promise<CreateUploadResult>>().mockResolvedValue({
      data: { uploadId: 'upload-1', uploadUrl: 'https://upload.mux.com/xyz' },
    });

    const coordinator = createEndpointCoordinator({
      createUpload,
      initiateLogin: vi.fn(),
      openAuthPopup: vi.fn(),
    });

    const url = await coordinator.getEndpoint();

    expect(url).toBe('https://upload.mux.com/xyz');
    expect(coordinator.getUploadId()).toBe('upload-1');
  });

  it('calls onStateChange with uploading when authenticated', async () => {
    const onStateChange = vi.fn();
    const createUpload = vi.fn<() => Promise<CreateUploadResult>>().mockResolvedValue({
      data: { uploadId: 'upload-1', uploadUrl: 'https://upload.mux.com/xyz' },
    });

    const coordinator = createEndpointCoordinator({
      createUpload,
      initiateLogin: vi.fn(),
      openAuthPopup: vi.fn(),
      onStateChange,
    });

    await coordinator.getEndpoint();

    expect(onStateChange).toHaveBeenCalledWith('uploading');
  });

  it('pauses on 401, waits for auth, then retries', async () => {
    let authCallback: (() => void) | null = null;
    const createUpload = vi
      .fn<() => Promise<CreateUploadResult>>()
      .mockResolvedValueOnce({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } })
      .mockResolvedValueOnce({
        data: { uploadId: 'upload-1', uploadUrl: 'https://upload.mux.com/xyz' },
      });

    const initiateLogin = vi.fn<() => Promise<LoginResult>>().mockResolvedValue({
      data: { authorizationUrl: 'https://auth.example.com' },
    });

    const openAuthPopup = vi.fn((_url: string, onComplete: () => void) => {
      authCallback = onComplete;
    });

    const coordinator = createEndpointCoordinator({
      createUpload,
      initiateLogin,
      openAuthPopup,
    });

    const endpointPromise = coordinator.getEndpoint();

    // Wait for popup to be opened
    await vi.waitFor(() => expect(authCallback).not.toBeNull());

    // Verify popup was opened with correct URL
    expect(openAuthPopup).toHaveBeenCalledWith('https://auth.example.com', expect.any(Function));

    // Simulate auth completion
    authCallback!();

    const url = await endpointPromise;

    expect(url).toBe('https://upload.mux.com/xyz');
    expect(createUpload).toHaveBeenCalledTimes(2);
    expect(coordinator.getUploadId()).toBe('upload-1');
  });

  it('calls onStateChange with needs_login then uploading during auth flow', async () => {
    let authCallback: (() => void) | null = null;
    const onStateChange = vi.fn();
    const createUpload = vi
      .fn<() => Promise<CreateUploadResult>>()
      .mockResolvedValueOnce({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } })
      .mockResolvedValueOnce({
        data: { uploadId: 'upload-1', uploadUrl: 'https://upload.mux.com/xyz' },
      });

    const coordinator = createEndpointCoordinator({
      createUpload,
      initiateLogin: vi.fn<() => Promise<LoginResult>>().mockResolvedValue({
        data: { authorizationUrl: 'https://auth.example.com' },
      }),
      openAuthPopup: (_url: string, onComplete: () => void) => {
        authCallback = onComplete;
      },
      onStateChange,
    });

    const endpointPromise = coordinator.getEndpoint();

    await vi.waitFor(() => expect(authCallback).not.toBeNull());
    expect(onStateChange).toHaveBeenCalledWith('needs_login');

    authCallback!();
    await endpointPromise;

    expect(onStateChange).toHaveBeenCalledWith('uploading');
  });

  it('propagates non-401 errors', async () => {
    const createUpload = vi.fn<() => Promise<CreateUploadResult>>().mockResolvedValue({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error' },
    });

    const coordinator = createEndpointCoordinator({
      createUpload,
      initiateLogin: vi.fn(),
      openAuthPopup: vi.fn(),
    });

    await expect(coordinator.getEndpoint()).rejects.toMatchObject({ message: 'Server error' });
  });

  it('propagates login initiation errors', async () => {
    const createUpload = vi.fn<() => Promise<CreateUploadResult>>().mockResolvedValue({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });

    const initiateLogin = vi.fn<() => Promise<LoginResult>>().mockResolvedValue({
      error: { message: 'OAuth configuration missing' },
    });

    const coordinator = createEndpointCoordinator({
      createUpload,
      initiateLogin,
      openAuthPopup: vi.fn(),
    });

    await expect(coordinator.getEndpoint()).rejects.toMatchObject({ message: 'OAuth configuration missing' });
  });

  it('propagates errors from retry after auth', async () => {
    let authCallback: (() => void) | null = null;
    const createUpload = vi
      .fn<() => Promise<CreateUploadResult>>()
      .mockResolvedValueOnce({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } })
      .mockResolvedValueOnce({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server exploded' } });

    const coordinator = createEndpointCoordinator({
      createUpload,
      initiateLogin: vi.fn<() => Promise<LoginResult>>().mockResolvedValue({
        data: { authorizationUrl: 'https://auth.example.com' },
      }),
      openAuthPopup: (_url: string, onComplete: () => void) => {
        authCallback = onComplete;
      },
    });

    const endpointPromise = coordinator.getEndpoint();

    await vi.waitFor(() => expect(authCallback).not.toBeNull());
    authCallback!();

    await expect(endpointPromise).rejects.toMatchObject({ message: 'Server exploded' });
  });
});
