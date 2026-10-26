(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const user = window.CRMUser;
  if ($("greetingName")) $("greetingName").textContent = user.name.split(/\s+/)[0];
  const leads = CRM.getUserLeads();
  const active = leads.filter(l => !["Won", "Lost"].includes(l.status));
  const won = leads.filter(l => l.status === "Won");
  const qualified = leads.filter(l => ["Qualified", "Proposal", "Negotiation"].includes(l.status));
  const atRisk = leads.filter(l => leadHealth(l).key === "risk" && !["Won", "Lost"].includes(l.status));
  $("totalLeads").textContent = leads.length;
  $("qualifiedLeads").textContent = qualified.length;
  $("wonLeads").textContent = won.length;
  $("riskLeads").textContent = atRisk.length;
  const statuses = CRM.STATUSES;
  const colors = { New: "#8c7bff", Contacted: "#65a8ef", Qualified: "#49bd9a", Proposal: "#f0b75e", Negotiation: "#ba8de6", Won: "#199d74", Lost: "#df6c7d" };
  const counts = Object.fromEntries(statuses.map(s => [s, leads.filter(l => l.status === s).length]));
  const pipelineSummary = $("pipelineSummary");
  const openValue = active.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  pipelineSummary.innerHTML = `<strong>${formatMoney(openValue)}</strong> in open pipeline`;
  $("pipelineBar").innerHTML = statuses.map(s => `<span class="pipeline-segment" title="${escapeHTML(s)}: ${counts[s]}" style="width:${leads.length ? counts[s] / leads.length * 100 : 0}%;background:${colors[s]}"></span>`).join("");
  $("pipelineLegend").innerHTML = statuses.filter(s => counts[s] > 0).map(s => `<span class="legend-item"><i class="legend-dot" style="background:${colors[s]}"></i>${escapeHTML(s)} <strong>${counts[s]}</strong></span>`).join("") || '<span class="muted">Add leads to see your pipeline.</span>';
  const healthItems = [
    { label: "Healthy", key: "healthy", color: "#199d74" },
    { label: "Needs attention", key: "attention", color: "#e5a13e" },
    { label: "At risk", key: "risk", color: "#df5e70" }
  ];
  $("healthSummary").innerHTML = healthItems.map(item => {
    const count = leads.filter(l => leadHealth(l).key === item.key && !["Won", "Lost"].includes(l.status)).length;
    const percent = active.length ? count / active.length * 100 : 0;
    return `<div class="health-row"><span class="health-label">${item.label}</span><span class="health-count">${count}</span><div class="health-track"><div class="health-fill" style="width:${percent}%;background:${item.color}"></div></div></div>`;
  }).join("");
  const priority = [...leads].filter(l => !["Won", "Lost"].includes(l.status)).sort((a, b) => {
    const scoreA = (leadHealth(a).key === "risk" ? 100 : leadHealth(a).key === "attention" ? 50 : 0) + leadScore(a);
    const scoreB = (leadHealth(b).key === "risk" ? 100 : leadHealth(b).key === "attention" ? 50 : 0) + leadScore(b);
    return scoreB - scoreA;
  }).slice(0, 5);
  $("priorityLeadsBody").innerHTML = priority.length ? priority.map(l => {
    const health = leadHealth(l);
    return `<tr><td>${buildLeadCell(l)}</td><td><span class="status-badge ${statusClass(l.status)}">${escapeHTML(l.status)}</span></td><td><span class="health-badge health-${health.key}">${escapeHTML(health.label)}</span></td><td>${formatMoney(l.value)}</td></tr>`;
  }).join("") : '<tr><td colspan="4"><div class="empty-state"><strong>No active leads yet</strong>Add a lead to start tracking opportunities.</div></td></tr>';
  const tasks = leads.filter(l => l.followup && !["Won", "Lost"].includes(l.status)).sort((a, b) => a.followup.localeCompare(b.followup)).slice(0, 5);
  $("upcomingTasks").innerHTML = tasks.length ? tasks.map(l => {
    const isOverdue = l.followup < CRM.localDateString();
    return `<div class="task-item ${isOverdue ? "overdue" : ""}"><span class="task-dot"></span><div><strong>${escapeHTML(l.name)}</strong><p>${escapeHTML(l.company || l.source)} · ${escapeHTML(l.status)}</p></div><span class="task-date">${escapeHTML(dateLabel(l.followup))}</span></div>`;
  }).join("") : '<div class="empty-state"><strong>All clear</strong>No open follow-ups. Add a date to a lead to plan your next step.</div>';
})();
