/** @jest-environment node */

import { GET } from "@/app/api/tickets/stages/route";

const mockGetTicketStages = jest.fn();

jest.mock("@/lib/hubspot-tickets", () => ({
  getTicketStages: () => mockGetTicketStages(),
}));

describe("tickets stages route", () => {
  beforeEach(() => {
    mockGetTicketStages.mockReset();
  });

  it("returns 404 when no stages", async () => {
    mockGetTicketStages.mockResolvedValue([]);

    const response = await GET();
    expect(response.status).toBe(404);
  });
});

