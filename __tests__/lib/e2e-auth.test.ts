import {
	E2E_AUTH_ADMIN_COOKIE_VALUE,
	E2E_AUTH_COOKIE_NAME,
	E2E_AUTH_HEADER_NAME,
	getE2EAdminSession,
} from '../../src/lib/e2e-auth';

describe('e2e auth helpers', () => {
	it('rejects non-local requests even with matching header and cookie values', () => {
		const request = {
			url: 'https://skillogue.test/api/auth/session',
			headers: {
				get: jest.fn((name: string) => {
					if (name === E2E_AUTH_HEADER_NAME) {
						return E2E_AUTH_ADMIN_COOKIE_VALUE;
					}

					if (name === 'cookie') {
						return `${E2E_AUTH_COOKIE_NAME}=${E2E_AUTH_ADMIN_COOKIE_VALUE}`;
					}

					return null;
				}),
			},
		} as any;

		expect(getE2EAdminSession(request)).toBeNull();
	});

	it('uses nextUrl and the cookies API for local requests', () => {
		const request = {
			nextUrl: { hostname: '127.0.0.1' },
			headers: {
				get: jest.fn((name: string) =>
					name === E2E_AUTH_HEADER_NAME ? E2E_AUTH_ADMIN_COOKIE_VALUE : null
				),
			},
			cookies: {
				get: jest.fn((name: string) =>
					name === E2E_AUTH_COOKIE_NAME ? { value: E2E_AUTH_ADMIN_COOKIE_VALUE } : undefined
				),
			},
		} as any;

		expect(getE2EAdminSession(request)).toEqual({
			user: {
				id: 'e2e-admin',
				email: 'cata.walter@gmail.com',
				name: 'E2E Admin',
				isAdmin: true,
			},
			expires: '2099-01-01T00:00:00.000Z',
		});
	});

	it('parses cookie headers and rejects missing header or cookie matches', () => {
		const missingHeader = {
			url: 'http://localhost/api/auth/session',
			headers: {
				get: jest.fn((name: string) =>
					name === 'cookie' ? `ignored; ${E2E_AUTH_COOKIE_NAME}=${E2E_AUTH_ADMIN_COOKIE_VALUE}` : null
				),
			},
		} as any;
		expect(getE2EAdminSession(missingHeader)).toBeNull();

		const missingCookie = {
			url: 'http://localhost/api/auth/session',
			headers: {
				get: jest.fn((name: string) => {
					if (name === E2E_AUTH_HEADER_NAME) {
						return E2E_AUTH_ADMIN_COOKIE_VALUE;
					}

					if (name === 'cookie') {
						return 'ignored; another=value';
					}

					return null;
				}),
			},
		} as any;
		expect(getE2EAdminSession(missingCookie)).toBeNull();

		const validRequest = {
			url: 'http://localhost/api/auth/session',
			headers: {
				get: jest.fn((name: string) => {
					if (name === E2E_AUTH_HEADER_NAME) {
						return E2E_AUTH_ADMIN_COOKIE_VALUE;
					}

					if (name === 'cookie') {
						return `ignored; ${E2E_AUTH_COOKIE_NAME}=${E2E_AUTH_ADMIN_COOKIE_VALUE}; theme=light`;
					}

					return null;
				}),
			},
		} as any;

		expect(getE2EAdminSession(validRequest)).toEqual({
			user: {
				id: 'e2e-admin',
				email: 'cata.walter@gmail.com',
				name: 'E2E Admin',
				isAdmin: true,
			},
			expires: '2099-01-01T00:00:00.000Z',
		});
	});

	it('treats a missing cookie header as an empty cookie list', () => {
		const request = {
			url: 'http://localhost/api/auth/session',
			headers: {
				get: jest.fn((name: string) =>
					name === E2E_AUTH_HEADER_NAME ? E2E_AUTH_ADMIN_COOKIE_VALUE : null
				),
			},
		} as any;

		expect(getE2EAdminSession(request)).toBeNull();
	});

	it('returns null when the cookies API is available but the auth cookie is missing', () => {
		const request = {
			nextUrl: { hostname: 'localhost' },
			headers: {
				get: jest.fn((name: string) =>
					name === E2E_AUTH_HEADER_NAME ? E2E_AUTH_ADMIN_COOKIE_VALUE : null
				),
			},
			cookies: {
				get: jest.fn(() => undefined),
			},
		} as any;

		expect(getE2EAdminSession(request)).toBeNull();
	});
});
