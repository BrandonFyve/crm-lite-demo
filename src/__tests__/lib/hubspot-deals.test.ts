import { getDealStages, searchDeals, getCachedDeals, startDealExport, checkExportStatus, pollExportUntilComplete, getTargetPipelines } from "@/lib/hubspot-deals";

const mockGetAll = jest.fn();
const mockDoSearch = jest.fn();
const mockFetch = jest.fn();

// Mock unstable_cache to just pass through the function
jest.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  unstable_cache: (fn: Function) => fn,
}));

jest.mock("@/lib/hubspot", () => ({
  hubspotClient: {
    accessToken: "test-token",
    crm: {
      pipelines: {
        pipelinesApi: {
          getAll: (objectType: string) => mockGetAll(objectType),
        },
      },
      deals: {
        searchApi: {
          doSearch: (payload: unknown) => mockDoSearch(payload),
        },
      },
    },
  },
  getHubSpotAccessToken: () => "test-token",
}));

// Mock global fetch
global.fetch = mockFetch as jest.Mock;

beforeEach(() => {
  mockGetAll.mockReset();
  mockDoSearch.mockReset();
  mockFetch.mockReset();
});

describe("getDealStages", () => {
  it("returns normalized stages from HubSpot", async () => {
    mockGetAll.mockResolvedValue({
      results: [
        {
          stages: [
            {
              id: "stage-b",
              label: "Stage B",
              displayOrder: 2,
              metadata: { probability: "50" },
            },
            {
              id: "stage-a",
              label: "Stage A",
              displayOrder: 1,
              metadata: { probability: "20" },
            },
          ],
        },
      ],
    });

    const result = await getDealStages();

    expect(mockGetAll).toHaveBeenCalledWith("deals");
    expect(result).toEqual([
      {
        id: "stage-a",
        label: "Stage A",
        displayOrder: 1,
        probability: 0.2,
      },
      {
        id: "stage-b",
        label: "Stage B",
        displayOrder: 2,
        probability: 0.5,
      },
    ]);
  });

  it("returns fallback stages when HubSpot request fails", async () => {
    mockGetAll.mockRejectedValue(new Error("HubSpot failure"));

    const result = await getDealStages();

    expect(result).toHaveLength(7);
    expect(result[0]).toMatchObject({ id: "appointmentscheduled" });
  });
});

describe("searchDeals", () => {
  it("returns serialized deal results", async () => {
    mockDoSearch.mockResolvedValue({
      results: [
        {
          id: "1",
          properties: {
            dealname: "Alpha",
            amount: null,
          },
        },
      ],
    });

    const result = await searchDeals({});

    expect(mockDoSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 100,
        properties: expect.arrayContaining(["dealname", "amount"]),
        sorts: ["-closedate"],
      })
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: "1",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        properties: {
          dealname: "Alpha",
          amount: "",
        },
      }),
    ]);
  });

  it("handles missing date fields from HubSpot", async () => {
    mockDoSearch.mockResolvedValue({
      results: [
        {
          id: "2",
          properties: {
            dealname: "No Dates",
            amount: null,
          },
        },
      ],
    });

    const result = await searchDeals({});

    expect(result[0].createdAt).toEqual(new Date(0));
    expect(result[0].updatedAt).toEqual(new Date(0));
    expect(result[0].properties).toEqual({
      dealname: "No Dates",
      amount: "",
    });
  });

  it("fetches all pages when HubSpot response is paginated", async () => {
    mockDoSearch
      .mockResolvedValueOnce({
        results: [
          {
            id: "1",
            properties: {
              dealname: "Page One",
            },
          },
        ],
        paging: {
          next: {
            after: "cursor-1",
          },
        },
      })
      .mockResolvedValueOnce({
        results: [
          {
            id: "2",
            properties: {
              dealname: "Page Two",
            },
          },
        ],
      });

    const result = await searchDeals({ limit: 1 });

    expect(mockDoSearch).toHaveBeenCalledTimes(2);
    const firstCallPayload = mockDoSearch.mock.calls[0][0];
    const secondCallPayload = mockDoSearch.mock.calls[1][0];

    expect(firstCallPayload.after).toBeUndefined();
    expect(secondCallPayload).toMatchObject({ after: "cursor-1" });

    expect(result.map((deal) => deal.id)).toEqual(["1", "2"]);
  });

  it("filters deals by specific pipeline IDs when no pipelineId provided", async () => {
    mockDoSearch.mockResolvedValue({
      results: [
        {
          id: "1",
          properties: {
            dealname: "Filtered Deal",
          },
        },
      ],
    });

    await searchDeals({});

    expect(mockDoSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "pipeline",
                operator: "EQ",
                value: "859017476",
              },
            ],
          },
          {
            filters: [
              {
                propertyName: "pipeline",
                operator: "EQ",
                value: "859172223",
              },
            ],
          },
          {
            filters: [
              {
                propertyName: "pipeline",
                operator: "EQ",
                value: "859283831",
              },
            ],
          },
        ],
      })
    );
  });

  it("filters deals by single pipeline ID when pipelineId provided", async () => {
    mockDoSearch.mockResolvedValue({
      results: [
        {
          id: "1",
          properties: {
            dealname: "Filtered Deal",
          },
        },
      ],
    });

    await searchDeals({ pipelineId: "859017476" });

    expect(mockDoSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "pipeline",
                operator: "EQ",
                value: "859017476",
              },
            ],
          },
        ],
      })
    );
  });
});

describe("getTargetPipelines", () => {
  it("returns target pipelines with stages", async () => {
    mockGetAll.mockResolvedValue({
      results: [
        {
          id: "859017476",
          label: "Pipeline 1",
          stages: [
            {
              id: "stage-1",
              label: "Stage 1",
              displayOrder: 0,
              metadata: { probability: "20" },
            },
          ],
        },
        {
          id: "859172223",
          label: "Pipeline 2",
          stages: [
            {
              id: "stage-2",
              label: "Stage 2",
              displayOrder: 0,
              metadata: { probability: "30" },
            },
          ],
        },
        {
          id: "999999999",
          label: "Other Pipeline",
          stages: [],
        },
      ],
    });

    const result = await getTargetPipelines();

    expect(mockGetAll).toHaveBeenCalledWith("deals");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "859017476",
      label: "Pipeline 1",
    });
    expect(result[0].stages).toHaveLength(1);
    expect(result[0].stages[0]).toMatchObject({
      id: "stage-1",
      label: "Stage 1",
      probability: 0.2,
    });
  });

  it("returns empty array when no target pipelines found", async () => {
    mockGetAll.mockResolvedValue({
      results: [
        {
          id: "999999999",
          label: "Other Pipeline",
          stages: [],
        },
      ],
    });

    const result = await getTargetPipelines();

    expect(result).toHaveLength(0);
  });

  it("returns empty array on error", async () => {
    mockGetAll.mockRejectedValue(new Error("HubSpot failure"));

    const result = await getTargetPipelines();

    expect(result).toHaveLength(0);
  });
});

describe("getCachedDeals", () => {
  it("calls searchDeals and returns cached results", async () => {
    mockDoSearch.mockResolvedValue({
      results: [
        {
          id: "1",
          properties: {
            dealname: "Cached Deal",
          },
        },
      ],
    });

    const result = await getCachedDeals({ limit: 42, sorts: ["-createdate"] });

    expect(mockDoSearch).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "1" });
  });
});

describe("startDealExport", () => {
  it("starts export and returns export ID and status URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "90151673",
        links: {
          status: "https://api-na1.hubspot.com/crm/v3/exports/export/async/tasks/90151673/status",
        },
      }),
    });

    const result = await startDealExport();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.hubapi.com/crm/v3/exports/export/async",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        }),
        body: expect.stringContaining('"exportType":"VIEW"'),
      })
    );

    expect(result).toEqual({
      id: "90151673",
      statusUrl: "https://api-na1.hubspot.com/crm/v3/exports/export/async/tasks/90151673/status",
    });
  });

  it("throws error when export request fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Invalid request" }),
    });

    await expect(startDealExport()).rejects.toThrow("Failed to start export");
  });

  it("includes correct export properties in request body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "90151673",
        links: { status: "https://api.hubapi.com/status" },
      }),
    });

    await startDealExport();

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody).toMatchObject({
      exportType: "VIEW",
      format: "XLS",
      objectType: "DEAL",
      language: "EN",
      exportInternalValuesOptions: ["NAMES"],
    });
    expect(callBody.objectProperties).toContain("dealname");
    expect(callBody.objectProperties).toContain("amount");
    expect(callBody.exportName).toMatch(/^deals-export-/);
  });
});

describe("checkExportStatus", () => {
  it("returns export status when complete", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "COMPLETE",
        result: "https://example.com/export.xls",
        startedAt: "2025-11-18T14:57:35.354Z",
        completedAt: "2025-11-18T14:57:48.817Z",
      }),
    });

    const result = await checkExportStatus("90151673");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.hubapi.com/crm/v3/exports/export/async/tasks/90151673/status",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );

    expect(result).toEqual({
      status: "COMPLETE",
      result: "https://example.com/export.xls",
      startedAt: "2025-11-18T14:57:35.354Z",
      completedAt: "2025-11-18T14:57:48.817Z",
    });
  });

  it("returns export status when in progress", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "IN_PROGRESS",
      }),
    });

    const result = await checkExportStatus("90151673");

    expect(result.status).toBe("IN_PROGRESS");
  });

  it("throws error when status check fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Export not found" }),
    });

    await expect(checkExportStatus("90151673")).rejects.toThrow("Failed to check export status");
  });
});

describe("pollExportUntilComplete", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns download URL when export completes immediately", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "COMPLETE",
        result: "https://example.com/export.xls",
      }),
    });

    const promise = pollExportUntilComplete("90151673");
    jest.advanceTimersByTime(0);
    const result = await promise;

    expect(result).toBe("https://example.com/export.xls");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("polls until export completes", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "IN_PROGRESS" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "IN_PROGRESS" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "COMPLETE",
          result: "https://example.com/export.xls",
        }),
      });

    const promise = pollExportUntilComplete("90151673");
    
    // Process initial call (immediate check)
    await Promise.resolve();
    await jest.runOnlyPendingTimersAsync();
    
    // Wait 2 seconds and process first poll
    jest.advanceTimersByTime(2000);
    await jest.runOnlyPendingTimersAsync();
    
    // Wait 3 seconds and process second poll
    jest.advanceTimersByTime(3000);
    await jest.runOnlyPendingTimersAsync();
    
    // Wait 3 more seconds and process third poll (should complete)
    jest.advanceTimersByTime(3000);
    await jest.runOnlyPendingTimersAsync();
    
    const result = await promise;

    expect(result).toBe("https://example.com/export.xls");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  }, 10000);

  it("throws error when export fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "FAILED" }),
    });

    const promise = pollExportUntilComplete("90151673");
    jest.advanceTimersByTime(0);
    
    await expect(promise).rejects.toThrow("Export failed");
  });

  it("times out after 5 minutes", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "IN_PROGRESS" }),
    });

    const promise = pollExportUntilComplete("90151673");
    
    // Process initial call
    await Promise.resolve();
    jest.advanceTimersByTime(0);
    await Promise.resolve();
    
    // Wait 2 seconds
    jest.advanceTimersByTime(2000);
    await Promise.resolve();
    await Promise.resolve();
    
    // Advance time to just before timeout (remaining time: 5 minutes - 2 seconds = 298 seconds)
    jest.advanceTimersByTime(298000);
    await Promise.resolve();
    await Promise.resolve();
    
    // Advance past timeout (1 more second)
    jest.advanceTimersByTime(2000);
    await Promise.resolve();
    await Promise.resolve();
    
    await expect(promise).rejects.toThrow("Export timed out after 5 minutes");
  });
});
