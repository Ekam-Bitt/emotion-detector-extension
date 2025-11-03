async function analyzeEmotion(texts) {
  // API key removed: call the inference endpoint without Authorization header
  try {
    const response = await fetch(
      "http://127.0.0.1:5000/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: texts }),
      }
    );
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
      sendResponse({ emotions: result });
    });
    return true; // keeps the channel open for async
  }
});
