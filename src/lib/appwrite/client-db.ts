// Stub for compatibility with imports
export const getAppData = () => ({
  profiles: {
    get: async (_id: string) => ({}),
    save: async (_id: string, _data: any) => ({}),
  },
});

export const invokeCompatFunction = async (_name: string, _data?: any) => ({});
export const executeCompatQuery = async (_query: any, _params?: any[]) => ({ rows: [] });
export const executeCompatRpc = async (_name: string, _data?: any) => ({});
