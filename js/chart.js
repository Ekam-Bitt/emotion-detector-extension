let chartInstance;

export function renderChart(summary) {
    const chartContainer = document.querySelector(".chart-container");
    if (!chartContainer) return;
    chartContainer.innerHTML = '<canvas id="sentimentChart"></canvas>';
    const ctx = document.getElementById("sentimentChart").getContext("2d");

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Positive", "Neutral", "Negative"],
            datasets: [{
                data: [summary.positive, summary.neutral, summary.negative],
                backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
                borderWidth: 0,
            }, ],
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
