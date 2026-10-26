(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  let leads = CRM.getUserLeads();
  const colors = { New: "#8c7bff", Contacted: "#65a8ef", Qualified: "#49bd9a", Proposal: "#f0b75e", Negotiation: "#ba8de6", Won: "#199d74", Lost: "#df6c7d" };
  function render() {
    leads = CRM.getUserLeads();
    const active = leads.filter(l => !["Won", "Lost"].includes(l.status));
    const won = leads.filter(l => l.status === "Won");
    const value = active.reduce((sum, l) => sum + Number(l.value || 0), 0);
    const wonValue = won.reduce((sum, l) => sum + Number(l.value || 0), 0);
    $("pipelineOverview").innerHTML = [
      ["Open opportunities", active.length], ["Open pipeline value", formatMoney(value)],
      ["Deals won", won.length], ["Won revenue", formatMoney(wonValue)]
    ].map(item => `<div class="overview-tile"><span>${item[0]}</span><strong>${item[1]}</strong></div>`).join("");
    $("kanbanBoard").innerHTML = CRM.STATUSES.map(status => {
      const items = leads.filter(l => l.status === status);
      const total = items.reduce((sum, l) => sum + Number(l.value || 0), 0);
      return `<section class="kanban-column" data-status="${status}"><div class="kanban-column-head"><strong><i class="legend-dot" style="display:inline-block;background:${colors[status]};margin-right:6px"></i>${status}</strong><span class="column-count">${items.length}</span></div><div class="column-total">${formatMoney(total)} total</div><div class="kanban-cards">${items.map(l => `<article class="kanban-card" draggable="true" data-id="${escapeHTML(l.id)}"><strong>${escapeHTML(l.name)}</strong><p>${escapeHTML(l.company || l.email)}</p><span class="priority-badge ${priorityClass(l.priority)}">${escapeHTML(l.priority)} priority</span><div class="kanban-card-foot"><span>${formatMoney(l.value)}</span><span>${leadScore(l)} pts</span></div><select data-move-id="${escapeHTML(l.id)}" aria-label="Change status for ${escapeHTML(l.name)}">${CRM.STATUSES.map(s => `<option ${s === status ? "selected" : ""}>${s}</option>`).join("")}</select></article>`).join("") || '<div class="empty-state">Drop a lead here</div>'}</div></section>`;
    }).join("");
  }
  function changeStatus(id, status) {
    const lead = leads.find(l => l.id === id);
    if (!lead || !CRM.STATUSES.includes(status)) return;
    lead.status = status; lead.updatedAt = new Date().toISOString();
    if (!CRM.saveUserLeads(leads)) { showToast("Could not save status.", "error"); return; }
    render(); showToast(`${lead.name} moved to ${status}.`, "success");
  }
  $("kanbanBoard").addEventListener("change", e => {
    const select = e.target.closest("select[data-move-id]");
    if (select) changeStatus(select.dataset.moveId, select.value);
  });
  let draggedId = null;
  $("kanbanBoard").addEventListener("dragstart", e => {
    const card = e.target.closest(".kanban-card"); if (!card) return;
    draggedId = card.dataset.id; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", draggedId);
  });
  $("kanbanBoard").addEventListener("dragover", e => {
    const column = e.target.closest(".kanban-column"); if (!column) return;
    e.preventDefault(); column.classList.add("drop-target"); e.dataTransfer.dropEffect = "move";
  });
  $("kanbanBoard").addEventListener("dragleave", e => {
    const column = e.target.closest(".kanban-column"); if (column && !column.contains(e.relatedTarget)) column.classList.remove("drop-target");
  });
  $("kanbanBoard").addEventListener("drop", e => {
    const column = e.target.closest(".kanban-column"); if (!column) return;
    e.preventDefault(); column.classList.remove("drop-target");
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (id) changeStatus(id, column.dataset.status);
    draggedId = null;
  });
  $("kanbanBoard").addEventListener("dragend", () => { draggedId = null; document.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target")); });
  render();
})();
