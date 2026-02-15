export const MOCK_API_ROUTES = {
  account: {
    getProfile: "GET /api/user/profile",
    patchProfile: "PATCH /api/user/profile",
    patchPassword: "PATCH /api/user/password",
    deleteUser: "DELETE /api/user",
  },
  security: {
    getSessions: "GET /api/user/sessions",
    logoutAll: "POST /api/user/logout-all",
    twoFactor: "PATCH /api/user/2fa",
  },
  providers: {
    getProviders: "GET /api/user/providers",
    connectProvider: "POST /api/user/providers/connect",
    disconnectProvider: "DELETE /api/user/providers/disconnect",
  },
  preferences: {
    get: "GET /api/user/preferences",
    patch: "PATCH /api/user/preferences",
  },
  notifications: {
    get: "GET /api/user/notifications",
    patch: "PATCH /api/user/notifications",
  },
  privacy: {
    get: "GET /api/user/privacy",
    patch: "PATCH /api/user/privacy",
    export: "POST /api/user/export",
    clearData: "POST /api/user/clear-data",
  },
} as const;
