let chartInstance;

export function renderChart(summary) {
    const chartContainer = document.querySelector(".chart-container");
    if (!chartContainer) return;
    chartContainer.innerHTML = '<canvas id="sentimentChart"></canvas>';
    const ctx = document.getElementById("sentimentChart").getContext("2d");

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Build labels and data for the 7 classes expected from the model
    const LABEL_ORDER = [
        'LABEL_0', // ADHD
        'LABEL_1', // Anxiety
        'LABEL_2', // Autism
        'LABEL_3', // BPD
        'LABEL_4', // Depression
        'LABEL_5', // PTSD
        'LABEL_6', // Normal
    ];
    const LABEL_NAMES = [
        'ADHD', 'Anxiety', 'Autism', 'BPD', 'Depression', 'PTSD', 'Normal'
    ];
    const COLORS = ['#6EE7B7', '#60A5FA', '#F59E0B', '#A78BFA', '#F9737A', '#34D399', '#9CA3AF'];

    const data = LABEL_ORDER.map(l => summary[l] || 0);

    chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: LABEL_NAMES,
            datasets: [{
                data,
                backgroundColor: COLORS,
                borderWidth: 0,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15,
                    },
                },
            },
        },
    });
}
