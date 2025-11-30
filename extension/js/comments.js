import {
    analyzeEmotion
} from './api.js';
import {
    state,
    resetState,
    addAnalyzedResults,
    getSummary
} from './state.js';
import * as ui from './ui.js';
import {
    renderChart
} from './chart.js';

export async function extractAndAnalyze() {
    resetState();
    ui.toggleCommentsContainer(false);
    ui.toggleLoadMore(false);
    ui.showLoader("Extracting comments from page...");

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    const injectionResults = await chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },
        files: ['content-script.js'],
    });

    if (!injectionResults || !injectionResults[0] || !injectionResults[0].result) {
        ui.showLoader("Failed to extract comments.");
        return;
    }

    state.allExtractedComments = injectionResults[0].result;

    if (state.allExtractedComments.length === 0) {
        ui.showLoader("No comments found on this page.");
        return;
    }

    ui.showLoader(`Found ${state.allExtractedComments.length} comments. Starting analysis...`);

    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for user to read message
    processNextBatch();
}

export async function processNextBatch() {
    const startIdx = state.currentBatch * state.BATCH_SIZE;
    const endIdx = Math.min(startIdx + state.BATCH_SIZE, state.allExtractedComments.length);
    const batchComments = state.allExtractedComments.slice(startIdx, endIdx);

    if (batchComments.length === 0) {
        ui.showLoader("Analysis complete!");
        setTimeout(() => {
            const summary = getSummary();
            ui.hideLoader();
            renderChart(summary);
            ui.showResultsContainers();
        }, 1500);
        return;
    }

    const totalCount = state.allExtractedComments.length;
    const currentCount = Math.min((state.currentBatch + 1) * state.BATCH_SIZE, totalCount);
    const progress = Math.round((currentCount / totalCount) * 100);
    ui.showLoader(`Analyzing batch ${state.currentBatch + 1}<br>${currentCount}/${totalCount} comments (${progress}%)`);
    ui.setLoadMoreState(true);

    const analysisPromises = batchComments.map(comment => analyzeEmotion(comment.text));
    const batchResults = await Promise.all(analysisPromises);

    const resultsWithIndex = batchResults.map((result, i) => ({
        ...result,
        originalIndex: batchComments[i].originalIndex,
    }));

    addAnalyzedResults(resultsWithIndex);

    const summary = getSummary();
    ui.updateSummary(summary);
    renderChart(summary);

    // Trigger a click on the active filter to re-render the results
    document.querySelector(`.filter-btn[data-filter="${state.activeFilter}"]`).click();


    ui.setLoadMoreState(false);

    const remaining = totalCount - endIdx;
    if (remaining > 0) {
        ui.toggleLoadMore(true, remaining);
    } else {
        ui.toggleLoadMore(false);
        ui.showLoader("Analysis complete!");
        setTimeout(() => {
            ui.hideLoader();
            renderChart(summary);
            ui.showResultsContainers();
        }, 1500);
    }

    state.currentBatch++;
}
