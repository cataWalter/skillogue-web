import { act, renderHook, waitFor } from '@testing-library/react';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

const mockGetRegistration = jest.fn();
const mockRegister = jest.fn();
const mockGetSubscription = jest.fn();
const mockSubscribe = jest.fn();
const mockFetch = jest.fn();

describe('usePushNotifications Hook', () => {
  const originalFetch = global.fetch;
  const originalNotification = global.Notification;
  const originalPushManager = window.PushManager;
  const originalServiceWorker = navigator.serviceWorker;
  const originalVapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockSubscription = {
      endpoint: 'https://example.com/push',
      toJSON: jest.fn(() => ({ endpoint: 'https://example.com/push' })),
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

    process.env.NEXT_PUBLIC_VAPID_KEY = originalVapidKey;
  });

  it('registers a service worker before subscribing when none exists', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
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

  it('does not keep the subscription enabled when the server save fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
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
});