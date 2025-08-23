const SELECTORS = {
    apiKeyInput: "#apiKeyInput",
    apiSection: "#apiSection",
    saveKeyBtn: "#saveKey",
    filterBtns: ".filter-btn",
    commentsContainer: "#commentsContainer",
    analyzeBtn: "#analyze",
    loadMoreBtn: "#loadMore",
    loadMoreContainer: "#loadMoreContainer",
    chartContainer: ".chart-container",
    filterContainer: ".filter-container",
    summaryPositive: ".summary-positive .summary-number",
    summaryNeutral: ".summary-neutral .summary-number",
    summaryNegative: ".summary-negative .summary-number",
};

const getEl = (selector) => document.querySelector(selector);
const getAllEl = (selector) => document.querySelectorAll(selector);

export function showLoader(text) {
    const chartContainer = getEl(SELECTORS.chartContainer);
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="loader">
                <img src="icons/spinner.gif" class="loader-gif" alt="Loading">
                <div class="loader-text">${text}</div>
            </div>`;
    }
}

export function hideLoader() {
    const chartContainer = getEl(SELECTORS.chartContainer);
    if (chartContainer) {
        chartContainer.innerHTML = '<canvas id="sentimentChart"></canvas>';
    }
}

export function updateApiKeyInput(key) {
    const input = getEl(SELECTORS.apiKeyInput);
    if (input) {
        input.value = key;
    }
}

export function toggleApiSection(show) {
    getEl(SELECTORS.apiSection)?.classList.toggle("hidden", !show);
}

export function toggleCommentsContainer(show) {
    getEl(SELECTORS.commentsContainer)?.classList.toggle("hidden", !show);
}

export function toggleLoadMore(show, remaining = 0) {
    const container = getEl(SELECTORS.loadMoreContainer);
    const button = getEl(SELECTORS.loadMoreBtn);
    if (container) {
        container.classList.toggle("hidden", !show);
    }
    if (button && show) {
        button.textContent = `Load More (${remaining} remaining)`;
    }
}

export function setLoadMoreState(isLoading) {
    const button = getEl(SELECTORS.loadMoreBtn);
    if (button) {
        button.disabled = isLoading;
        button.textContent = isLoading ? "Processing..." : "Load More Comments";
    }
}

export function updateSummary(summary) {
    getEl(SELECTORS.summaryPositive).textContent = summary.positive;
    getEl(SELECTORS.summaryNeutral).textContent = summary.neutral;
    getEl(SELECTORS.summaryNegative).textContent = summary.negative;
}

export function displayResults(results, topComments, filter) {
    const container = getEl(SELECTORS.commentsContainer);
    if (!container) return;

    container.innerHTML = "";

    if (results.length === 0) {
        container.innerHTML = '<div class="no-comments">No comments found</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    results.forEach(result => {
        if (!result?.predictions) return;
        const commentDiv = createCommentElement(result, topComments, filter);
        fragment.appendChild(commentDiv);
    });
    container.appendChild(fragment);
}

function createCommentElement(result, topComments, filter) {
    const commentDiv = document.createElement("div");
    const topPrediction = result.predictions.reduce((prev, current) =>
        prev.score > current.score ? prev : current
    );
    commentDiv.className = `comment ${topPrediction.label}-comment`;

    const topCommentForLabel = topComments[topPrediction.label];
    const isTopComment = topCommentForLabel && result.originalIndex === topCommentForLabel.originalIndex;

    const sentimentBarsHtml = result.predictions.map(p => `
        <div class="sentiment-label">
            <span>${p.label}</span>
            <span>${(p.score * 100).toFixed(2)}%</span>
        </div>
        <div class="sentiment-bar">
            <div class="sentiment-fill ${p.label}-fill" style="width: ${(p.score * 100).toFixed(2)}%"></div>
        </div>
    `).join('');

    let html = `
        <div class="comment-text">${result.text}</div>
        <div class="sentiment-bars">${sentimentBarsHtml}</div>
    `;

    if (isTopComment && filter !== "all") {
        html += `<div class="top-badge top-${topPrediction.label}">Top ${topPrediction.label}</div>`;
    }

    commentDiv.innerHTML = html;
    return commentDiv;
}

export function setActiveFilter(filter) {
    getAllEl(SELECTORS.filterBtns).forEach(btn => {
        btn.classList.toggle("active", btn.dataset.filter === filter);
    });
}

export function showResultsContainers() {
    getEl(SELECTORS.chartContainer)?.classList.remove("hidden");
    getEl(SELECTORS.filterContainer)?.classList.remove("hidden");
}
