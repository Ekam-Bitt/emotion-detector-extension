function analyzeEmotion(texts) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["HF_API_KEY"], async (result) => {
      const apiKey = result.HF_API_KEY;
      if (!apiKey) {
        resolve({ error: "API key not found" });
        return;
      }
      try {
        const response = await fetch(
          "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-xlm-roberta-base-sentiment",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: texts }),
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error:", response.status, errorText);
          resolve({ error: `API error: ${response.status}` });
          return;
        }
        const data = await response.json();
        resolve(data);
      } catch (error) {
        console.error("Fetch error:", error);
        resolve({ error: error.message || "Unknown error" });
      }
    });
  });
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
