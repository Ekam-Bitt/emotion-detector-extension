export const analyzeEmotion = (text) => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "analyze", text: [text] }, (response) => {
      let predictions = [];
      if (response && response.emotions) {
        // API response structure can be inconsistent
        predictions = Array.isArray(response.emotions[0])
          ? response.emotions[0]
          : response.emotions;
      }
      resolve({ text, predictions });
    });
  });
};
