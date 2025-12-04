import { fetchDealStages } from "@/services/deals";

describe("fetchDealStages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns stages when response is ok", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue([{ id: "stage-a" }]),
    } as unknown as Response;

    jest.spyOn(global, "fetch" as const).mockResolvedValue(mockResponse);

    const stages = await fetchDealStages();
    expect(fetch).toHaveBeenCalledWith("/api/deals/stages");
    expect(stages).toEqual([{ id: "stage-a" }]);
  });

  it("throws when response is not ok", async () => {
    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Failed" }),
    } as unknown as Response;

    jest.spyOn(global, "fetch" as const).mockResolvedValue(mockResponse);

    await expect(fetchDealStages()).rejects.toThrow("Failed");
  });

  it("throws generic error if body cannot be parsed", async () => {
    const mockResponse = {
      ok: false,
      json: jest.fn().mockRejectedValue(new Error("parse error")),
    } as unknown as Response;

    jest.spyOn(global, "fetch" as const).mockResolvedValue(mockResponse);

    await expect(fetchDealStages()).rejects.toThrow("Failed to load deal stages");
  });
});

