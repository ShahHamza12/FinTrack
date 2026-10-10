/**
 * Fintrack API layer.
 * Uses localStorage until you set window.FINTRACK_API_BASE (e.g. "http://localhost:5000/api").
 */
(function (window) {
  const DB_KEY = "fintrack_db_v1";
  const TOKEN_KEY = "fintrack_token";
  const USER_KEY = "fintrack_user";
  const CATEGORIES = [
    "Salary",
    "Freelance",
    "Housing",
    "Food",
    "Transport",
    "Utilities",
    "Healthcare",
    "Entertainment",
    "Shopping",
    "Education",
    "Savings",
    "Other"
  ];

  function apiBase() {
    return window.FINTRACK_API_BASE || "";
  }

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function monthKey(dateStr) {
    return (dateStr || new Date().toISOString().slice(0, 10)).slice(0, 7);
  }

  function loadDb() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
    const seed = seedDb();
    saveDb(seed);
    return seed;
  }

  function saveDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function seedDb() {
    const today = new Date();
    const iso = (offsetDays, amountNote) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offsetDays);
      return d.toISOString().slice(0, 10);
    };
    return {
      users: [
        {
          id: "user_demo",
          name: "Aarav Mehta",
          email: "aarav@fintrack.test",
          password: "demo1234"
        }
      ],
      transactions: [
        { id: uid("tx"), type: "income", amount: 85000, category: "Salary", note: "Monthly salary", date: iso(2) },
        { id: uid("tx"), type: "expense", amount: 22000, category: "Housing", note: "Rent", date: iso(1) },
        { id: uid("tx"), type: "expense", amount: 4200, category: "Food", note: "Groceries", date: iso(1) },
        { id: uid("tx"), type: "expense", amount: 1800, category: "Transport", note: "Metro + fuel", date: iso(3) },
        { id: uid("tx"), type: "expense", amount: 999, category: "Entertainment", note: "Streaming", date: iso(6) },
        { id: uid("tx"), type: "income", amount: 12000, category: "Freelance", note: "Weekend project", date: iso(8) },
        { id: uid("tx"), type: "expense", amount: 2500, category: "Utilities", note: "Electricity", date: iso(10) }
      ],
      budgets: [
        { id: uid("bd"), category: "Food", limit: 8000, month: monthKey() },
        { id: uid("bd"), category: "Transport", limit: 4000, month: monthKey() },
        { id: uid("bd"), category: "Entertainment", limit: 2500, month: monthKey() },
        { id: uid("bd"), category: "Housing", limit: 25000, month: monthKey() }
      ],
      goals: [
        { id: uid("gl"), name: "Emergency fund", target: 150000, saved: 42000, deadline: iso(-120) },
        { id: uid("gl"), name: "Goa trip", target: 40000, saved: 12500, deadline: iso(-90) }
      ]
    };
  }

  function currentUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function setSession(user) {
    localStorage.setItem(TOKEN_KEY, uid("tok"));
    localStorage.setItem(USER_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email }));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function request(path, options) {
    const base = apiBase();
    if (!base) return null;
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      (options && options.headers) || {}
    );
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = "Bearer " + token;
    const res = await fetch(base + path, Object.assign({}, options, { headers }));
    if (!res.ok) {
      const err = await res.json().catch(function () {
        return { message: "Request failed" };
      });
      throw new Error(err.message || "Request failed");
    }
    if (res.status === 204) return null;
    return res.json();
  }

  function money(n) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(n) || 0);
  }

  function spentInCategory(transactions, category, month) {
    return transactions
      .filter(function (t) {
        return t.type === "expense" && t.category === category && monthKey(t.date) === month;
      })
      .reduce(function (sum, t) {
        return sum + Number(t.amount);
      }, 0);
  }

  const local = {
    register: function (payload) {
      const db = loadDb();
      if (db.users.some(function (u) { return u.email === payload.email; })) {
        throw new Error("An account with this email already exists.");
      }
      const user = {
        id: uid("user"),
        name: payload.name,
        email: payload.email,
        password: payload.password
      };
      db.users.push(user);
      saveDb(db);
      setSession(user);
      return { user: currentUser() };
    },
    login: function (payload) {
      const db = loadDb();
      const user = db.users.find(function (u) {
        return u.email === payload.email && u.password === payload.password;
      });
      if (!user) throw new Error("Invalid email or password.");
      setSession(user);
      return { user: currentUser() };
    },
    getTransactions: function (filters) {
      const db = loadDb();
      let list = db.transactions.slice().sort(function (a, b) {
        return b.date.localeCompare(a.date);
      });
      filters = filters || {};
      if (filters.type) list = list.filter(function (t) { return t.type === filters.type; });
      if (filters.category) list = list.filter(function (t) { return t.category === filters.category; });
      if (filters.q) {
        const q = filters.q.toLowerCase();
        list = list.filter(function (t) {
          return (t.note || "").toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
        });
      }
      if (filters.month) list = list.filter(function (t) { return monthKey(t.date) === filters.month; });
      return list;
    },
    saveTransaction: function (payload) {
      const db = loadDb();
      if (payload.id) {
        db.transactions = db.transactions.map(function (t) {
          return t.id === payload.id ? Object.assign({}, t, payload) : t;
        });
      } else {
        db.transactions.push(Object.assign({ id: uid("tx") }, payload));
      }
      saveDb(db);
      return payload;
    },
    deleteTransaction: function (id) {
      const db = loadDb();
      db.transactions = db.transactions.filter(function (t) { return t.id !== id; });
      saveDb(db);
    },
    getBudgets: function (month) {
      const db = loadDb();
      const m = month || monthKey();
      return db.budgets
        .filter(function (b) { return b.month === m; })
        .map(function (b) {
          return Object.assign({}, b, { spent: spentInCategory(db.transactions, b.category, m) });
        });
    },
    saveBudget: function (payload) {
      const db = loadDb();
      payload.month = payload.month || monthKey();
      const existing = db.budgets.find(function (b) {
        return b.category === payload.category && b.month === payload.month;
      });
      if (payload.id || existing) {
        const id = payload.id || existing.id;
        db.budgets = db.budgets.map(function (b) {
          return b.id === id ? Object.assign({}, b, payload, { id: id }) : b;
        });
      } else {
        db.budgets.push(Object.assign({ id: uid("bd") }, payload));
      }
      saveDb(db);
    },
    deleteBudget: function (id) {
      const db = loadDb();
      db.budgets = db.budgets.filter(function (b) { return b.id !== id; });
      saveDb(db);
    },
    getGoals: function () {
      return loadDb().goals;
    },
    saveGoal: function (payload) {
      const db = loadDb();
      if (payload.id) {
        db.goals = db.goals.map(function (g) {
          return g.id === payload.id ? Object.assign({}, g, payload) : g;
        });
      } else {
        db.goals.push(Object.assign({ id: uid("gl"), saved: Number(payload.saved) || 0 }, payload));
      }
      saveDb(db);
    },
    addToGoal: function (id, amount) {
      const db = loadDb();
      db.goals = db.goals.map(function (g) {
        if (g.id !== id) return g;
        return Object.assign({}, g, { saved: Number(g.saved) + Number(amount) });
      });
      saveDb(db);
    },
    deleteGoal: function (id) {
      const db = loadDb();
      db.goals = db.goals.filter(function (g) { return g.id !== id; });
      saveDb(db);
    },
    dashboard: function () {
      const txs = local.getTransactions();
      const month = monthKey();
      const thisMonth = txs.filter(function (t) { return monthKey(t.date) === month; });
      const income = thisMonth.filter(function (t) { return t.type === "income"; }).reduce(function (s, t) { return s + Number(t.amount); }, 0);
      const expense = thisMonth.filter(function (t) { return t.type === "expense"; }).reduce(function (s, t) { return s + Number(t.amount); }, 0);
      return {
        income: income,
        expense: expense,
        balance: income - expense,
        savingsRate: income ? Math.round(((income - expense) / income) * 100) : 0,
        recent: txs.slice(0, 6),
        budgets: local.getBudgets(month),
        goals: local.getGoals()
      };
    },
    analytics: function () {
      const txs = local.getTransactions();
      const byCategory = {};
      txs.filter(function (t) { return t.type === "expense"; }).forEach(function (t) {
        byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
      });
      const months = {};
      txs.forEach(function (t) {
        const m = monthKey(t.date);
        if (!months[m]) months[m] = { income: 0, expense: 0 };
        months[m][t.type] += Number(t.amount);
      });
      const monthKeys = Object.keys(months).sort();
      return {
        categories: Object.keys(byCategory).map(function (k) { return { category: k, amount: byCategory[k] }; }),
        trend: monthKeys.map(function (m) { return Object.assign({ month: m }, months[m]); })
      };
    },
    report: function (month) {
      const m = month || monthKey();
      const txs = local.getTransactions({ month: m });
      const income = txs.filter(function (t) { return t.type === "income"; }).reduce(function (s, t) { return s + Number(t.amount); }, 0);
      const expense = txs.filter(function (t) { return t.type === "expense"; }).reduce(function (s, t) { return s + Number(t.amount); }, 0);
      return {
        month: m,
        income: income,
        expense: expense,
        net: income - expense,
        transactions: txs,
        budgets: local.getBudgets(m),
        goals: local.getGoals()
      };
    }
  };

  async function wrap(remotePath, remoteOpts, localFn) {
    const remote = await request(remotePath, remoteOpts);
    if (remote !== null) return remote;
    return localFn();
  }

  window.FintrackAPI = {
    categories: CATEGORIES,
    money: money,
    monthKey: monthKey,
    currentUser: currentUser,
    isLoggedIn: function () { return Boolean(localStorage.getItem(TOKEN_KEY)); },
    logout: function () { clearSession(); },
    register: function (payload) {
      return wrap("/auth/register", { method: "POST", body: JSON.stringify(payload) }, function () {
        return local.register(payload);
      });
    },
    login: function (payload) {
      return wrap("/auth/login", { method: "POST", body: JSON.stringify(payload) }, function () {
        return local.login(payload);
      });
    },
    getTransactions: function (filters) {
      const qs = new URLSearchParams(filters || {}).toString();
      return wrap("/transactions" + (qs ? "?" + qs : ""), { method: "GET" }, function () {
        return local.getTransactions(filters);
      });
    },
    saveTransaction: function (payload) {
      const path = payload.id ? "/transactions/" + payload.id : "/transactions";
      return wrap(path, { method: payload.id ? "PUT" : "POST", body: JSON.stringify(payload) }, function () {
        return local.saveTransaction(payload);
      });
    },
    deleteTransaction: function (id) {
      return wrap("/transactions/" + id, { method: "DELETE" }, function () {
        return local.deleteTransaction(id);
      });
    },
    getBudgets: function (month) {
      return wrap("/budgets?month=" + (month || monthKey()), { method: "GET" }, function () {
        return local.getBudgets(month);
      });
    },
    saveBudget: function (payload) {
      return wrap("/budgets", { method: "POST", body: JSON.stringify(payload) }, function () {
        return local.saveBudget(payload);
      });
    },
    deleteBudget: function (id) {
      return wrap("/budgets/" + id, { method: "DELETE" }, function () {
        return local.deleteBudget(id);
      });
    },
    getGoals: function () {
      return wrap("/goals", { method: "GET" }, function () {
        return local.getGoals();
      });
    },
    saveGoal: function (payload) {
      return wrap("/goals", { method: "POST", body: JSON.stringify(payload) }, function () {
        return local.saveGoal(payload);
      });
    },
    addToGoal: function (id, amount) {
      return wrap("/goals/" + id + "/add", { method: "POST", body: JSON.stringify({ amount: amount }) }, function () {
        return local.addToGoal(id, amount);
      });
    },
    deleteGoal: function (id) {
      return wrap("/goals/" + id, { method: "DELETE" }, function () {
        return local.deleteGoal(id);
      });
    },
    dashboard: function () {
      return wrap("/dashboard", { method: "GET" }, function () {
        return local.dashboard();
      });
    },
    analytics: function () {
      return wrap("/analytics", { method: "GET" }, function () {
        return local.analytics();
      });
    },
    report: function (month) {
      return wrap("/reports?month=" + (month || monthKey()), { method: "GET" }, function () {
        return local.report(month);
      });
    }
  };
})(window);
