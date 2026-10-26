/* Browser-only storage helpers. Do not use this demo for sensitive production data. */
(function () {
  "use strict";
  const KEYS = { users: "slcrm_users_v1", session: "slcrm_session_v1", leads: "slcrm_leads_v1", theme: "slcrm_theme_v1" };
  const STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
  const SOURCES = ["Website", "Referral", "LinkedIn", "Campaign", "Cold call", "Other"];
  const PRIORITIES = ["Hot", "Warm", "Cold"];

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.warn("Could not read local data:", error);
      return fallback;
    }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { console.error("Could not save local data:", error); return false; }
  }
  function uid() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }
  function localDateString(date) {
    const d = date || new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  }
  function dateOffset(days) { const d = new Date(); d.setDate(d.getDate() + days); return localDateString(d); }
  function daysAgo(days) { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString(); }
  function demoLeads() {
    const samples = [
      ["Aarav Mehta","aarav@example.com","+91 98765 10001","Northstar Labs","Website","Qualified","Hot",85000,2,"Interested in annual plan."],
      ["Priya Sharma","priya@example.com","+91 98765 10002","BrightPath Co.","Referral","Proposal","Warm",125000,-1,"Proposal sent. Follow up on pricing."],
      ["Kabir Verma","kabir@example.com","+91 98765 10003","Vertex Digital","LinkedIn","Contacted","Warm",42000,0,"Asked for a product demo."],
      ["Ananya Singh","ananya@example.com","+91 98765 10004","BlueOak Studio","Campaign","New","Cold",30000,5,"Downloaded the product brochure."],
      ["Rohan Gupta","rohan@example.com","+91 98765 10005","Orbit Systems","Cold call","Negotiation","Hot",210000,1,"Discussing implementation timeline."],
      ["Ishita Rao","ishita@example.com","+91 98765 10006","CedarWorks","Website","Won","Hot",95000,-4,"Customer confirmed the deal."],
      ["Dev Malhotra","dev@example.com","+91 98765 10007","PixelForge","Referral","Lost","Cold",55000,-8,"Selected another provider."],
      ["Meera Iyer","meera@example.com","+91 98765 10008","Cloudline India","LinkedIn","Qualified","Warm",78000,3,"Needs a team plan and onboarding."],
      ["Aditya Joshi","aditya@example.com","+91 98765 10009","Summit Retail","Website","New","Hot",165000,-2,"No response after initial inquiry."],
      ["Nisha Kapoor","nisha@example.com","+91 98765 10010","Greenfield Tech","Other","Contacted","Cold",25000,7,"Requested a callback next week."]
    ];
    return samples.map((s, i) => ({
      id: uid(), name: s[0], email: s[1], phone: s[2], company: s[3], source: s[4],
      status: s[5], priority: s[6], value: s[7], followup: dateOffset(s[8]),
      notes: s[9], createdAt: daysAgo(i + 1), updatedAt: daysAgo(i), userId: null
    }));
  }
  function ensureSeedData(userId) {
    const leads = read(KEYS.leads, []);
    const hasUserLeads = leads.some(l => l.userId === userId);
    if (!hasUserLeads) {
      const seed = demoLeads().map(l => ({ ...l, userId }));
      write(KEYS.leads, leads.concat(seed));
      return true;
    }
    return false;
  }
  function getCurrentUser() {
    const session = read(KEYS.session, null);
    if (!session || !session.userId) return null;
    return read(KEYS.users, []).find(u => u.id === session.userId) || null;
  }
  function getUserLeads() {
    const user = getCurrentUser();
    if (!user) return [];
    return read(KEYS.leads, []).filter(l => l.userId === user.id);
  }
  function saveUserLeads(userLeads) {
    const user = getCurrentUser();
    if (!user) return false;
    const otherLeads = read(KEYS.leads, []).filter(l => l.userId !== user.id);
    return write(KEYS.leads, otherLeads.concat(userLeads.map(l => ({ ...l, userId: user.id }))));
  }
  function getAllUsers() { return read(KEYS.users, []); }
  function saveUsers(users) { return write(KEYS.users, users); }
  function getSession() { return read(KEYS.session, null); }
  function setSession(user) { return write(KEYS.session, { userId: user.id, createdAt: new Date().toISOString() }); }
  function clearSession() { localStorage.removeItem(KEYS.session); }
  function getTheme() { return read(KEYS.theme, "light"); }
  function setTheme(theme) { return write(KEYS.theme, theme); }
  window.CRM = {
    KEYS, STATUSES, SOURCES, PRIORITIES, read, write, uid, localDateString, dateOffset,
    getCurrentUser, getUserLeads, saveUserLeads, getAllUsers, saveUsers,
    getSession, setSession, clearSession, getTheme, setTheme, ensureSeedData
  };
})();
