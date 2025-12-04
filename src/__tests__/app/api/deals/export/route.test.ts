/** @jest-environment node */

import { POST } from "@/app/api/deals/export/route";
import { NextRequest } from "next/server";

const mockStartDealExport = jest.fn();
const mockPollExportUntilComplete = jest.fn();

jest.mock("@/lib/hubspot-deals", () => ({
  startDealExport: (...args: unknown[]) => mockStartDealExport(...args),
  pollExportUntilComplete: (...args: unknown[]) => mockPollExportUntilComplete(...args),
}));

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(() => Promise.resolve({ userId: "user-123" })),
}));

describe("deals export route", () => {
  beforeEach(() => {
    mockStartDealExport.mockReset();
    mockPollExportUntilComplete.mockReset();
  });

  it("returns download URL when export completes", async () => {
    mockStartDealExport.mockResolvedValue({ id: "90151673" });
    mockPollExportUntilComplete.mockResolvedValue("https://example.com/export.xls");

    const request = new NextRequest("http://localhost:3000/api/deals/export", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ downloadUrl: "https://example.com/export.xls" });
    expect(mockStartDealExport).toHaveBeenCalled();
    expect(mockPollExportUntilComplete).toHaveBeenCalledWith("90151673");
  });

  it("returns 500 when export fails", async () => {
    mockStartDealExport.mockResolvedValue({ id: "90151673" });
    mockPollExportUntilComplete.mockRejectedValue(new Error("Export failed"));

    const request = new NextRequest("http://localhost:3000/api/deals/export", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toEqual({ error: "Export failed" });
  });

  it("returns 500 when export times out", async () => {
    mockStartDealExport.mockResolvedValue({ id: "90151673" });
    mockPollExportUntilComplete.mockRejectedValue(
      new Error("Export timed out after 5 minutes")
    );

    const request = new NextRequest("http://localhost:3000/api/deals/export", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toContain("timed out");
  });
});

