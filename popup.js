document.getElementById("analyze").addEventListener("click", () => {
  function chunkText(texts, chunkSize = 3) {
    // Group texts into batches of N items
    const chunks = [];
    for (let i = 0; i < texts.length; i += chunkSize) {
      chunks.push(texts.slice(i, i + chunkSize));
    }
    return chunks;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          const selectors = [
            // YouTube comments
            "#contents ytd-comment-thread-renderer #content-text",
            // Reddit posts and comments
            "div[data-testid='post-container'] p, div[data-testid='comment'] p",
            // Twitter tweets
            "article div[lang]",
            // Fallback generic paragraphs
            "p",
          ];

          let elements = [];
          for (const selector of selectors) {
            elements = Array.from(document.querySelectorAll(selector));
            if (elements.length > 0) break;
          }

          return elements
            .map((el) => el.innerText)
            .filter(Boolean)
            .slice(0, 20); // limit text for MVP
        },
      },
      (results) => {
        let texts = results[0].result;
        console.log("Extracted raw texts:", texts);
        // Limit each text to 300 chars and filter out empty/very short texts
        let processedText = texts
          .map((t) => t.slice(0, 300))
          .filter((t) => t && t.length > 10);

        console.log("Processed texts (before chunking):", processedText);

        // Use chunkText to avoid sending too many texts at once (prevents tensor errors)
        //let chunks = chunkText(processedText, 3);
        let chunks = processedText.map((t) => [t]); // each comment in its own batch
        let allEmotions = [];
        let processed = 0;

        function analyzeEmotion(textArr, idx) {
          console.log(`Sending batch ${idx}:`, textArr);
          chrome.runtime.sendMessage(
            { action: "analyze", text: textArr },
            (response) => {
              // Handle tensor size error gracefully
              if (
                response &&
                response.error &&
                response.error.includes("tensor")
              ) {
                allEmotions[idx] = { error: response.error };
              } else {
                allEmotions[idx] = response.emotions;
              }
              processed++;
              if (processed === chunks.length) {
                let output = "";
                for (let i = 0; i < chunks.length; i++) {
                  const chunk = chunks[i];
                  const result = allEmotions[i];

                  if (result.error) {
                    output += `Chunk ${i + 1} Error: ${result.error}\n\n`;
                    continue;
                  }

                  for (let j = 0; j < chunk.length; j++) {
                    const text = chunk[j];
                    let predictions;

                    if (
                      Array.isArray(result) &&
                      Array.isArray(result[0]) &&
                      result[0][0] &&
                      result[0][0].label
                    ) {
                      // result is an array of arrays (one per input)
                      predictions = result[j];
                    } else if (
                      Array.isArray(result) &&
                      result[0] &&
                      result[0].label
                    ) {
                      // result is predictions for a single input
                      predictions = result;
                    } else {
                      predictions = null;
                    }

                    output += `Comment: "${text}"\n`;
                    if (Array.isArray(predictions)) {
                      predictions.forEach((p) => {
                        output += `  ${p.label}: ${(p.score * 100).toFixed(
                          2
                        )}%\n`;
                      });
                    }
                    output += "\n";
                  }
                }

                document.getElementById("results").innerText = output.trim();
              }
            }
          );
        }

        // Analyze each chunk (batch of 3 sentences)
        for (let i = 0; i < chunks.length; i++) {
          analyzeEmotion(chunks[i], i);
        }
      }
    );
  });
});
