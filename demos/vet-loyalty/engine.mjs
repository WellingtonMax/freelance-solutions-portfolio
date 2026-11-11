/**
 * PawLedger domain engine — entirely fictional data, browser-only demo.
 * Monetary values use integer cents. Reward points represent cents of credit.
 * This is NOT a persistence, authentication, or payment service.
 */
export function createDemoState() {
  return {
    clinics: [
      { id: "north", name: "Northstar Animal Hospital", location: "Portland, OR", rewardPct: 5, buyX: 4 },
      { id: "harbor", name: "Harbor Pet Care", location: "Charleston, SC", rewardPct: 8, buyX: 5 }
    ],
    members: [
      { id: "m101", clinicId: "north", name: "Olivia Parker", pet: "Luna", email: "olivia@example.test", status: "active", promoProgress: 2, freeCredits: 0 },
      { id: "m102", clinicId: "north", name: "James Wilson", pet: "Cooper", email: "james@example.test", status: "active", promoProgress: 3, freeCredits: 1 },
      { id: "m103", clinicId: "north", name: "Mia Reynolds", pet: "Mochi", email: "mia@example.test", status: "canceled", promoProgress: 1, freeCredits: 0 },
      { id: "m104", clinicId: "north", name: "Ethan Brooks", pet: "Max", email: "ethan@example.test", status: "inactive", promoProgress: 0, freeCredits: 0 },
      { id: "m201", clinicId: "harbor", name: "Sophia Bennett", pet: "Bella", email: "sophia@example.test", status: "active", promoProgress: 4, freeCredits: 0 },
      { id: "m202", clinicId: "harbor", name: "Noah Davis", pet: "Archie", email: "noah@example.test", status: "active", promoProgress: 1, freeCredits: 1 },
      { id: "m203", clinicId: "harbor", name: "Ava Collins", pet: "Nala", email: "ava@example.test", status: "inactive", promoProgress: 0, freeCredits: 0 }
    ],
    transactions: [
      { id: "demo-01", clinicId: "north", memberId: "m101", kind: "purchase", amountCents: 12400, createdAt: "2026-11-06" },
      { id: "demo-02", clinicId: "north", memberId: "m102", kind: "purchase", amountCents: 8700, createdAt: "2026-11-05" },
      { id: "demo-03", clinicId: "north", memberId: "m102", kind: "redemption", amountCents: 400, createdAt: "2026-11-04" },
      { id: "demo-04", clinicId: "north", memberId: "m103", kind: "purchase", amountCents: 7400, createdAt: "2026-11-03" },
      { id: "demo-05", clinicId: "harbor", memberId: "m201", kind: "purchase", amountCents: 9900, createdAt: "2026-11-05" },
      { id: "demo-06", clinicId: "harbor", memberId: "m202", kind: "purchase", amountCents: 14500, createdAt: "2026-11-02" }
    ],
    ledger: [
      { id: "led-01", clinicId: "north", memberId: "m101", txId: "demo-01", points: 620 },
      { id: "led-02", clinicId: "north", memberId: "m102", txId: "demo-02", points: 435 },
      { id: "led-03", clinicId: "north", memberId: "m102", txId: "demo-03", points: -400 },
      { id: "led-04", clinicId: "north", memberId: "m103", txId: "demo-04", points: 370 },
      { id: "led-05", clinicId: "harbor", memberId: "m201", txId: "demo-05", points: 792 },
      { id: "led-06", clinicId: "harbor", memberId: "m202", txId: "demo-06", points: 1160 }
    ]
  };
}

function fail(message) { throw new Error(message); }
function assertId(value, field) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{3,72}$/.test(value)) fail("Invalid " + field);
}
function clinicFor(state, clinicId) {
  const clinic = state.clinics.find((c) => c.id === clinicId);
  if (!clinic) fail("Clinic not found");
  return clinic;
}
function memberFor(state, clinicId, memberId) {
  const member = state.members.find((m) => m.id === memberId && m.clinicId === clinicId);
  if (!member) fail("Member not found in selected clinic");
  return member;
}
function requireActive(member) {
  if (member.status !== "active") fail("An active membership is required");
}
function requireAmount(cents) {
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 10000000) fail("Amount must be a positive whole number of cents, no more than $100,000");
}
function safeText(value, field, max = 100) {
  if (typeof value !== "string" || value.trim().length < 2 || value.trim().length > max) fail("Invalid " + field);
  return value.trim();
}
function uniqueEvent(state, eventId, clinicId, memberId, kind, amountCents) {
  assertId(eventId, "event ID");
  const prior = state.transactions.find((t) => t.id === eventId);
  if (!prior) return null;
  if (prior.clinicId !== clinicId || prior.memberId !== memberId || prior.kind !== kind || prior.amountCents !== amountCents) {
    fail("Event ID already used for a different transaction");
  }
  return prior;
}
function recordEvent(state, event) {
  state.transactions.push(event);
  return event;
}
export function memberBalance(state, clinicId, memberId) {
  memberFor(state, clinicId, memberId);
  return state.ledger.filter((e) => e.clinicId === clinicId && e.memberId === memberId).reduce((sum, e) => sum + e.points, 0);
}
export function recordPurchase(state, { clinicId, memberId, amountCents, eventId }) {
  const clinic = clinicFor(state, clinicId);
  const member = memberFor(state, clinicId, memberId);
  requireAmount(amountCents);
  const existing = uniqueEvent(state, eventId, clinicId, memberId, "purchase", amountCents);
  if (existing) return existing;
  requireActive(member);
  const earned = Math.floor(amountCents * clinic.rewardPct / 100);
  const event = recordEvent(state, { id: eventId, clinicId, memberId, kind: "purchase", amountCents, createdAt: new Date().toISOString().slice(0, 10) });
  state.ledger.push({ id: "led-" + eventId, clinicId, memberId, txId: eventId, points: earned });
  member.promoProgress += 1;
  if (member.promoProgress >= clinic.buyX) {
    member.promoProgress = 0;
    member.freeCredits += 1;
  }
  return event;
}
export function redeemPoints(state, { clinicId, memberId, amountCents, eventId }) {
  clinicFor(state, clinicId);
  const member = memberFor(state, clinicId, memberId);
  requireAmount(amountCents);
  const existing = uniqueEvent(state, eventId, clinicId, memberId, "redemption", amountCents);
  if (existing) return existing;
  requireActive(member);
  if (memberBalance(state, clinicId, memberId) < amountCents) fail("Insufficient rewards balance");
  const event = recordEvent(state, { id: eventId, clinicId, memberId, kind: "redemption", amountCents, createdAt: new Date().toISOString().slice(0, 10) });
  state.ledger.push({ id: "led-" + eventId, clinicId, memberId, txId: eventId, points: -amountCents });
  return event;
}
export function redeemFreeVisit(state, { clinicId, memberId, eventId }) {
  clinicFor(state, clinicId);
  const member = memberFor(state, clinicId, memberId);
  const existing = uniqueEvent(state, eventId, clinicId, memberId, "free-visit", 0);
  if (existing) return existing;
  requireActive(member);
  if (member.freeCredits < 1) fail("No free visit credit available");
  member.freeCredits -= 1;
  return recordEvent(state, { id: eventId, clinicId, memberId, kind: "free-visit", amountCents: 0, createdAt: new Date().toISOString().slice(0, 10) });
}
export function addMember(state, { clinicId, name, pet, email, id }) {
  clinicFor(state, clinicId);
  assertId(id, "member ID");
  if (state.members.some((m) => m.id === id)) fail("Member ID already exists");
  name = safeText(name, "name");
  pet = safeText(pet, "pet", 60);
  email = safeText(email, "email", 150);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Invalid email");
  const m = { id, clinicId, name, pet, email, status: "active", promoProgress: 0, freeCredits: 0 };
  state.members.push(m);
  return m;
}
export function setMembership(state, { clinicId, memberId, status }) {
  if (!["active", "canceled", "inactive"].includes(status)) fail("Invalid membership state");
  const member = memberFor(state, clinicId, memberId);
  member.status = status;
  return member;
}
export function setRewardsRule(state, { clinicId, rewardPct, buyX }) {
  const clinic = clinicFor(state, clinicId);
  if (!Number.isSafeInteger(rewardPct) || rewardPct < 0 || rewardPct > 20) fail("Rewards percentage must be 0–20");
  if (!Number.isSafeInteger(buyX) || buyX < 2 || buyX > 20) fail("Buy-X threshold must be 2–20");
  clinic.rewardPct = rewardPct;
  clinic.buyX = buyX;
  return clinic;
}
export function clinicMetrics(state, clinicId) {
  clinicFor(state, clinicId);
  const members = state.members.filter((m) => m.clinicId === clinicId);
  const tx = state.transactions.filter((t) => t.clinicId === clinicId);
  return {
    memberCount: members.length,
    activeCount: members.filter((m) => m.status === "active").length,
    revenueCents: tx.filter((t) => t.kind === "purchase").reduce((s, t) => s + t.amountCents, 0),
    outstandingCents: members.reduce((s, m) => s + memberBalance(state, clinicId, m.id), 0),
    redemptionsCents: tx.filter((t) => t.kind === "redemption").reduce((s, t) => s + t.amountCents, 0)
  };
}
