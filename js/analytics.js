(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const leads = CRM.getUserLeads();
  const active = leads.filter(l => !["Won", "Lost"].includes(l.status));
  const won = leads.filter(l => l.status === "Won");
  const totalValue = leads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const openValue = active.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const wonValue = won.reduce((sum, l) => sum + Number(l.value || 0), 0);
  $("analyticsConversion").textContent = (leads.length ? won.length / leads.length * 100 : 0).toFixed(1) + "%";
  $("analyticsPipeline").textContent = formatMoney(openValue);
  $("analyticsRevenue").textContent = formatMoney(wonValue);
  $("analyticsAverage").textContent = formatMoney(leads.length ? totalValue / leads.length : 0);
  const statusCounts = CRM.STATUSES.map(status => ({ label: status, count: leads.filter(l => l.status === status).length }));
  const maxStatus = Math.max(1, ...statusCounts.map(s => s.count));
  $("statusChart").innerHTML = statusCounts.map(item => `<div class="bar-row"><span class="bar-label">${item.label}</span><div class="bar-track"><div class="bar-fill" style="width:${item.count / maxStatus * 100}%"></div></div><span class="bar-value">${item.count}</span></div>`).join("");
  const sourceMap = {};
  leads.forEach(l => { const source = l.source || "Other"; sourceMap[source] = (sourceMap[source] || 0) + 1; });
  const sourceEntries = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(1, ...sourceEntries.map(x => x[1]));
  $("sourceChart").innerHTML = sourceEntries.length ? sourceEntries.map(([name, count]) => `<div class="source-row"><strong>${escapeHTML(name)}</strong><span>${count} lead${count === 1 ? "" : "s"}</span><div class="source-track"><div class="source-fill" style="width:${count / maxSource * 100}%"></div></div></div>`).join("") : '<div class="empty-state">Add leads to see source performance.</div>';
  const atRisk = active.filter(l => leadHealth(l).key === "risk");
  const attention = active.filter(l => leadHealth(l).key === "attention");
  const hot = active.filter(l => l.priority === "Hot");
  const bestSource = sourceEntries[0];
  const insights = [
    { icon: "⚑", title: `${atRisk.length} leads at risk`, text: atRisk.length ? "Review overdue follow-ups and update the next action for these leads." : "No leads are currently flagged at risk. Keep follow-up dates updated." },
    { icon: "✦", title: `${hot.length} hot-priority leads`, text: hot.length ? "Focus on hot leads that have upcoming or overdue follow-ups." : "Mark promising leads as Hot when the available information supports it." },
    { icon: "↗", title: bestSource ? `${bestSource[0]} leads your sources` : "Track your lead sources", text: bestSource ? `${bestSource[1]} of ${leads.length} leads (${Math.round(bestSource[1] / Math.max(1, leads.length) * 100)}%) currently come from ${bestSource[0]}.` : "Choose a source for each lead to understand which channels bring opportunities." },
    { icon: "◷", title: `${attention.length} need attention`, text: attention.length ? "Check the next follow-up date and add a clear next step." : "No leads are currently flagged for immediate attention." },
    { icon: "₹", title: `${formatMoney(openValue)} open pipeline`, text: "This is the sum of deal values for leads not marked Won or Lost." },
    { icon: "✓", title: `${won.length} deals won`, text: `Recorded won deal value is ${formatMoney(wonValue)}. Update lead status to keep this report accurate.` }
  ];
  $("smartInsights").innerHTML = insights.map(i => `<article class="insight-card"><span class="insight-icon">${i.icon}</span><strong>${escapeHTML(i.title)}</strong><p>${escapeHTML(i.text)}</p></article>`).join("");
  $("exportAnalyticsBtn").addEventListener("click", () => {
    const rows = [
      { metric: "Total leads", value: leads.length },
      { metric: "Qualified leads", value: leads.filter(l => ["Qualified", "Proposal", "Negotiation"].includes(l.status)).length },
      { metric: "Won deals", value: won.length },
      { metric: "Conversion rate", value: (leads.length ? won.length / leads.length * 100 : 0).toFixed(1) + "%" },
      { metric: "Open pipeline value", value: openValue },
      { metric: "Won revenue", value: wonValue },
      { metric: "Average deal value", value: leads.length ? Math.round(totalValue / leads.length) : 0 },
      ...statusCounts.map(s => ({ metric: "Status: " + s.label, value: s.count })),
      ...sourceEntries.map(([source, count]) => ({ metric: "Source: " + source, value: count }))
    ];
    downloadText("smart-lead-crm-analytics.csv", makeCSV(rows, ["metric", "value"]), "text/csv;charset=utf-8;");
    showToast("Analytics report exported.", "success");
  });
})();
