(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const form = $("leadForm"), backdrop = $("leadModalBackdrop");
  let leads = CRM.getUserLeads();
  let editingId = null;
  const dateInput = $("leadFollowup");
  function refreshCounts() {
    $("leadCountAll").textContent = leads.length;
    $("leadCountHot").textContent = leads.filter(l => l.priority === "Hot" && !["Won", "Lost"].includes(l.status)).length;
    $("leadCountDue").textContent = leads.filter(l => l.followup && l.followup <= CRM.localDateString() && !["Won", "Lost"].includes(l.status)).length;
    $("leadCountWon").textContent = leads.filter(l => l.status === "Won").length;
    const navLeadCount = $("navLeadCount"); if (navLeadCount) navLeadCount.textContent = leads.length;
    const navTaskCount = $("navTaskCount"); if (navTaskCount) navTaskCount.textContent = leads.filter(l => l.followup && !["Won", "Lost"].includes(l.status)).length;
  }
  function openModal(lead) {
    form.reset(); $("leadFormMessage").textContent = "";
    editingId = lead ? lead.id : null;
    $("leadId").value = lead ? lead.id : "";
    $("leadModalTitle").textContent = lead ? "Edit lead" : "Add new lead";
    $("leadName").value = lead?.name || "";
    $("leadEmail").value = lead?.email || "";
    $("leadPhone").value = lead?.phone || "";
    $("leadCompany").value = lead?.company || "";
    $("leadSource").value = lead?.source || "Website";
    $("leadStatus").value = lead?.status || "New";
    $("leadPriority").value = lead?.priority || "Warm";
    $("leadValue").value = lead?.value ?? 0;
    $("leadFollowup").value = lead?.followup || "";
    $("leadNotes").value = lead?.notes || "";
    backdrop.hidden = false; document.body.style.overflow = "hidden"; $("leadName").focus();
  }
  function closeModal() { backdrop.hidden = true; document.body.style.overflow = ""; editingId = null; }
  $("openLeadModal").addEventListener("click", () => openModal(null));
  $("closeLeadModal").addEventListener("click", closeModal);
  $("cancelLeadModal").addEventListener("click", closeModal);
  backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !backdrop.hidden) closeModal(); });
  function filteredLeads() {
    const query = $("leadSearch").value.trim().toLowerCase();
    const status = $("statusFilter").value, priority = $("priorityFilter").value, sort = $("leadSort").value;
    let result = leads.filter(l => {
      const haystack = [l.name, l.email, l.company, l.phone, l.source].join(" ").toLowerCase();
      return (!query || haystack.includes(query)) && (!status || l.status === status) && (!priority || l.priority === priority);
    });
    result.sort((a, b) => {
      if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sort === "value-high") return Number(b.value) - Number(a.value);
      if (sort === "score-high") return leadScore(b) - leadScore(a);
      return b.createdAt.localeCompare(a.createdAt);
    });
    return result;
  }
  function render() {
    refreshCounts();
    const rows = filteredLeads();
    $("leadResultsLabel").textContent = `Showing ${rows.length} of ${leads.length} leads`;
    $("leadsTableBody").innerHTML = rows.length ? rows.map(l => {
      const health = leadHealth(l);
      return `<tr><td>${buildLeadCell(l)}</td><td>${escapeHTML(l.company || "—")}</td><td><span class="status-badge ${statusClass(l.status)}">${escapeHTML(l.status)}</span></td><td><span class="priority-badge ${priorityClass(l.priority)}">${escapeHTML(l.priority)}</span></td><td><span title="Rule-based score">${leadScore(l)}/100</span></td><td>${formatMoney(l.value)}</td><td><span class="health-badge health-${health.key}">${escapeHTML(dateLabel(l.followup))}</span></td><td><div class="action-buttons"><button class="action-btn" data-action="edit" data-id="${escapeHTML(l.id)}" aria-label="Edit ${escapeHTML(l.name)}">Edit</button><button class="action-btn" data-action="delete" data-id="${escapeHTML(l.id)}" aria-label="Delete ${escapeHTML(l.name)}">Delete</button></div></td></tr>`;
    }).join("") : '<tr><td colspan="8"><div class="empty-state"><strong>No leads match your filters</strong>Try changing the search or add a new lead.</div></td></tr>';
  }
  ["leadSearch", "statusFilter", "priorityFilter", "leadSort"].forEach(id => $(id).addEventListener(id === "leadSearch" ? "input" : "change", render));
  $("clearFiltersBtn").addEventListener("click", () => { $("leadSearch").value = ""; $("statusFilter").value = ""; $("priorityFilter").value = ""; $("leadSort").value = "newest"; render(); });
  $("leadsTableBody").addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]"); if (!btn) return;
    const lead = leads.find(l => l.id === btn.dataset.id); if (!lead) return;
    if (btn.dataset.action === "edit") openModal(lead);
    if (btn.dataset.action === "delete" && confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) {
      leads = leads.filter(l => l.id !== lead.id);
      if (CRM.saveUserLeads(leads)) { render(); showToast("Lead deleted.", "success"); }
      else showToast("Could not save changes.", "error");
    }
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("leadName").value.trim(), email = $("leadEmail").value.trim().toLowerCase();
    if (!name || !email) return;
    const duplicate = leads.find(l => l.email.toLowerCase() === email && l.id !== editingId);
    if (duplicate) { $("leadFormMessage").textContent = `A lead with this email already exists (${duplicate.name}).`; return; }
    const existing = leads.find(l => l.id === editingId);
    const lead = {
      id: editingId || CRM.uid(), name, email, phone: $("leadPhone").value.trim(), company: $("leadCompany").value.trim(),
      source: $("leadSource").value, status: $("leadStatus").value, priority: $("leadPriority").value,
      value: Math.max(0, Number($("leadValue").value) || 0), followup: $("leadFollowup").value,
      notes: $("leadNotes").value.trim(), createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
      userId: CRMUser.id
    };
    const next = existing ? leads.map(l => l.id === editingId ? lead : l) : [lead, ...leads];
    if (!CRM.saveUserLeads(next)) { $("leadFormMessage").textContent = "Could not save. Browser storage may be full."; return; }
    leads = next; closeModal(); render(); showToast(existing ? "Lead updated successfully." : "Lead added successfully.", "success");
  });
  $("exportLeadsBtn").addEventListener("click", () => {
    const headers = ["name","email","phone","company","source","status","priority","value","followup","notes","score"];
    const rows = leads.map(l => ({ ...l, score: leadScore(l) }));
    downloadText("smart-lead-crm-leads.csv", makeCSV(rows, headers), "text/csv;charset=utf-8;");
    showToast("Lead CSV exported.", "success");
  });
  $("importLeadsInput").addEventListener("change", async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text(), parsed = readCSV(text);
      if (!parsed.length) throw new Error("No rows found. Check the CSV file.");
      const imported = [];
      for (const row of parsed) {
        const name = row.name || row.fullname;
        const email = (row.email || row.emailaddress || "").toLowerCase();
        if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
        if (leads.some(l => l.email.toLowerCase() === email) || imported.some(l => l.email === email)) continue;
        const rawStatus = row.status || "New";
        const status = CRM.STATUSES.find(s => s.toLowerCase() === rawStatus.toLowerCase()) || "New";
        const rawPriority = row.priority || "Warm";
        const priority = CRM.PRIORITIES.find(s => s.toLowerCase() === rawPriority.toLowerCase()) || "Warm";
        imported.push({ id: CRM.uid(), name: name.slice(0,100), email, phone: row.phone || "", company: row.company || "", source: CRM.SOURCES.find(s => s.toLowerCase() === (row.source || "").toLowerCase()) || "Other", status, priority, value: Math.max(0, Number(row.value || row.dealvalue) || 0), followup: row.followup || "", notes: row.notes || "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: CRMUser.id });
      }
      if (!imported.length) throw new Error("No valid new leads found. CSV needs name and email columns.");
      const next = imported.concat(leads);
      if (!CRM.saveUserLeads(next)) throw new Error("Could not save imported leads.");
      leads = next; render(); showToast(`${imported.length} lead(s) imported.`, "success");
    } catch (error) { showToast(error.message || "Could not import CSV.", "error"); }
    e.target.value = "";
  });
  if (location.hash === "#addLead") openModal(null);
  render();
})();
