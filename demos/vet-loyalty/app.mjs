import {
  createDemoState, memberBalance, recordPurchase, redeemPoints,
  redeemFreeVisit, addMember, setMembership, setRewardsRule, clinicMetrics
} from "./engine.mjs";

let state = createDemoState();
let clinicId = "north";
let view = "overview";
let search = "";
let sequence = 0;
const page = document.querySelector("#page");
const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modal-title");
const modalContent = document.querySelector("#modal-content");
const toastEl = document.querySelector("#toast");
const cash = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const money = (cents) => cash.format(cents / 100);
const html = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[c]);
const nowId = (prefix) => prefix + "-" + Date.now() + "-" + (++sequence);
const clinic = () => state.clinics.find((c) => c.id === clinicId);
const members = () => state.members.filter((m) => m.clinicId === clinicId);
const transactions = () => state.transactions.filter((t) => t.clinicId === clinicId).slice().reverse();
const member = (id) => members().find((m) => m.id === id);
const option = (m) => '<option value="' + html(m.id) + '">' + html(m.name) + ' · ' + html(m.pet) + "</option>";
const kindLabel = (kind) => ({ purchase: "Purchase", redemption: "Reward redemption", "free-visit": "Free visit redeemed" })[kind] || kind;
const status = (value) => '<span class="status ' + html(value) + '">' + html(value) + "</span>";
const title = (eyebrow, heading, description, actions = "") =>
  '<div class="intro"><div><div class="eyebrow">' + eyebrow + '</div><h1>' + heading +
  '</h1><p class="subtitle">' + description + '</p></div><div class="actions">' + actions + "</div></div>";
const button = (label, action, type = "primary") => '<button class="btn ' + type + '" data-action="' + action + '">' + label + "</button>";
const panelHeader = (name, description = "", action = "") =>
  '<div class="panel-header"><div><h2>' + name + '</h2><p>' + description + '</p></div>' + action + "</div>";

function memberRows(items) {
  if (!items.length) return '<tr><td colspan="6"><div class="empty">No matching fictional members.</div></td></tr>';
  return items.map((m) =>
    '<tr><td><strong>' + html(m.name) + '</strong><small>' + html(m.email) +
    '</small></td><td>' + html(m.pet) + '</td><td>' + status(m.status) +
    '</td><td><strong>' + money(memberBalance(state, clinicId, m.id)) +
    '</strong></td><td>' + html(m.promoProgress) + " / " + html(clinic().buyX) +
    ' <small>' + html(m.freeCredits) + ' free visit credit(s)</small></td><td><button class="linkish" data-action="manage" data-member="' +
    html(m.id) + '">Manage</button></td></tr>'
  ).join("");
}

function transactionRows(items) {
  if (!items.length) return '<tr><td colspan="5"><div class="empty">No transactions in this demo.</div></td></tr>';
  return items.map((t) => {
    const m = member(t.memberId);
    return '<tr><td><strong>' + html(t.id) + '</strong><small>' + html(t.createdAt) +
      '</small></td><td>' + html(m ? m.name : "Unknown") + '</td><td>' + html(kindLabel(t.kind)) +
      '</td><td><span class="money ' + (t.kind === "purchase" ? "plus" : "minus") + '">' +
      (t.kind === "free-visit" ? "1 visit" : money(t.amountCents)) + '</span></td><td><span class="chip">Recorded</span></td></tr>';
  }).join("");
}

function overviewPage() {
  const metrics = clinicMetrics(state, clinicId);
  const stats = [
    ["Active memberships", metrics.activeCount, "out of " + metrics.memberCount + " enrolled", "♙"],
    ["Rewards liability", money(metrics.outstandingCents), "available customer credits", "✧"],
    ["Demo purchases", money(metrics.revenueCents), "cumulative sample sales", "↗"],
    ["Credits redeemed", money(metrics.redemptionsCents), "value of reward redemptions", "⇆"]
  ];
  const statCards = stats.map((s) =>
    '<section class="stat"><div class="stat-head"><span>' + html(s[0]) + '</span><span class="stat-icon">' +
    html(s[3]) + '</span></div><span class="stat-value">' + html(s[1]) +
    '</span><div class="stat-foot">' + html(s[2]) + "</div></section>"
  ).join("");
  const promoRows = members().filter((m) => m.status === "active").map((m) =>
    '<div class="promo-item"><div class="promo-top"><strong>' + html(m.name) +
    ' <span>· ' + html(m.pet) + '</span></strong><span>' + m.promoProgress + " / " + clinic().buyX +
    '</span></div><div class="progress"><span style="width:' + Math.min(100, 100 * m.promoProgress / clinic().buyX) +
    '%"></span></div><p>' + html(m.freeCredits) + ' available free visit credits</p></div>'
  ).join("");
  return title("Business overview", "Good morning, team.", "A clear view of your membership program across " + html(clinic().name) + ".", button("+ New member", "add") + button("Record purchase", "purchase", "dark")) +
    '<div class="stats">' + statCards + '</div><div class="dashboard-grid">' +
    '<section class="panel">' + panelHeader("Recent activity", "Purchases and redemptions from fictional records", '<button class="linkish" data-action="go-transactions">View all →</button>') +
    '<div class="table-wrap"><table><thead><tr><th>Transaction</th><th>Member</th><th>Activity</th><th>Amount</th><th>Status</th></tr></thead><tbody>' +
    transactionRows(transactions().slice(0, 5)) + "</tbody></table></div></section>" +
    '<section class="panel">' + panelHeader("Loyalty progress", "Buy " + clinic().buyX + " eligible visits, earn one free") +
    (promoRows || '<div class="empty">No active members</div>') + "</section></div>";
}

function membersPage() {
  const visible = members().filter((m) => [m.name, m.pet, m.email].some((s) => s.toLowerCase().includes(search.toLowerCase())));
  return title("Customer management", "Members & pets", "Manage fictional enrollments and rewards balances.", button("+ New member", "add") + button("Record purchase", "purchase", "dark")) +
    '<div class="toolbar"><input id="search" class="input" type="search" placeholder="Search member, pet or email..." maxlength="100" aria-label="Search members" value="' + html(search) +
    '"><span class="chip">' + visible.length + " members shown</span></div>" +
    '<section class="panel">' + panelHeader("Member directory", "Account access is simulated; never enter real client data") +
    '<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Pet</th><th>Membership</th><th>Balance</th><th>Promotion</th><th></th></tr></thead><tbody>' +
    memberRows(visible) + "</tbody></table></div></section>";
}

function rewardsPage() {
  const active = members().filter((m) => m.status === "active");
  const totalCredits = active.reduce((sum, m) => sum + m.freeCredits, 0);
  const cards = active.map((m) =>
    '<div class="promo-item"><div class="promo-top"><strong>' + html(m.name) + '</strong><span>' + html(m.pet) +
    '</span></div><div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;margin:0 0 10px"><span>Points balance: <strong>' +
    money(memberBalance(state, clinicId, m.id)) + '</strong></span><span>' + m.promoProgress + '/' + clinic().buyX +
    ' visits</span></div><div class="progress"><span style="width:' + Math.min(100, 100 * m.promoProgress / clinic().buyX) +
    '%"></span></div><p>Free visit vouchers: ' + m.freeCredits + '</p></div>'
  ).join("");
  return title("Member benefits", "Rewards & loyalty", "Transparent earning and redemption rules.", button("Redeem rewards", "redeem") + button("Use free visit", "free", "dark")) +
    '<div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
    '<section class="stat"><div class="stat-head">Rewards earn rate<span class="stat-icon">%</span></div><span class="stat-value">' + clinic().rewardPct +
    '%</span><div class="stat-foot">of eligible purchase subtotal</div></section>' +
    '<section class="stat"><div class="stat-head">Buy-X promotion<span class="stat-icon">✧</span></div><span class="stat-value">' + clinic().buyX +
    ' visits</span><div class="stat-foot">earn one visit voucher</div></section>' +
    '<section class="stat"><div class="stat-head">Available visit vouchers<span class="stat-icon">♧</span></div><span class="stat-value">' + totalCredits +
    '</span><div class="stat-foot">among active members</div></section></div>' +
    '<section class="panel">' + panelHeader("Member progress", "Points are integer cents of store credit; no real money is exchanged") +
    (cards || '<div class="empty">No active members</div>') + "</section>";
}

function transactionsPage() {
  return title("Financial activity", "Transaction ledger", "Illustrative sales, reward redemptions and audit events.", button("Record purchase", "purchase") + button("Export CSV", "export", "dark")) +
    '<section class="panel">' + panelHeader("All clinic transactions", "This is an in-memory transaction record, not a persistent audit ledger") +
    '<div class="table-wrap"><table><thead><tr><th>Event ID</th><th>Member</th><th>Transaction type</th><th>Amount</th><th>Status</th></tr></thead><tbody>' +
    transactionRows(transactions()) + "</tbody></table></div></section>";
}

function settingsPage() {
  return title("Program controls", "Rewards configuration", "Set demonstration rules for the selected hospital. Other hospitals remain unaffected.", button("Reset demo", "reset", "dark")) +
    '<div class="dashboard-grid"><section class="panel">' + panelHeader("Program settings", "Simulated settings, with no backend persistence") +
    '<div class="rule-card"><form data-form="settings"><label for="rate">Reward percentage per purchase (0–20%)</label><input id="rate" name="rate" type="number" min="0" max="20" step="1" required value="' + clinic().rewardPct +
    '"><label for="threshold">Purchases needed for one free visit (2–20)</label><input id="threshold" name="threshold" type="number" min="2" max="20" step="1" required value="' + clinic().buyX +
    '"><p>Changing a rule affects subsequent simulated purchases. Historical ledger credits are not recalculated.</p><button type="submit" class="btn primary">Save demo settings</button></form></div></section>' +
    '<section class="panel">' + panelHeader("Production migration checklist", "Not included in this sample") +
    '<div class="rule-card"><p>✓ Define clinic roles and membership lifecycle<br>✓ Audit reward accounting and reversal policy<br>□ Integrate Stripe Billing with verified webhooks<br>□ Add server authentication and database row-level policies<br>□ Import and reconcile customer exports<br>□ Deploy on accounts owned by the client<br>□ Set up backup, restore and audit checks</p><a href="README.md" class="btn">View technical handoff plan</a></div></section></div>';
}

function render() {
  const names = { overview: "Overview", members: "Members", rewards: "Rewards & loyalty", transactions: "Transactions", settings: "Program settings" };
  document.querySelector("#breadcrumb").textContent = names[view];
  const select = document.querySelector("#clinic");
  select.innerHTML = state.clinics.map((c) => '<option value="' + html(c.id) + '">' + html(c.name) + "</option>").join("");
  select.value = clinicId;
  document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  page.innerHTML = ({ overview: overviewPage, members: membersPage, rewards: rewardsPage, transactions: transactionsPage, settings: settingsPage })[view]();
}

function notify(message, isError = false) {
  toastEl.textContent = message;
  toastEl.classList.toggle("error", isError);
  toastEl.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toastEl.classList.remove("show"), 3600);
}
function closeModal() { modal.classList.remove("open"); modalContent.textContent = ""; }
function modalForm(titleText, contents, submitLabel) {
  modalTitle.textContent = titleText;
  modalContent.innerHTML = contents + '<div class="dialog-actions"><button type="button" class="btn" data-action="close">Cancel</button><button class="btn primary" type="submit">' + submitLabel + "</button></div>";
  modal.classList.add("open");
  const input = modalContent.querySelector("input,select");
  if (input) input.focus();
}
function openDialog(action, selectedId) {
  const active = members().filter((m) => m.status === "active");
  const activeOpts = active.map(option).join("");
  const nameField = '<label for="person">Member</label><select id="person" name="memberId" required>' + activeOpts + "</select>";
  if (action === "add") modalForm("Enroll fictional member", '<form data-form="add"><label for="name">Full name</label><input id="name" name="name" maxlength="100" placeholder="Fictional name" required><label for="pet">Pet name</label><input id="pet" name="pet" maxlength="60" required><label for="email">Email (example.test only)</label><input id="email" name="email" type="email" placeholder="name@example.test" required></form>', "Enroll member");
  if (action === "purchase") modalForm("Record sample purchase", '<form data-form="purchase">' + nameField + '<label for="amount">Eligible purchase amount (USD)</label><input id="amount" name="amount" inputmode="decimal" placeholder="125.00" required><p class="hint">Earns ' + clinic().rewardPct + '% of eligible spend in fictional store credit.</p></form>', "Record purchase");
  if (action === "redeem") modalForm("Redeem reward balance", '<form data-form="redeem">' + nameField + '<label for="amount">Credit to use (USD)</label><input id="amount" name="amount" inputmode="decimal" placeholder="5.00" required><p class="hint">Limited to current member balance; redemption is simulated.</p></form>', "Redeem rewards");
  if (action === "free") modalForm("Use free-visit voucher", '<form data-form="free">' + nameField + '<p class="hint">One voucher will be consumed. No actual veterinary service is booked.</p></form>', "Use voucher");
  if (action === "manage") {
    const m = member(selectedId);
    if (!m) return notify("Member not found", true);
    modalForm("Manage " + m.name, '<form data-form="manage"><input type="hidden" name="memberId" value="' + html(m.id) +
      '"><p class="hint">Fictional record · ' + html(m.email) + ' · ' + html(m.pet) + '</p><label for="membership">Membership status</label><select id="membership" name="status">' +
      ["active", "canceled", "inactive"].map((s) => '<option value="' + s + '"' + (m.status === s ? " selected" : "") + ">" + s + "</option>").join("") +
      '</select><p class="hint">In production, Stripe subscription state would be authoritative.</p></form>', "Save status");
  }
  // Keep the form structure valid: buttons must be inside the form.
  const form = modalContent.querySelector("form");
  const actions = modalContent.querySelector(".dialog-actions");
  if (form && actions) form.appendChild(actions);
}
function centsFrom(value) {
  const raw = String(value).trim();
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(raw)) throw new Error("Enter a valid USD amount with up to two decimals");
  const parts = raw.split(".");
  const cents = Number(parts[0]) * 100 + Number((parts[1] || "").padEnd(2, "0"));
  if (cents <= 0 || cents > 10000000) throw new Error("Amount must be between $0.01 and $100,000");
  return cents;
}
function csvCell(value) {
  let s = String(value ?? "");
  // Prevent formula execution when users open CSV in Excel or similar spreadsheet apps.
  if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
function exportTransactions() {
  const rows = [["ID", "Date", "Clinic", "Member", "Type", "Amount USD"]];
  transactions().forEach((tx) => rows.push([
    tx.id, tx.createdAt, clinic().name, member(tx.memberId)?.name || "Unknown",
    kindLabel(tx.kind), (tx.amountCents / 100).toFixed(2)
  ]));
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "pawledger-demo-" + clinicId + ".csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  notify("Synthetic CSV exported");
}
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) { view = nav.dataset.view; search = ""; render(); return; }
  const actionBtn = event.target.closest("[data-action]");
  if (!actionBtn) return;
  const action = actionBtn.dataset.action;
  if (action === "close") return closeModal();
  if (action === "go-transactions") { view = "transactions"; render(); return; }
  if (action === "export") return exportTransactions();
  if (action === "reset") { state = createDemoState(); clinicId = "north"; view = "overview"; search = ""; render(); notify("Demo reset"); return; }
  if (["add", "purchase", "redeem", "free", "manage"].includes(action)) openDialog(action, actionBtn.dataset.member);
});
document.querySelector("#clinic").addEventListener("change", (event) => {
  if (state.clinics.some((c) => c.id === event.target.value)) clinicId = event.target.value;
  search = ""; render();
});
document.addEventListener("input", (event) => {
  if (event.target.id === "search") {
    search = event.target.value;
    // Update table without replacing the focused search box.
    const tbody = page.querySelector("tbody");
    if (tbody) tbody.innerHTML = memberRows(members().filter((m) => [m.name, m.pet, m.email].some((s) => s.toLowerCase().includes(search.toLowerCase()))));
  }
});
document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const args = Object.fromEntries(new FormData(form));
  try {
    const type = form.dataset.form;
    if (type === "add") {
      if (!String(args.email).toLowerCase().endsWith("@example.test")) throw new Error("Use fictional @example.test emails only");
      addMember(state, { clinicId, id: nowId("m"), name: args.name, pet: args.pet, email: args.email });
    }
    if (type === "purchase") recordPurchase(state, { clinicId, memberId: args.memberId, amountCents: centsFrom(args.amount), eventId: nowId("purchase") });
    if (type === "redeem") redeemPoints(state, { clinicId, memberId: args.memberId, amountCents: centsFrom(args.amount), eventId: nowId("redeem") });
    if (type === "free") redeemFreeVisit(state, { clinicId, memberId: args.memberId, eventId: nowId("voucher") });
    if (type === "manage") setMembership(state, { clinicId, memberId: args.memberId, status: args.status });
    if (type === "settings") setRewardsRule(state, { clinicId, rewardPct: Number(args.rate), buyX: Number(args.threshold) });
    closeModal(); render(); notify("Demo updated successfully");
  } catch (err) { notify(err.message || "Invalid operation", true); }
});
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
render();
