/** @jest-environment node */

import { searchTickets, getTicketStages } from "@/lib/hubspot-tickets";

const mockDoSearch = jest.fn();
const mockGetAll = jest.fn();

jest.mock("@/lib/hubspot", () => ({
  hubspotClient: {
    crm: {
      tickets: {
        searchApi: {
          doSearch: (payload: unknown) => mockDoSearch(payload),
        },
      },
      pipelines: {
        pipelinesApi: {
          getAll: (objectType: string) => mockGetAll(objectType),
        },
      },
    },
  },
}));

beforeEach(() => {
  mockDoSearch.mockReset();
  mockGetAll.mockReset();
});

describe("searchTickets", () => {
  it("passes owner filter and returns normalized tickets", async () => {
    mockDoSearch.mockResolvedValue({
      results: [
        {
          id: "ticket-1",
          properties: {
            subject: "Example",
            hubspot_owner_id: null,
          },
        },
      ],
    });

    const results = await searchTickets({ ownerId: "123" });

    expect(mockDoSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "hubspot_owner_id",
                operator: "EQ",
                value: "123",
              },
            ],
          },
        ],
        limit: 100,
        sorts: ["-createdate"],
      }),
    );

    expect(results).toEqual([
      expect.objectContaining({
        id: "ticket-1",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        properties: {
          subject: "Example",
          hubspot_owner_id: "",
        },
      }),
    ]);
  });

  it("supports no owner filter", async () => {
    mockDoSearch.mockResolvedValue({ results: [] });

    await searchTickets({ ownerId: null });

    expect(mockDoSearch).toHaveBeenCalledWith(
      expect.objectContaining({ filterGroups: [] }),
    );
  });

  it("normalizes tickets when dates are missing", async () => {
    mockDoSearch.mockResolvedValue({
      results: [
        {
          id: "ticket-2",
          properties: {
            subject: "No Dates",
          },
        },
      ],
    });

    const results = await searchTickets({ ownerId: undefined });

    expect(results[0].createdAt).toEqual(new Date(0));
    expect(results[0].updatedAt).toEqual(new Date(0));
    expect(results[0].properties).toEqual({
      subject: "No Dates",
    });
  });
});

describe("getTicketStages", () => {
  it("returns stages from HubSpot", async () => {
    mockGetAll.mockResolvedValue({
      results: [
        {
          stages: [
            { id: "1", label: "Stage 1" },
            { id: "2", label: "Stage 2" },
          ],
        },
      ],
    });

    const stages = await getTicketStages();

    expect(mockGetAll).toHaveBeenCalledWith("ticket");
    expect(stages).toEqual([
      { id: "1", label: "Stage 1", displayOrder: undefined },
      { id: "2", label: "Stage 2", displayOrder: undefined },
    ]);
  });

  it("returns empty array when HubSpot call fails", async () => {
    mockGetAll.mockRejectedValue(new Error("HubSpot failure"));

    const stages = await getTicketStages();

    expect(stages).toEqual([]);
  });
});

