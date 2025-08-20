document.addEventListener("DOMContentLoaded", () => {
  // Check if API key is already saved
  chrome.storage.local.get("HF_API_KEY", (data) => {
    if (data.HF_API_KEY) {
      document.getElementById("apiKeyInput").value = data.HF_API_KEY;
      document.getElementById("apiSection").classList.add("hidden");
    }
  });

  // Save API key
  document.getElementById("saveKey").addEventListener("click", () => {
    const key = document.getElementById("apiKeyInput").value;
    chrome.storage.local.set({ HF_API_KEY: key }, () => {
      alert("API Key saved!");
      document.getElementById("apiSection").classList.add("hidden");
    });
  });

  // Filter buttons
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Show comments container when a filter is selected
      document.getElementById("commentsContainer").classList.remove("hidden");

      // Display results for the selected filter
      displayResults(button.dataset.filter);
    });
  });

  // Analyze button
  document.getElementById("analyze").addEventListener("click", analyzeComments);
});

let analyzedResults = [];
let topComments = { positive: null, negative: null, neutral: null };

function analyzeComments() {
  // Reset previous results
  analyzedResults = [];
  topComments = { positive: null, negative: null, neutral: null };

  // Hide comments container
  document.getElementById("commentsContainer").classList.add("hidden");

  // Show loading state in chart container
  const chartCanvas = document.getElementById("sentimentChart");
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "no-comments";
  loadingDiv.textContent = "Analyzing comments...";
  chartCanvas.parentNode.appendChild(loadingDiv);

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
            .slice(0, 50); // limit text for MVP
        },
      },
      (results) => {
        // Remove loading indicator
        const loadingDiv = document.querySelector(
          ".chart-container .no-comments"
        );
        if (loadingDiv) {
          loadingDiv.remove();
        }

        if (!results || !results[0] || !results[0].result) {
          console.error("Failed to extract comments");
          return;
        }

        let texts = results[0].result;

        // Limit each text to 300 chars and filter out empty/very short texts
        let processedText = texts
          .map((t) => t.slice(0, 300))
          .filter((t) => t && t.length > 10);

        if (processedText.length === 0) {
          console.log("No valid text found to analyze");
          return;
        }

        // Process each comment individually
        let processed = 0;

        function analyzeEmotion(text, idx) {
          chrome.runtime.sendMessage(
            { action: "analyze", text: [text] },
            (response) => {
              let predictions = [];

              if (response && response.emotions) {
                if (Array.isArray(response.emotions[0])) {
                  predictions = response.emotions[0];
                } else {
                  predictions = response.emotions;
                }
              }

              // Store analyzed result
              analyzedResults[idx] = {
                text: text,
                predictions: predictions,
                originalIndex: idx,
              };

              // Update top comments
              if (predictions && predictions.length > 0) {
                const topPrediction = predictions.reduce((prev, current) =>
                  prev.score > current.score ? prev : current
                );

                if (
                  !topComments[topPrediction.label] ||
                  topPrediction.score > topComments[topPrediction.label].score
                ) {
                  topComments[topPrediction.label] = {
                    text: text,
                    score: topPrediction.score,
                    index: idx,
                  };
                }
              }

              processed++;

              // When all comments are processed
              if (processed === processedText.length) {
                // Update summary
                updateSummary();

                // Render chart
                renderChart();
              }
            }
          );
        }

        // Analyze each comment
        for (let i = 0; i < processedText.length; i++) {
          analyzeEmotion(processedText[i], i);
        }
      }
    );
  });
}

function updateSummary() {
  const summary = { positive: 0, neutral: 0, negative: 0 };

  analyzedResults.forEach(({ predictions }) => {
    if (!predictions || predictions.length === 0) return;

    const top = predictions.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    if (top.label.toLowerCase().includes("positive")) {
      summary.positive++;
    } else if (top.label.toLowerCase().includes("neutral")) {
      summary.neutral++;
    } else if (top.label.toLowerCase().includes("negative")) {
      summary.negative++;
    }
  });

  document.querySelector(".summary-positive .summary-number").textContent =
    summary.positive;
  document.querySelector(".summary-neutral .summary-number").textContent =
    summary.neutral;
  document.querySelector(".summary-negative .summary-number").textContent =
    summary.negative;
}

function renderChart() {
  const ctx = document.getElementById("sentimentChart").getContext("2d");

  // Destroy previous chart instance if exists
  if (window.sentimentChartInstance) {
    window.sentimentChartInstance.destroy();
  }

  const summary = {
    positive:
      parseInt(
        document.querySelector(".summary-positive .summary-number").textContent
      ) || 0,
    neutral:
      parseInt(
        document.querySelector(".summary-neutral .summary-number").textContent
      ) || 0,
    negative:
      parseInt(
        document.querySelector(".summary-negative .summary-number").textContent
      ) || 0,
  };

  window.sentimentChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Positive", "Neutral", "Negative"],
      datasets: [
        {
          data: [summary.positive, summary.neutral, summary.negative],
          backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: {
              size: 12,
            },
            padding: 15,
          },
        },
      },
    },
  });
}

function displayResults(filter) {
  const container = document.getElementById("commentsContainer");

  // Clear previous results
  container.innerHTML = "";

  // Get filtered results
  let filteredResults = [];

  if (filter === "all") {
    // Show all comments in original order
    filteredResults = analyzedResults.filter((item) => item !== undefined);
    filteredResults.sort((a, b) => a.originalIndex - b.originalIndex);
  } else {
    // Show only comments with the selected sentiment, sorted by confidence
    filteredResults = analyzedResults.filter(
      (item) =>
        item &&
        item.predictions &&
        item.predictions.some((p) => p.label === filter)
    );

    // Sort by confidence score (descending)
    filteredResults.sort((a, b) => {
      const aScore = a.predictions.find((p) => p.label === filter).score;
      const bScore = b.predictions.find((p) => p.label === filter).score;
      return bScore - aScore;
    });
  }

  // Display results
  if (filteredResults.length === 0) {
    container.innerHTML = '<div class="no-comments">No comments found</div>';
    return;
  }

  filteredResults.forEach((result, index) => {
    if (!result || !result.predictions) return;

    const commentDiv = document.createElement("div");

    // Find the dominant sentiment
    const topPrediction = result.predictions.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    // Add appropriate class based on sentiment
    commentDiv.className = `comment ${topPrediction.label}-comment`;

    // Check if this is a top comment
    const isTopComment =
      topComments[topPrediction.label] &&
      topComments[topPrediction.label].index === result.originalIndex;

    // Create HTML for the comment
    let html = `
            <div class="comment-text">${result.text}</div>
            <div class="sentiment-bars">
        `;

    // Add sentiment bars for each category
    result.predictions.forEach((prediction) => {
      const percentage = (prediction.score * 100).toFixed(2);

      html += `
                <div class="sentiment-label">
                    <span>${prediction.label}</span>
                    <span>${percentage}%</span>
                </div>
                <div class="sentiment-bar">
                    <div class="sentiment-fill ${prediction.label}-fill" style="width: ${percentage}%"></div>
                </div>
            `;
    });

    html += `</div>`;

    // Add top badge if this is a top comment
    if (isTopComment && filter !== "all") {
      html += `<div class="top-badge top-${topPrediction.label}">Top ${topPrediction.label}</div>`;
    }

    commentDiv.innerHTML = html;
    container.appendChild(commentDiv);
  });
}
