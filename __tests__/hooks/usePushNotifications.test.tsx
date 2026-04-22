import { act, renderHook, waitFor } from '@testing-library/react';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

const mockGetRegistration = jest.fn();
const mockRegister = jest.fn();
const mockGetSubscription = jest.fn();
const mockSubscribe = jest.fn();

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

describe('usePushNotifications Hook', () => {
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
});