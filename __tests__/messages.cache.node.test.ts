/**
 * @jest-environment node
 */

import { readMessagesPageCache, writeMessagesPageCache } from '../src/lib/messages-cache';

describe('messages cache helpers in a windowless environment', () => {
  it('return null and no-op cleanly when window is unavailable', () => {
    expect(readMessagesPageCache('user-1')).toBeNull();

    expect(() =>
      writeMessagesPageCache({
        userId: 'user-1',
        conversations: [],
        messagesByConversation: {},
        updatedAt: Date.now(),
      })
    ).not.toThrow();
  });
});
