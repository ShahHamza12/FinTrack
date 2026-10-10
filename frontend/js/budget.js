(function () {
  initAppShell("budget.html");
  const API = window.FintrackAPI;

  const cat = document.getElementById("budgetCategory");
  cat.innerHTML = API.categories
    .filter(function (c) { return c !== "Salary" && c !== "Freelance"; })
    .map(function (c) { return "<option>" + c + "</option>"; })
    .join("");

  function render() {
    const month = document.getElementById("budgetMonth").value || API.monthKey();
    Promise.resolve(API.getBudgets(month)).then(function (rows) {
      const list = document.getElementById("budgetList");
      if (!rows.length) {
        list.innerHTML = "<p class='empty'>No budgets for this month yet.</p>";
        return;
      }
      list.innerHTML = rows.map(function (b) {
        const pct = Math.min(100, Math.round((b.spent / b.limit) * 100) || 0);
        const left = b.limit - b.spent;
        return (
          "<div class='budget-card'><header><strong>" + b.category + "</strong>" +
          "<button class='btn btn-danger btn-sm' data-del='" + b.id + "'>Remove</button></header>" +
          "<p class='muted'>" + API.money(b.spent) + " spent · " +
          (left >= 0 ? API.money(left) + " left" : API.money(Math.abs(left)) + " over") + "</p>" +
          "<div class='progress" + (b.spent > b.limit ? " over" : "") + "'><span style='width:" + pct + "%'></span></div></div>"
        );
      }).join("");
    });
  }

  document.getElementById("budgetMonth").value = API.monthKey();
  document.getElementById("budgetMonth").addEventListener("change", render);
  document.getElementById("budgetForm").addEventListener("submit", function (e) {
    e.preventDefault();
    Promise.resolve(API.saveBudget({
      category: cat.value,
      limit: Number(document.getElementById("budgetLimit").value),
      month: document.getElementById("budgetMonth").value
    })).then(function () {
      document.getElementById("budgetLimit").value = "";
      render();
    });
  });
  document.getElementById("budgetList").addEventListener("click", function (e) {
    const id = e.target.getAttribute("data-del");
    if (id) Promise.resolve(API.deleteBudget(id)).then(render);
  });
  render();
})();
