(function () {
  const API = window.FintrackAPI;

  function qs(id) {
    return document.getElementById(id);
  }

  function showAlert(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
  }

  window.requireAuth = function () {
    if (!API.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  };

  window.initAppShell = function (active) {
    if (!requireAuth()) return;
    const user = API.currentUser();
    const nameEl = qs("userName");
    if (nameEl && user) nameEl.textContent = user.name;
    document.querySelectorAll(".sidebar nav a").forEach(function (link) {
      if (link.getAttribute("href") === active) link.classList.add("active");
    });
    const logout = qs("logoutBtn");
    if (logout) {
      logout.addEventListener("click", function () {
        API.logout();
        window.location.href = "login.html";
      });
    }
    const toggle = qs("menuToggle");
    const sidebar = document.querySelector(".sidebar");
    if (toggle && sidebar) {
      toggle.addEventListener("click", function () {
        sidebar.classList.toggle("open");
      });
    }
  };

  const loginForm = qs("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const alert = qs("authAlert");
      try {
        API.login({
          email: qs("email").value.trim(),
          password: qs("password").value
        }).then(function () {
          window.location.href = "dashboard.html";
        }).catch(function (err) {
          showAlert(alert, err.message);
        });
      } catch (err) {
        showAlert(alert, err.message);
      }
    });
  }

  const registerForm = qs("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const alert = qs("authAlert");
      const password = qs("password").value;
      const confirm = qs("confirm").value;
      if (password.length < 6) {
        showAlert(alert, "Password must be at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        showAlert(alert, "Passwords do not match.");
        return;
      }
      try {
        API.register({
          name: qs("name").value.trim(),
          email: qs("email").value.trim(),
          password: password
        }).then(function () {
          window.location.href = "dashboard.html";
        }).catch(function (err) {
          showAlert(alert, err.message);
        });
      } catch (err) {
        showAlert(alert, err.message);
      }
    });
  }
})();
