import test from "node:test";
import assert from "node:assert/strict";
import { createDemoState, memberBalance, recordPurchase, redeemPoints, redeemFreeVisit, addMember, setMembership, setRewardsRule, clinicMetrics } from "./engine.mjs";

test("purchases earn cents precisely, per clinic configuration", () => {
  const s = createDemoState();
  const before = memberBalance(s, "north", "m101");
  recordPurchase(s, { clinicId: "north", memberId: "m101", amountCents: 1999, eventId: "purchase-a" });
  assert.equal(memberBalance(s, "north", "m101"), before + 99);
  assert.equal(s.members.find((m) => m.id === "m101").promoProgress, 3);
});

test("duplicate transaction IDs do not double credit, even on retries", () => {
  const s = createDemoState();
  const args = { clinicId: "north", memberId: "m101", amountCents: 3500, eventId: "purchase-b" };
  recordPurchase(s, args);
  const snapshot = JSON.stringify(s);
  recordPurchase(s, args);
  assert.equal(JSON.stringify(s), snapshot);
  assert.throws(() => recordPurchase(s, { ...args, amountCents: 3501 }), /already used/);
});

test("tenant boundary blocks reading and spending another hospital's rewards", () => {
  const s = createDemoState();
  assert.throws(() => memberBalance(s, "north", "m201"), /not found/);
  assert.throws(() => redeemPoints(s, { clinicId: "north", memberId: "m201", amountCents: 10, eventId: "redeem-a" }), /not found/);
  assert.throws(() => setMembership(s, { clinicId: "north", memberId: "m201", status: "active" }), /not found/);
});

test("redemptions subtract from ledger, never allow negative balances", () => {
  const s = createDemoState();
  redeemPoints(s, { clinicId: "north", memberId: "m101", amountCents: 300, eventId: "redeem-b" });
  assert.equal(memberBalance(s, "north", "m101"), 320);
  assert.throws(() => redeemPoints(s, { clinicId: "north", memberId: "m101", amountCents: 321, eventId: "redeem-c" }), /Insufficient/);
});

test("buy X get one promotion awards a voucher only at threshold", () => {
  const s = createDemoState();
  recordPurchase(s, { clinicId: "north", memberId: "m102", amountCents: 1000, eventId: "purchase-c" });
  const member = s.members.find((m) => m.id === "m102");
  assert.equal(member.promoProgress, 0);
  assert.equal(member.freeCredits, 2);
  redeemFreeVisit(s, { clinicId: "north", memberId: "m102", eventId: "free-visit-a" });
  assert.equal(member.freeCredits, 1);
  assert.throws(() => redeemFreeVisit(s, { clinicId: "north", memberId: "m101", eventId: "free-visit-b" }), /No free visit/);
});

test("inactive or canceled members cannot accrue or redeem", () => {
  const s = createDemoState();
  assert.throws(() => recordPurchase(s, { clinicId: "north", memberId: "m103", amountCents: 1000, eventId: "purchase-d" }), /active/);
  assert.throws(() => redeemPoints(s, { clinicId: "north", memberId: "m103", amountCents: 10, eventId: "redeem-d" }), /active/);
  assert.throws(() => redeemFreeVisit(s, { clinicId: "north", memberId: "m103", eventId: "free-visit-c" }), /active/);
});

test("new members and rules are validated without cross-tenant changes", () => {
  const s = createDemoState();
  addMember(s, { id: "m300", clinicId: "north", name: "Casey Morgan", pet: "Scout", email: "casey@example.test" });
  assert.equal(clinicMetrics(s, "north").memberCount, 5);
  assert.throws(() => addMember(s, { id: "m300", clinicId: "harbor", name: "Other Person", pet: "Spot", email: "other@example.test" }), /already exists/);
  assert.throws(() => setRewardsRule(s, { clinicId: "harbor", rewardPct: 100, buyX: 4 }), /0–20/);
  setRewardsRule(s, { clinicId: "north", rewardPct: 10, buyX: 3 });
  assert.equal(s.clinics.find((c) => c.id === "harbor").rewardPct, 8);
});

test("ledger summary aggregates purchases, balances and redemption separately", () => {
  const s = createDemoState();
  const m = clinicMetrics(s, "north");
  assert.deepEqual(m, { memberCount: 4, activeCount: 2, revenueCents: 28500, outstandingCents: 1025, redemptionsCents: 400 });
});

test("amount validations and event ID collisions reject invalid operations", () => {
  const s = createDemoState();
  assert.throws(() => recordPurchase(s, { clinicId: "north", memberId: "m101", amountCents: 0, eventId: "invalid-a" }), /Amount/);
  assert.throws(() => recordPurchase(s, { clinicId: "north", memberId: "m101", amountCents: 1.4, eventId: "invalid-b" }), /Amount/);
  assert.throws(() => redeemPoints(s, { clinicId: "north", memberId: "m101", amountCents: -1, eventId: "invalid-c" }), /Amount/);
  assert.throws(() => redeemPoints(s, { clinicId: "north", memberId: "m101", amountCents: 5, eventId: "demo-01" }), /already used/);
});
