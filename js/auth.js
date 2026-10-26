(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
  const showMessage = (element, message, success) => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("success", !!success);
  };
  // Demo convenience only. Client-side hashes are not a substitute for server-side password hashing.
  async function hashPassword(password) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
      return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    return "demo:" + password;
  }
  function redirectIfLoggedIn() {
    const user = CRM.getCurrentUser();
    if (user && /(?:index|register)\.html$/.test(location.pathname)) location.replace("dashboard.html");
  }
  redirectIfLoggedIn();

  const registerForm = $("registerForm");
  if (registerForm) registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = $("registerName").value.trim();
    const email = normalizeEmail($("registerEmail").value);
    const password = $("registerPassword").value;
    const confirm = $("confirmPassword").value;
    const message = $("registerMessage");
    if (name.length < 2) return showMessage(message, "Please enter your full name.");
    if (password.length < 8) return showMessage(message, "Password must contain at least 8 characters.");
    if (password !== confirm) return showMessage(message, "Passwords do not match.");
    const users = CRM.getAllUsers();
    if (users.some(user => normalizeEmail(user.email) === email)) return showMessage(message, "An account with this email already exists. Please sign in.");
    const passwordHash = await hashPassword(password);
    users.push({ id: CRM.uid(), name, email, passwordHash, createdAt: new Date().toISOString() });
    if (!CRM.saveUsers(users)) return showMessage(message, "Could not save your account. Check browser storage settings.");
    showMessage(message, "Account created. Redirecting you to login...", true);
    registerForm.reset();
    setTimeout(() => location.href = "index.html?registered=1", 700);
  });

  const loginForm = $("loginForm");
  if (loginForm) {
    if (new URLSearchParams(location.search).get("registered") === "1") showMessage($("loginMessage"), "Account created successfully. Please sign in.", true);
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = normalizeEmail($("loginEmail").value);
      const passwordHash = await hashPassword($("loginPassword").value);
      const user = CRM.getAllUsers().find(u => normalizeEmail(u.email) === email && u.passwordHash === passwordHash);
      if (!user) return showMessage($("loginMessage"), "Invalid email or password. Please try again.");
      CRM.setSession(user);
      CRM.ensureSeedData(user.id);
      showMessage($("loginMessage"), "Login successful. Opening your dashboard...", true);
      setTimeout(() => location.href = "dashboard.html", 350);
    });
  }

  const resetForm = $("resetForm");
  if (resetForm) resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = normalizeEmail($("resetEmail").value);
    const password = $("resetPassword").value;
    const confirm = $("resetConfirm").value;
    const message = $("resetMessage");
    if (password.length < 8) return showMessage(message, "Password must contain at least 8 characters.");
    if (password !== confirm) return showMessage(message, "Passwords do not match.");
    const users = CRM.getAllUsers();
    const userIndex = users.findIndex(u => normalizeEmail(u.email) === email);
    if (userIndex < 0) return showMessage(message, "No account found for this email in this browser.");
    users[userIndex].passwordHash = await hashPassword(password);
    if (!CRM.saveUsers(users)) return showMessage(message, "Could not update password.");
    showMessage(message, "Password updated. You can now sign in.", true);
    setTimeout(() => location.href = "index.html", 900);
  });
})();
