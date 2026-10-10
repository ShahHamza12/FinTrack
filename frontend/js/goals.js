(function () {
  initAppShell("goals.html");
  const API = window.FintrackAPI;

  function render() {
    Promise.resolve(API.getGoals()).then(function (goals) {
      const list = document.getElementById("goalList");
      if (!goals.length) {
        list.innerHTML = "<p class='empty'>No goals yet. Add one on the left.</p>";
        return;
      }
      list.innerHTML = goals.map(function (g) {
        const pct = Math.min(100, Math.round((g.saved / g.target) * 100) || 0);
        return (
          "<div class='goal-card'><header><strong>" + g.name + "</strong><span>" + pct + "%</span></header>" +
          "<p class='muted'>" + API.money(g.saved) + " of " + API.money(g.target) +
          (g.deadline ? " · by " + g.deadline : "") + "</p>" +
          "<div class='progress'><span style='width:" + pct + "%'></span></div>" +
          "<div class='actions' style='margin-top:10px'>" +
          "<button class='btn btn-primary btn-sm' data-add='" + g.id + "'>Add money</button>" +
          "<button class='btn btn-danger btn-sm' data-del='" + g.id + "'>Delete</button></div></div>"
        );
      }).join("");
    });
  }

  document.getElementById("goalForm").addEventListener("submit", function (e) {
    e.preventDefault();
    Promise.resolve(API.saveGoal({
      name: document.getElementById("goalName").value.trim(),
      target: Number(document.getElementById("goalTarget").value),
      saved: Number(document.getElementById("goalSaved").value) || 0,
      deadline: document.getElementById("goalDeadline").value
    })).then(function () {
      e.target.reset();
      render();
    });
  });

  document.getElementById("goalList").addEventListener("click", function (e) {
    const addId = e.target.getAttribute("data-add");
    const delId = e.target.getAttribute("data-del");
    if (addId) {
      const amount = prompt("Amount to add (INR)");
      if (amount) Promise.resolve(API.addToGoal(addId, Number(amount))).then(render);
    }
    if (delId && confirm("Delete this goal?")) {
      Promise.resolve(API.deleteGoal(delId)).then(render);
    }
  });

  render();
})();
