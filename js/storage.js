// API key storage removed. Keep no-op functions for backwards compatibility if imported.
export const saveApiKey = async (/* key */) => {
  // No-op: API key handling removed from this extension.
  return Promise.resolve();
};

export const getApiKey = async () => {
  // Always return null: no API key stored or required.
  return Promise.resolve(null);
};
