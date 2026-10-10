(function () {
  initAppShell("dashboard.html");
  const API = window.FintrackAPI;

  function render() {
    Promise.resolve(API.dashboard()).then(function (data) {
      document.getElementById("statIncome").textContent = API.money(data.income);
      document.getElementById("statExpense").textContent = API.money(data.expense);
      document.getElementById("statBalance").textContent = API.money(data.balance);
      document.getElementById("statSave").textContent = (data.savingsRate || 0) + "%";

      const txBody = document.getElementById("recentTx");
      txBody.innerHTML = data.recent.length
        ? data.recent.map(function (t) {
            return (
              "<tr><td>" + t.date + "</td><td>" + t.note + "</td><td>" + t.category +
              "</td><td class='" + (t.type === "income" ? "amount-in" : "amount-out") + "'>" +
              (t.type === "income" ? "+" : "-") + API.money(t.amount) + "</td></tr>"
            );
          }).join("")
        : "<tr><td colspan='4' class='empty'>No transactions yet.</td></tr>";

      const budgets = document.getElementById("budgetPreview");
      budgets.innerHTML = data.budgets.length
        ? data.budgets.map(function (b) {
            const pct = Math.min(100, Math.round((b.spent / b.limit) * 100) || 0);
            return (
              "<div class='budget-card'><header><strong>" + b.category + "</strong><span>" +
              API.money(b.spent) + " / " + API.money(b.limit) + "</span></header>" +
              "<div class='progress" + (b.spent > b.limit ? " over" : "") + "'><span style='width:" + pct + "%'></span></div></div>"
            );
          }).join("")
        : "<p class='empty'>Set a budget to track spending.</p>";

      const goals = document.getElementById("goalPreview");
      goals.innerHTML = data.goals.length
        ? data.goals.map(function (g) {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100) || 0);
            return (
              "<div class='goal-card'><header><strong>" + g.name + "</strong><span>" + pct +
              "%</span></header><div class='progress'><span style='width:" + pct + "%'></span></div></div>"
            );
          }).join("")
        : "<p class='empty'>Create a savings goal.</p>";
    });
  }

  render();
})();
