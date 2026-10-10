(function () {
  initAppShell("analytics.html");
  const API = window.FintrackAPI;
  let pie;
  let bars;

  Promise.resolve(API.analytics()).then(function (data) {
    const pieCtx = document.getElementById("categoryChart");
    const barCtx = document.getElementById("trendChart");
    if (!pieCtx || !window.Chart) return;

    pie = new Chart(pieCtx, {
      type: "doughnut",
      data: {
        labels: data.categories.map(function (c) { return c.category; }),
        datasets: [{
          data: data.categories.map(function (c) { return c.amount; }),
          backgroundColor: ["#1a4d3a", "#2a7a56", "#4caf7a", "#b42318", "#b54708", "#5e6d66", "#d4a373", "#457b9d"]
        }]
      },
      options: { plugins: { legend: { position: "bottom" } }, maintainAspectRatio: false }
    });

    bars = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: data.trend.map(function (t) { return t.month; }),
        datasets: [
          { label: "Income", data: data.trend.map(function (t) { return t.income; }), backgroundColor: "#1a6b48" },
          { label: "Expense", data: data.trend.map(function (t) { return t.expense; }), backgroundColor: "#b42318" }
        ]
      },
      options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });

    const top = document.getElementById("topCategories");
    const sorted = data.categories.slice().sort(function (a, b) { return b.amount - a.amount; });
    top.innerHTML = sorted.slice(0, 5).map(function (c) {
      return "<div class='budget-card'><header><strong>" + c.category + "</strong><span>" + API.money(c.amount) + "</span></header></div>";
    }).join("") || "<p class='empty'>Not enough data yet.</p>";
  });
})();
