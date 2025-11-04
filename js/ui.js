const SELECTORS = {
    filterBtns: ".filter-btn",
    commentsContainer: "#commentsContainer",
    analyzeBtn: "#analyze",
    loadMoreBtn: "#loadMore",
    loadMoreContainer: "#loadMoreContainer",
    chartContainer: ".chart-container",
    filterContainer: ".filter-container",
    summaryContainer: "#summaryContainer",
};

// Label mapping from model labels to human-readable names and colors
const LABEL_INFO = {
    LABEL_0: { name: 'ADHD', color: '#6EE7B7' },
    LABEL_1: { name: 'Anxiety', color: '#60A5FA' },
    LABEL_2: { name: 'Autism', color: '#F59E0B' },
    LABEL_3: { name: 'BPD', color: '#A78BFA' },
    LABEL_4: { name: 'Depression', color: '#F9737A' },
    LABEL_5: { name: 'PTSD', color: '#34D399' },
    LABEL_6: { name: 'Normal', color: '#9CA3AF' },
};
const LABEL_ORDER = Object.keys(LABEL_INFO);

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

// API key UI removed. No functions related to updating or toggling an API key remain.

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
    // summary is expected to be an object keyed by LABEL_*
    LABEL_ORDER.forEach(label => {
        const el = getEl(`#summary-${label}`);
        if (el) el.textContent = summary[label] || 0;
    });
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
    // Style the comment border according to the top prediction color
    const topColor = LABEL_INFO[topPrediction.label]?.color || '#ddd';
    commentDiv.className = `comment`;
    commentDiv.style.borderLeft = `5px solid ${topColor}`;

    const topCommentForLabel = topComments[topPrediction.label];
    const isTopComment = topCommentForLabel && result.originalIndex === topCommentForLabel.originalIndex;

    const sentimentBarsHtml = result.predictions.map(p => {
        const info = LABEL_INFO[p.label] || { name: p.label, color: '#ccc' };
        return `
        <div class="sentiment-label">
            <span>${info.name}</span>
            <span>${(p.score * 100).toFixed(2)}%</span>
        </div>
        <div class="sentiment-bar">
            <div class="sentiment-fill" style="width: ${(p.score * 100).toFixed(2)}%; background:${info.color}"></div>
        </div>
    `;
    }).join('');

    let html = `
        <div class="comment-text">${result.text}</div>
        <div class="sentiment-bars">${sentimentBarsHtml}</div>
    `;

    if (isTopComment && filter !== "all") {
        const human = LABEL_INFO[topPrediction.label]?.name || topPrediction.label;
        html += `<div class="top-badge" style="background:${topColor}">Top ${human}</div>`;
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
    getEl(SELECTORS.summaryContainer)?.classList.remove("hidden");
}
