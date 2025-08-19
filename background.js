async function analyzeEmotion(texts) {
  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-xlm-roberta-base-sentiment",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer HF_API_KEY_HERE", // <-- placeholder          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: texts }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", response.status, errorText);
      return { error: `API error: ${response.status}` };
    }

    return response.json();
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
