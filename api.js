/* Traffic Fuzzy API client – talks to Node.js backend */
var API = "http://127.0.0.1:5000/api";

function api(path, options) {
  options = options || {};
  options.headers = options.headers || {};
  options.headers["Content-Type"] = "application/json";
  return fetch(API + path, options).then(function (res) {
    return res.json().then(function (data) {
      if (!res.ok) {
        var err = new Error(data.error || "Request failed");
        err.status = res.status;
        throw err;
      }
      return data;
    });
  });
}

function getCurrentUser() {
  var raw = localStorage.getItem("itc_session");
  return raw ? JSON.parse(raw) : null;
}
function setCurrentUser(user) {
  localStorage.setItem("itc_session", JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem("itc_session");
}
function requireUser() {
  var user = getCurrentUser();
  if (!user) {
    window.location.href = "operator-login.html";
    return null;
  }
  return user;
}
function requireAdmin() {
  var user = getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = "admin-login.html";
    return null;
  }
  return user;
}
function requireOperator() {
  var user = getCurrentUser();
  if (!user || (user.role !== "operator" && user.role !== "admin")) {
    window.location.href = "operator-login.html";
    return null;
  }
  return user;
}
function logout() {
  clearSession();
  window.location.href = "index.html";
}
function showToast(message) {
  var toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 2800);
}
