(function () {
  initAppShell("transactions.html");
  const API = window.FintrackAPI;
  let editingId = null;

  const catSelects = document.querySelectorAll("[data-categories]");
  catSelects.forEach(function (sel) {
    const extra = sel.getAttribute("data-categories") === "filter" ? "<option value=''>All categories</option>" : "";
    sel.innerHTML = extra + API.categories.map(function (c) {
      return "<option value='" + c + "'>" + c + "</option>";
    }).join("");
  });

  function filters() {
    return {
      q: document.getElementById("search").value.trim(),
      type: document.getElementById("filterType").value,
      category: document.getElementById("filterCategory").value,
      month: document.getElementById("filterMonth").value
    };
  }

  function render() {
    Promise.resolve(API.getTransactions(filters())).then(function (rows) {
      const body = document.getElementById("txTable");
      if (!rows.length) {
        body.innerHTML = "<tr><td colspan='6' class='empty'>No matching transactions.</td></tr>";
        return;
      }
      body.innerHTML = rows.map(function (t) {
        return (
          "<tr><td>" + t.date + "</td><td>" + (t.note || "—") + "</td><td>" + t.category +
          "</td><td><span class='chip " + (t.type === "income" ? "chip-income" : "chip-expense") + "'>" + t.type +
          "</span></td><td class='" + (t.type === "income" ? "amount-in" : "amount-out") + "'>" +
          API.money(t.amount) + "</td><td class='actions'><button class='btn btn-ghost btn-sm' data-edit='" + t.id +
          "'>Edit</button><button class='btn btn-danger btn-sm' data-del='" + t.id + "'>Delete</button></td></tr>"
        );
      }).join("");
    });
  }

  function openModal(tx) {
    editingId = tx ? tx.id : null;
    document.getElementById("modalTitle").textContent = tx ? "Edit transaction" : "Add transaction";
    document.getElementById("txType").value = tx ? tx.type : "expense";
    document.getElementById("txAmount").value = tx ? tx.amount : "";
    document.getElementById("txCategory").value = tx ? tx.category : "Food";
    document.getElementById("txNote").value = tx ? tx.note : "";
    document.getElementById("txDate").value = tx ? tx.date : new Date().toISOString().slice(0, 10);
    document.getElementById("txModal").classList.add("show");
  }

  function closeModal() {
    document.getElementById("txModal").classList.remove("show");
  }

  document.getElementById("addTx").addEventListener("click", function () { openModal(null); });
  document.getElementById("closeModal").addEventListener("click", closeModal);
  ["search", "filterType", "filterCategory", "filterMonth"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", render);
    document.getElementById(id).addEventListener("change", render);
  });

  document.getElementById("txForm").addEventListener("submit", function (e) {
    e.preventDefault();
    Promise.resolve(API.saveTransaction({
      id: editingId,
      type: document.getElementById("txType").value,
      amount: Number(document.getElementById("txAmount").value),
      category: document.getElementById("txCategory").value,
      note: document.getElementById("txNote").value.trim(),
      date: document.getElementById("txDate").value
    })).then(function () {
      closeModal();
      render();
    });
  });

  document.getElementById("txTable").addEventListener("click", function (e) {
    const editId = e.target.getAttribute("data-edit");
    const delId = e.target.getAttribute("data-del");
    if (editId) {
      Promise.resolve(API.getTransactions()).then(function (rows) {
        openModal(rows.find(function (t) { return t.id === editId; }));
      });
    }
    if (delId && confirm("Delete this transaction?")) {
      Promise.resolve(API.deleteTransaction(delId)).then(render);
    }
  });

  document.getElementById("filterMonth").value = API.monthKey();
  render();
})();
