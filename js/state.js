export const state = {
    analyzedResults: [],
    topComments: {
        positive: null,
        negative: null,
        neutral: null
    },
    allExtractedComments: [],
    currentBatch: 0,
    BATCH_SIZE: 30,
    activeFilter: 'positive',
};

export function resetState() {
    state.analyzedResults = [];
    state.topComments = {
        positive: null,
        negative: null,
        neutral: null
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
    const summary = {
        positive: 0,
        neutral: 0,
        negative: 0
    };
    state.analyzedResults.forEach(({
        predictions
    }) => {
        if (!predictions || predictions.length === 0) return;
        const top = predictions.reduce((prev, current) =>
            prev.score > current.score ? prev : current
        );
        if (summary.hasOwnProperty(top.label)) {
            summary[top.label]++;
        }
    });
    return summary;
}
