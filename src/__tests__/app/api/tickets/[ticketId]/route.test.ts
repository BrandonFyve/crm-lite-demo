/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/tickets/[ticketId]/route";

const mockGetById = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/lib/hubspot", () => ({
  hubspotClient: {
    crm: {
      tickets: {
        basicApi: {
          getById: (...args: unknown[]) => mockGetById(...args),
          update: (...args: unknown[]) => mockUpdate(...args),
        },
      },
    },
  },
}));

describe("tickets API route", () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockUpdate.mockReset();
  });

  it("returns 400 for invalid ticket ID", async () => {
    const response = await GET(new NextRequest("http://example.com"), {
      params: Promise.resolve({ ticketId: "" }),
    });

    expect(response.status).toBe(400);
  });

  it("validates PATCH payload", async () => {
    const request = new NextRequest("http://example.com", {
      method: "PATCH",
      body: JSON.stringify({ hs_pipeline_stage: "" }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ ticketId: "123" }),
    });

    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

