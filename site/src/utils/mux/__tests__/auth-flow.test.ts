import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { initiateAuthPopup } from '../auth-flow';

describe('initiateAuthPopup', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open');
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens centered popup with correct dimensions', () => {
    openSpy.mockReturnValue({} as Window);

    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(1920);
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(1080);

    const cleanup = initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    try {
      expect(openSpy).toHaveBeenCalledWith('https://auth.example.com', 'oauth-login', expect.any(String));
      const features = Object.fromEntries(openSpy.mock.calls[0]![2].split(',').map((part: string) => part.split('=')));

      expect(features).toMatchObject({ width: '1366', height: '768', left: '277', top: '156' });
    } finally {
      cleanup();
    }
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
    const onSuccess = vi.fn();
    const cleanup = initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess,
      onError: vi.fn(),
    });

    try {
      for (let i = 0; i < 2; i++) {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: window.location.origin,
            data: { type: 'auth-complete' },
          })
        );
      }

      expect(onSuccess).toHaveBeenCalledTimes(1);
    } finally {
      cleanup();
    }
  });

  it('returns cleanup function that removes listener', () => {
    openSpy.mockReturnValue({} as Window);
    const onSuccess = vi.fn();
    const onActiveSuccess = vi.fn();
    const cleanup = initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess,
      onError: vi.fn(),
    });
    const activeCleanup = initiateAuthPopup({
      authorizationUrl: 'https://auth.example.com',
      onSuccess: onActiveSuccess,
      onError: vi.fn(),
    });

    try {
      cleanup();
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: window.location.origin,
          data: { type: 'auth-complete' },
        })
      );

      expect(onActiveSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).not.toHaveBeenCalled();
    } finally {
      cleanup();
      activeCleanup();
    }
  });
});
