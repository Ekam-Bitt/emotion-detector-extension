import * as storage from './storage.js';
import * as ui from './ui.js';
import {
    extractAndAnalyze,
    processNextBatch
} from './comments.js';
import {
    state
} from './state.js';

document.addEventListener("DOMContentLoaded", async () => {
    const apiKey = await storage.getApiKey();
    if (apiKey) {
        ui.updateApiKeyInput(apiKey);
        ui.toggleApiSection(false);
    }

    document.getElementById("saveKey").addEventListener("click", async () => {
        const key = document.getElementById("apiKeyInput").value;
        if (!key) {
            alert("Please enter an API key.");
            return;
        }
        await storage.saveApiKey(key);
        alert("API Key saved!");
        ui.toggleApiSection(false);
    });

    document.querySelectorAll(".filter-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.filter;
            state.activeFilter = filter;
            ui.setActiveFilter(filter);
            ui.toggleCommentsContainer(true);

            let filteredResults = [];
            if (filter === "all") {
                filteredResults = [...state.analyzedResults].sort((a, b) => a.originalIndex - b.originalIndex);
            } else {
                filteredResults = state.analyzedResults
                    .filter(item => item?.predictions?.some(p => p.label === filter))
                    .sort((a, b) => {
                        const aScore = a.predictions.find(p => p.label === filter)?.score || 0;
                        const bScore = b.predictions.find(p => p.label === filter)?.score || 0;
                        return bScore - aScore;
                    });
            }
            ui.displayResults(filteredResults, state.topComments, filter);
        });
    });

    document.getElementById("analyze").addEventListener("click", () => {
        ui.showResultsContainers();
        extractAndAnalyze();
    });

    document.getElementById("loadMore").addEventListener("click", processNextBatch);

    ui.setActiveFilter(state.activeFilter);
});
