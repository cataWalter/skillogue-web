import { render } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import AnalyticsTracker from '../../src/components/AnalyticsTracker';
import { useAnalytics } from '../../src/hooks/useAnalytics';

// Mock next/navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock useAnalytics hook
jest.mock('../../src/hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

describe('AnalyticsTracker', () => {
  const mockTrackEvent = jest.fn();
  const mockPathname = '/test-path';
  const mockSearchParams = new URLSearchParams({ param1: 'value1' });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    (usePathname as jest.Mock).mockReturnValue(mockPathname);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
  });

  it('should track page view on mount', () => {
    render(<AnalyticsTracker />);

    expect(mockTrackEvent).toHaveBeenCalledWith('page_view', {
      url: '/test-path?param1=value1'
    });
  });

  it('should track page view with no search params', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    render(<AnalyticsTracker />);

    expect(mockTrackEvent).toHaveBeenCalledWith('page_view', {
      url: '/test-path'
    });
  });

  it('should track page view with empty search params', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));

    render(<AnalyticsTracker />);

    expect(mockTrackEvent).toHaveBeenCalledWith('page_view', {
      url: '/test-path'
    });
  });

  it('should track page view with multiple search params', () => {
    const multiParams = new URLSearchParams({
      param1: 'value1',
      param2: 'value2',
      param3: 'value3'
    });

    (useSearchParams as jest.Mock).mockReturnValue(multiParams);

    render(<AnalyticsTracker />);

    expect(mockTrackEvent).toHaveBeenCalledWith('page_view', {
      url: '/test-path?param1=value1&param2=value2&param3=value3'
    });
  });

  it('should not render any content', () => {
    const { container } = render(<AnalyticsTracker />);

    expect(container.firstChild).toBeNull();
  });

  it('should track page view with special characters in search params', () => {
    const specialParams = new URLSearchParams({
      query: 'hello world',
      id: '123&456',
      category: 'test/123'
    });

    (useSearchParams as jest.Mock).mockReturnValue(specialParams);

    render(<AnalyticsTracker />);

    expect(mockTrackEvent).toHaveBeenCalledWith('page_view', {
      url: '/test-path?query=hello+world&id=123%26456&category=test%2F123'
    });
  });

  it('should track page view with numeric pathname', () => {
    (usePathname as jest.Mock).mockReturnValue('/user/123/profile');

    render(<AnalyticsTracker />);

    expect(mockTrackEvent).toHaveBeenCalledWith('page_view', {
      url: '/user/123/profile?param1=value1'
    });
  });
});
