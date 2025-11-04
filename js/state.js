export const state = {
    analyzedResults: [],
    // topComments keyed by model label (LABEL_0 .. LABEL_6)
    topComments: {
        LABEL_0: null,
        LABEL_1: null,
        LABEL_2: null,
        LABEL_3: null,
        LABEL_4: null,
        LABEL_5: null,
        LABEL_6: null,
    },
    allExtractedComments: [],
    currentBatch: 0,
    BATCH_SIZE: 30,
    activeFilter: 'all',
};

export function resetState() {
    state.analyzedResults = [];
    state.topComments = {
        LABEL_0: null,
        LABEL_1: null,
        LABEL_2: null,
        LABEL_3: null,
        LABEL_4: null,
        LABEL_5: null,
        LABEL_6: null,
    };
    state.allExtractedComments = [];
    state.currentBatch = 0;
}

export function addAnalyzedResults(results) {
    state.analyzedResults.push(...results);
    updateTopComments(results);
}

function updateTopComments(batchResults) {
    batchResults.forEach(result => {
        if (result.predictions && result.predictions.length > 0) {
            const topPrediction = result.predictions.reduce((prev, current) =>
                prev.score > current.score ? prev : current
            );
            const label = topPrediction.label;
            if (!state.topComments[label] || topPrediction.score > state.topComments[label].score) {
                state.topComments[label] = {
                    text: result.text,
                    score: topPrediction.score,
                    originalIndex: result.originalIndex,
                };
            }
        }
    });
}

export function getSummary() {
    // Return counts per model label (LABEL_0..LABEL_6)
    const summary = {
        LABEL_0: 0,
        LABEL_1: 0,
        LABEL_2: 0,
        LABEL_3: 0,
        LABEL_4: 0,
        LABEL_5: 0,
        LABEL_6: 0,
    };
    state.analyzedResults.forEach(({ predictions }) => {
        if (!predictions || predictions.length === 0) return;
        const top = predictions.reduce((prev, current) => prev.score > current.score ? prev : current);
        if (summary.hasOwnProperty(top.label)) {
            summary[top.label]++;
        }
    });
    return summary;
}
