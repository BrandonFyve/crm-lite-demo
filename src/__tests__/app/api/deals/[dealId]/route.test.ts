/** @jest-environment node */

import { PATCH } from "@/app/api/deals/[dealId]/route";
import { NextRequest } from "next/server";

const mockUpdate = jest.fn();
const mockGetDealStages = jest.fn();

jest.mock("@/lib/hubspot", () => ({
  hubspotClient: {
    crm: {
      deals: {
        basicApi: {
          update: (...args: unknown[]) => mockUpdate(...args),
        },
      },
    },
  },
}));

jest.mock("@/lib/hubspot-deals", () => ({
  getDealStages: (...args: unknown[]) => mockGetDealStages(...args),
}));

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(() => Promise.resolve({ userId: "user-123" })),
}));

describe("deals [dealId] route - PATCH", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockGetDealStages.mockReset();
    mockGetDealStages.mockResolvedValue([
      { id: "stage-1", label: "Stage 1", displayOrder: 0, probability: 0.5 },
      { id: "stage-2", label: "Stage 2", displayOrder: 1, probability: 0.8 },
    ]);
  });

  it("rejects invalid dealstage values", async () => {
    const request = new NextRequest("http://localhost:3000/api/deals/deal-1", {
      method: "PATCH",
      body: JSON.stringify({
        dealstage: "invalid-stage-id",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ dealId: "deal-1" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain("Invalid dealstage");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("allows valid dealstage values", async () => {
    mockUpdate.mockResolvedValue({
      id: "deal-1",
      properties: { dealstage: "stage-1" },
    });

    const request = new NextRequest("http://localhost:3000/api/deals/deal-1", {
      method: "PATCH",
      body: JSON.stringify({
        dealstage: "stage-1",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ dealId: "deal-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith("deal-1", {
      properties: { dealstage: "stage-1" },
    });
  });

  it("excludes empty dealstage from update", async () => {
    mockUpdate.mockResolvedValue({
      id: "deal-1",
      properties: { dealname: "Updated Deal" },
    });

    const request = new NextRequest("http://localhost:3000/api/deals/deal-1", {
      method: "PATCH",
      body: JSON.stringify({
        dealname: "Updated Deal",
        dealstage: "",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ dealId: "deal-1" }),
    });

    expect(response.status).toBe(200);
    // Empty dealstage should be excluded
    expect(mockUpdate).toHaveBeenCalledWith("deal-1", {
      properties: { dealname: "Updated Deal" },
    });
  });

  it("allows updates without dealstage", async () => {
    mockUpdate.mockResolvedValue({
      id: "deal-1",
      properties: { dealname: "Updated Deal" },
    });

    const request = new NextRequest("http://localhost:3000/api/deals/deal-1", {
      method: "PATCH",
      body: JSON.stringify({
        dealname: "Updated Deal",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ dealId: "deal-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith("deal-1", {
      properties: { dealname: "Updated Deal" },
    });
  });
});

