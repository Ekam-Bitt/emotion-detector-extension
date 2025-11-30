chrome.runtime.onInstalled.addListener(() => {
  // Inject content script into existing tabs
  chrome.tabs.query({ url: ["*://*.youtube.com/*", "*://*.twitter.com/*", "*://*.x.com/*", "*://*.reddit.com/*"] }, (tabs) => {
    for (const tab of tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    }
  });
});

async function getApiBaseUrl() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get(
        { apiBaseUrl: "http://localhost:8000" },
        (items) => {
          resolve(items.apiBaseUrl);
        }
      );
    } catch (e) {
      resolve("http://localhost:8000");
    }
  });
}

async function analyzeEmotion(texts) {
  try {
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: texts }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", response.status, errorText);
      return { error: `API error: ${response.status}` };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    return { error: error.message || "Unknown error" };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "analyze") {
    analyzeEmotion(msg.text).then((result) => {
      console.log("Emotion analysis result:", result);
      if (result.error) {
        sendResponse({ error: result.error });
      } else {
        // The backend returns { results: [[...]] }
        // We want to send { emotions: [[...]] } or just the array
        sendResponse({ emotions: result.results });
      }
    });
    return true; // keeps the channel open for async
  }
});
