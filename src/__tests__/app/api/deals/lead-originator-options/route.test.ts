/** @jest-environment node */

// This route is disabled for the generic demo branch because it depended on a
// custom HubSpot deal property (`lead_originator_new`). Tests are retained as
// a placeholder to avoid Jest errors but do not execute any logic.

describe("lead originator options route (demo branch)", () => {
  it("is intentionally disabled in this demo branch", () => {
    expect(true).toBe(true);
  });
});
