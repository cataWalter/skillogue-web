// Stub for compatibility with imports
export const getAppData = () => ({
  profiles: {
    get: async (id: string) => ({}),
    save: async (id: string, data: any) => ({}),
  },
});

export const invokeCompatFunction = async (name: string, data?: any) => ({});
export const executeCompatQuery = async (query: any, params?: any[]) => ({ rows: [] });
export const executeCompatRpc = async (name: string, data?: any) => ({});
