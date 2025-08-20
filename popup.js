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

  // Load more button
  document
    .getElementById("loadMore")
    .addEventListener("click", loadMoreComments);
});

let analyzedResults = [];
let topComments = { positive: null, negative: null, neutral: null };
let allExtractedComments = [];
let currentBatch = 0;
const BATCH_SIZE = 30;

function showLoader(text = "Analyzing comments...") {
  const chartContainer = document.querySelector(".chart-container");
  chartContainer.innerHTML = `
        <div class="loader">
            <img src="icons/spinner.gif" class="loader-gif" alt="Loading">
            <div class="loader-text">${text}</div>
        </div>
    `;
}

function analyzeComments() {
  // Reset previous results
  analyzedResults = [];
  topComments = { positive: null, negative: null, neutral: null };
  allExtractedComments = [];
  currentBatch = 0;

  // Hide comments container
  document.getElementById("commentsContainer").classList.add("hidden");

  // Hide load more button
  document.getElementById("loadMoreContainer").classList.add("hidden");

  // Show loader using the proper function
  showLoader("Extracting comments from page...");

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

          return elements.map((el) => el.innerText).filter(Boolean);
        },
      },
      (results) => {
        if (!results || !results[0] || !results[0].result) {
          console.error("Failed to extract comments");
          const chartContainer = document.querySelector(".chart-container");
          chartContainer.innerHTML =
            '<div class="no-comments">Failed to extract comments</div>';
          return;
        }

        // Store all extracted comments
        allExtractedComments = results[0].result
          .map((t) => t.slice(0, 300))
          .filter((t) => t && t.length > 10);

        if (allExtractedComments.length === 0) {
          const chartContainer = document.querySelector(".chart-container");
          chartContainer.innerHTML =
            '<div class="no-comments">No comments found on this page</div>';
          return;
        }

        // Show batch processing message
        showLoader(
          `Found ${allExtractedComments.length} comments. Starting analysis...`
        );

        // Process first batch after a brief delay to show the message
        setTimeout(() => {
          processBatch();
        }, 1000);
      }
    );
  });
}

function processBatch() {
  const startIdx = currentBatch * BATCH_SIZE;
  const endIdx = Math.min(startIdx + BATCH_SIZE, allExtractedComments.length);
  const batchComments = allExtractedComments.slice(startIdx, endIdx);

  if (batchComments.length === 0) {
    // No more comments to process
    document.querySelector(".chart-container").innerHTML =
      '<canvas id="sentimentChart"></canvas>';
    renderChart();
    return;
  }

  // Show batch loader with progress
  const currentCount = Math.min(
    (currentBatch + 1) * BATCH_SIZE,
    allExtractedComments.length
  );
  const totalCount = allExtractedComments.length;
  const progress = Math.round((currentCount / totalCount) * 100);

  showLoader(
    `Analyzing batch ${
      currentBatch + 1
    }<br>${currentCount}/${totalCount} comments (${progress}%)`
  );

  // Disable load more button during processing
  const loadMoreBtn = document.getElementById("loadMore");
  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Processing...";
  }

  let processed = 0;
  let batchResults = [];

  batchComments.forEach((text, idx) => {
    analyzeEmotion(text, (result) => {
      batchResults.push(result);
      processed++;

      // When all comments in batch are processed
      if (processed === batchComments.length) {
        // Add all batch results at once to avoid race conditions
        analyzedResults = analyzedResults.concat(batchResults);

        // Update top comments from this batch
        batchResults.forEach((result, batchIndex) => {
          if (result.predictions && result.predictions.length > 0) {
            const topPrediction = result.predictions.reduce((prev, current) =>
              prev.score > current.score ? prev : current
            );

            const globalIndex =
              analyzedResults.length - batchResults.length + batchIndex;

            if (
              !topComments[topPrediction.label] ||
              topPrediction.score > topComments[topPrediction.label].score
            ) {
              topComments[topPrediction.label] = {
                text: result.text,
                score: topPrediction.score,
                index: globalIndex,
              };
            }
          }
        });

        // Update summary
        updateSummary();

        // Render chart
        const chartContainer = document.querySelector(".chart-container");
        chartContainer.innerHTML = '<canvas id="sentimentChart"></canvas>';
        renderChart();

        // Re-enable load more button
        if (loadMoreBtn) {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = "Load More Comments";
        }

        // Show load more button if there are more comments
        if (endIdx < allExtractedComments.length) {
          document
            .getElementById("loadMoreContainer")
            .classList.remove("hidden");
          document.getElementById("loadMore").textContent = `Load More (${
            allExtractedComments.length - endIdx
          } remaining)`;
        } else {
          document.getElementById("loadMoreContainer").classList.add("hidden");
          // Show completion message
          showLoader("Analysis complete!");
          setTimeout(() => {
            const chartContainer = document.querySelector(".chart-container");
            chartContainer.innerHTML = '<canvas id="sentimentChart"></canvas>';
            renderChart();
          }, 1500);
        }

        currentBatch++;
      }
    });
  });
}

function analyzeEmotion(text, callback) {
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

      callback({
        text: text,
        predictions: predictions,
      });
    }
  );
}

function loadMoreComments() {
  // Hide load more button while processing
  document.getElementById("loadMoreContainer").classList.add("hidden");

  // Process next batch
  processBatch();
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
    // Show all comments in processing order
    filteredResults = [...analyzedResults];
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

    // Check if this is a top comment (use the stored index)
    const isTopComment =
      topComments[topPrediction.label] &&
      analyzedResults.indexOf(result) ===
        topComments[topPrediction.label].index;

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
