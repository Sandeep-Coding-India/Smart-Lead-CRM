(function () {
  "use strict";
  const user = CRM.getCurrentUser();
  if (!user) { location.replace("index.html"); return; }
  window.CRMUser = user;
  const $ = id => document.getElementById(id);
  const name = $("userName");
  const avatar = $("userAvatar");
  if (name) name.textContent = user.name;
  if (avatar) avatar.textContent = user.name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();
  const navLeadCount = $("navLeadCount");
  const navTaskCount = $("navTaskCount");
  function dueOpenCount() {
    return CRM.getUserLeads().filter(l => l.followup && l.status !== "Won" && l.status !== "Lost").length;
  }
  if (navLeadCount) navLeadCount.textContent = CRM.getUserLeads().length;
  if (navTaskCount) navTaskCount.textContent = dueOpenCount();
  const logoutBtn = $("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    CRM.clearSession();
    location.href = "index.html";
  });
  const themeToggle = $("themeToggle");
  function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    if (themeToggle) themeToggle.textContent = theme === "dark" ? "☾" : "☼";
  }
  applyTheme(CRM.getTheme());
  if (themeToggle) themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("dark") ? "light" : "dark";
    CRM.setTheme(next);
    applyTheme(next);
  });
  const menuToggle = $("menuToggle");
  const sidebar = $("sidebar");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
    document.addEventListener("click", event => {
      if (window.innerWidth <= 900 && sidebar.classList.contains("open") && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) sidebar.classList.remove("open");
    });
  }
  window.formatMoney = function (amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(amount) || 0);
  };
  window.escapeHTML = function (value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  };
  window.formatDate = function (dateString) {
    if (!dateString) return "Not set";
    const date = new Date(dateString + "T00:00:00");
    if (Number.isNaN(date.getTime())) return "Not set";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
  window.dateLabel = function (dateString) {
    if (!dateString) return "No date";
    const today = CRM.localDateString();
    if (dateString < today) return "Overdue";
    if (dateString === today) return "Today";
    const tomorrow = CRM.dateOffset(1);
    if (dateString === tomorrow) return "Tomorrow";
    return formatDate(dateString);
  };
  window.leadScore = function (lead) {
    let score = 25;
    const statusScores = { New: 5, Contacted: 12, Qualified: 25, Proposal: 30, Negotiation: 35, Won: 40, Lost: -10 };
    score += statusScores[lead.status] || 0;
    score += ({ Hot: 25, Warm: 15, Cold: 5 })[lead.priority] || 0;
    if (Number(lead.value) >= 100000) score += 10;
    else if (Number(lead.value) >= 50000) score += 5;
    if (lead.followup) {
      const today = CRM.localDateString();
      if (lead.followup >= today && lead.followup <= CRM.dateOffset(3)) score += 10;
      if (lead.followup < today && !["Won", "Lost"].includes(lead.status)) score -= 10;
    }
    if (lead.status === "Won") score = 100;
    if (lead.status === "Lost") score = Math.min(score, 15);
    return Math.max(0, Math.min(100, score));
  };
  window.leadHealth = function (lead) {
    if (lead.status === "Won") return { key: "healthy", label: "Won" };
    if (lead.status === "Lost") return { key: "risk", label: "Lost" };
    const today = CRM.localDateString();
    if (lead.followup && lead.followup < today) return { key: "risk", label: "At risk" };
    if (lead.followup && lead.followup <= CRM.dateOffset(2)) return { key: "attention", label: "Attention" };
    if (lead.followup && lead.followup > today) return { key: "healthy", label: "Healthy" };
    const updated = new Date(lead.updatedAt || lead.createdAt || Date.now());
    const daysInactive = Math.floor((Date.now() - updated.getTime()) / 86400000);
    if (daysInactive >= 7) return { key: "risk", label: "Inactive" };
    if (daysInactive >= 3) return { key: "attention", label: "Check in" };
    return { key: "healthy", label: "Healthy" };
  };
  window.statusClass = function (status) { return "status-" + String(status).toLowerCase().replace(/[^a-z]+/g, "-"); };
  window.priorityClass = function (priority) { return "priority-" + String(priority).toLowerCase(); };
  window.showToast = function (message, type) {
    let region = $("toastRegion");
    if (!region) { region = document.createElement("div"); region.id = "toastRegion"; region.className = "toast-region"; document.body.appendChild(region); }
    const toast = document.createElement("div");
    toast.className = "toast " + (type || "");
    toast.textContent = message;
    region.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateY(5px)"; setTimeout(() => toast.remove(), 220); }, 2800);
  };
  window.buildLeadCell = function (lead) {
    const initials = lead.name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();
    return `<div class="lead-cell"><span class="lead-avatar">${escapeHTML(initials)}</span><span><strong>${escapeHTML(lead.name)}</strong><small>${escapeHTML(lead.email)}</small></span></div>`;
  };
  window.makeCSV = function (rows, headers) {
    const cell = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';
    return [headers.map(cell).join(","), ...rows.map(row => headers.map(h => cell(row[h])).join(","))].join("\r\n");
  };
  window.downloadText = function (filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  window.readCSV = function (text) {
    const rows = []; let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], next = text[i + 1];
      if (ch === '"' && quoted && next === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) { row.push(cell); cell = ""; }
      else if ((ch === "\n" || ch === "\r") && !quoted) {
        if (ch === "\r" && next === "\n") i++;
        row.push(cell); if (row.some(v => v.trim() !== "")) rows.push(row);
        row = []; cell = "";
      } else cell += ch;
    }
    if (cell.length || row.length) { row.push(cell); if (row.some(v => v.trim() !== "")) rows.push(row); }
    if (!rows.length) return [];
    const headers = rows.shift().map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ""));
    return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] || "").trim()])));
  };
})();
