import { fetchOwners } from "@/services/owners";

describe("fetchOwners", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns owners when response is ok", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue([{ id: "1" }]),
    } as unknown as Response;

    jest.spyOn(global, "fetch" as const).mockResolvedValue(mockResponse);

    const owners = await fetchOwners();
    expect(fetch).toHaveBeenCalledWith("/api/owners");
    expect(owners).toEqual([{ id: "1" }]);
  });

  it("throws when response is not ok", async () => {
    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Boom" }),
    } as unknown as Response;

    jest.spyOn(global, "fetch" as const).mockResolvedValue(mockResponse);

    await expect(fetchOwners()).rejects.toThrow("Boom");
  });

  it("throws generic error if body cannot be parsed", async () => {
    const mockResponse = {
      ok: false,
      json: jest.fn().mockRejectedValue(new Error("parse error")),
    } as unknown as Response;

    jest.spyOn(global, "fetch" as const).mockResolvedValue(mockResponse);

    await expect(fetchOwners()).rejects.toThrow("Failed to load owners");
  });
});

