(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  let filter = "open";
  function getTasks() {
    return CRM.getUserLeads().filter(l => l.followup).map(l => ({
      ...l, completed: ["Won", "Lost"].includes(l.status),
      overdue: l.followup < CRM.localDateString() && !["Won", "Lost"].includes(l.status),
      today: l.followup === CRM.localDateString() && !["Won", "Lost"].includes(l.status)
    })).sort((a, b) => a.followup.localeCompare(b.followup));
  }
  function render() {
    const tasks = getTasks();
    const open = tasks.filter(t => !t.completed);
    $("tasksOpen").textContent = open.length;
    $("tasksToday").textContent = open.filter(t => t.today).length;
    $("tasksOverdue").textContent = open.filter(t => t.overdue).length;
    $("tasksCompleted").textContent = tasks.filter(t => t.completed).length;
    const visible = tasks.filter(t => {
      if (filter === "open") return !t.completed;
      if (filter === "today") return t.today;
      if (filter === "overdue") return t.overdue;
      if (filter === "completed") return t.completed;
      return true;
    });
    $("followupTaskList").innerHTML = visible.length ? visible.map(t => {
      const d = new Date(t.followup + "T00:00:00");
      const label = t.completed ? "Completed" : t.overdue ? "Overdue" : t.today ? "Due today" : "Upcoming";
      const statusClassName = t.completed ? "completed" : t.overdue ? "overdue" : t.today ? "today" : "upcoming";
      return `<div class="followup-row"><div class="date-box"><strong>${d.getDate()}</strong><span>${d.toLocaleDateString("en-IN",{month:"short"})}</span></div><div class="followup-title"><strong>${escapeHTML(t.name)}</strong><small>${escapeHTML(t.company || t.email)} · ${escapeHTML(t.status)}</small></div><div class="followup-meta"><strong>${escapeHTML(t.notes || "Follow up with this lead")}</strong><small>${escapeHTML(t.phone || t.email)}</small></div><span class="task-status ${statusClassName}">${label}</span><a class="btn btn-small btn-secondary" href="leads.html">View lead</a></div>`;
    }).join("") : '<div class="empty-state"><strong>No tasks in this view</strong>Set a follow-up date on a lead to see it here.</div>';
  }
  document.querySelectorAll("[data-task-filter]").forEach(btn => btn.addEventListener("click", () => {
    filter = btn.dataset.taskFilter;
    document.querySelectorAll("[data-task-filter]").forEach(b => b.classList.toggle("active", b === btn));
    render();
  }));
  render();
})();
