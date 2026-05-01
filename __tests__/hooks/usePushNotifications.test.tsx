import { act, renderHook, waitFor } from '@testing-library/react';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

type PushSupportOverride = 'supported' | 'unsupported';

const mockGetRegistration = jest.fn();
const mockRegister = jest.fn();
const mockGetSubscription = jest.fn();
const mockSubscribe = jest.fn();
const mockFetch = jest.fn();
const mockUnsubscribe = jest.fn();
let mockSubscription: PushSubscription;
const getPushSupportWindow = () => window as Window & {
  __SKILLOGUE_PUSH_SUPPORT_OVERRIDE__?: PushSupportOverride;
};

describe('usePushNotifications Hook', () => {
  const originalFetch = global.fetch;
  const originalNotification = global.Notification;
  const originalPushManager = window.PushManager;
  const originalServiceWorker = navigator.serviceWorker;
  const originalPublicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const originalVapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
  const originalPushSupportOverride = getPushSupportWindow().__SKILLOGUE_PUSH_SUPPORT_OVERRIDE__;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSubscription = {
      endpoint: 'https://example.com/push',
      toJSON: jest.fn(() => ({ endpoint: 'https://example.com/push' })),
      unsubscribe: mockUnsubscribe.mockResolvedValue(true),
    } as unknown as PushSubscription;

    const registration = {
      pushManager: {
        getSubscription: mockGetSubscription,
        subscribe: mockSubscribe,
      },
    } as unknown as ServiceWorkerRegistration;

    mockGetRegistration.mockResolvedValue(null);
    mockRegister.mockResolvedValue(registration);
    mockGetSubscription.mockResolvedValue(null);
    mockSubscribe.mockResolvedValue(mockSubscription);
    mockFetch.mockResolvedValue({ ok: true });

    Object.defineProperty(global, 'Notification', {
      configurable: true,
      value: {
        requestPermission: jest.fn().mockResolvedValue('granted'),
      },
    });

    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: function PushManager() {
        return undefined;
      },
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: mockGetRegistration,
        register: mockRegister,
        ready: Promise.resolve(registration),
      },
    });

    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: mockFetch,
    });

    delete getPushSupportWindow().__SKILLOGUE_PUSH_SUPPORT_OVERRIDE__;

    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    process.env.NEXT_PUBLIC_VAPID_KEY = 'SGVsbG8';
  });

  afterAll(() => {
    Object.defineProperty(global, 'Notification', {
      configurable: true,
      value: originalNotification,
    });

    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: originalPushManager,
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker,
    });

    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: originalFetch,
    });

    if (originalPushSupportOverride) {
      getPushSupportWindow().__SKILLOGUE_PUSH_SUPPORT_OVERRIDE__ = originalPushSupportOverride;
    } else {
      delete getPushSupportWindow().__SKILLOGUE_PUSH_SUPPORT_OVERRIDE__;
    }

    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = originalPublicVapidKey;
    process.env.NEXT_PUBLIC_VAPID_KEY = originalVapidKey;
  });

  it('lets tests force the unsupported state even when browser APIs exist', async () => {
    getPushSupportWindow().__SKILLOGUE_PUSH_SUPPORT_OVERRIDE__ = 'unsupported';

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('lets tests force the supported state even when browser APIs are unavailable', async () => {
    const pushManagerDescriptor = Object.getOwnPropertyDescriptor(window, 'PushManager');
    const pushSupportWindow = window as Window & { PushManager?: unknown };

    getPushSupportWindow().__SKILLOGUE_PUSH_SUPPORT_OVERRIDE__ = 'supported';
    delete pushSupportWindow.PushManager;

    try {
      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });
    } finally {
      if (pushManagerDescriptor) {
        Object.defineProperty(window, 'PushManager', pushManagerDescriptor);
      }
    }
  });

  it('logs and stops when no public key is available', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.NEXT_PUBLIC_VAPID_KEY;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY, NEXT_PUBLIC_VAPID_KEY, or server VAPID_PUBLIC_KEY for push notifications.'
      );
      expect(mockRegister).not.toHaveBeenCalled();
      expect(mockSubscribe).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.subscription).toBeNull();
    });

    consoleErrorSpy.mockRestore();
  });

  it('registers a service worker before subscribing when none exists', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
      expect(mockFetch).toHaveBeenCalledWith('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://example.com/push',
        }),
      });
      expect(mockSubscribe).toHaveBeenCalledTimes(1);
      expect(result.current.loading).toBe(false);
      expect(result.current.subscription).not.toBeNull();
    });

    const subscribeOptions = mockSubscribe.mock.calls[0][0] as {
      applicationServerKey: Uint8Array;
      userVisibleOnly: boolean;
    };

    expect(subscribeOptions.userVisibleOnly).toBe(true);
    expect(Array.from(subscribeOptions.applicationServerKey)).toEqual([72, 101, 108, 108, 111]);
  });

  it('does not register or subscribe when notification permission is denied', async () => {
    Object.defineProperty(global, 'Notification', {
      configurable: true,
      value: {
        requestPermission: jest.fn().mockResolvedValue('denied'),
      },
    });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.subscription).toBeNull();
  });

  it('reuses the existing registration and subscription when they are already available', async () => {
    const existingRegistration = {
      pushManager: {
        getSubscription: mockGetSubscription,
        subscribe: mockSubscribe,
      },
    } as unknown as ServiceWorkerRegistration;

    mockGetRegistration.mockResolvedValue(existingRegistration);
    mockGetSubscription.mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
      expect(mockSubscribe).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://example.com/push',
        }),
      });
      expect(result.current.subscription).not.toBeNull();
    });
  });

  it('unsubscribes from an active subscription and clears local state', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(result.current.subscription).not.toBeNull();
    });

    await act(async () => {
      await result.current.unsubscribe();
    });

    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/push-subscription', { method: 'DELETE' });
      expect(result.current.subscription).toBeNull();
    });
  });

  it('returns early when unsubscribe is called without an active subscription', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(mockUnsubscribe).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not keep the subscription enabled when the server save fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.current.loading).toBe(false);
      expect(result.current.subscription).toBeNull();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error subscribing to push notifications:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('logs config loading failures and keeps the hook idle', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.NEXT_PUBLIC_VAPID_KEY;
    mockFetch.mockRejectedValueOnce(new Error('config failed'));

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading push notification configuration:',
        expect.any(Error)
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.subscription).toBeNull();
    });

    consoleErrorSpy.mockRestore();
  });

  it('logs configuration fetch failures when the public key request responds unsuccessfully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.NEXT_PUBLIC_VAPID_KEY;
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading push notification configuration:',
        expect.any(Error)
      );
      expect(mockRegister).not.toHaveBeenCalled();
      expect(result.current.subscription).toBeNull();
    });

    consoleErrorSpy.mockRestore();
  });

  it('logs unsubscribe failures without clearing the subscription', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(result.current.subscription).not.toBeNull();
    });

    mockUnsubscribe.mockRejectedValueOnce(new Error('unsubscribe failed'));

    await act(async () => {
      await result.current.unsubscribe();
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error unsubscribing from push notifications:',
        expect.any(Error)
      );
      expect(result.current.subscription).not.toBeNull();
    });

    consoleErrorSpy.mockRestore();
  });

  it('falls back to the server-served public key when client env is missing', async () => {
    delete process.env.NEXT_PUBLIC_VAPID_KEY;
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ publicKey: 'SGVsbG8' }),
      })
      .mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/push-subscription');
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://example.com/push',
        }),
      });
      expect(result.current.subscription).not.toBeNull();
    });

    const subscribeOptions = mockSubscribe.mock.calls[0][0] as {
      applicationServerKey: Uint8Array;
      userVisibleOnly: boolean;
    };

    expect(Array.from(subscribeOptions.applicationServerKey)).toEqual([72, 101, 108, 108, 111]);
  });

});