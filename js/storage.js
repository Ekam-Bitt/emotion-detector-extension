export const saveApiKey = (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ HF_API_KEY: key }, resolve);
  });
};

export const getApiKey = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get("HF_API_KEY", (data) => resolve(data.HF_API_KEY));
  });
};
