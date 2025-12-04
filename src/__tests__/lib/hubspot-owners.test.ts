/** @jest-environment node */

import { getOwners, findOwnerIdByEmail } from "@/lib/hubspot-owners";

const mockGetPage = jest.fn();

// Mock unstable_cache to just pass through the function
jest.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  unstable_cache: (fn: Function) => fn,
}));

jest.mock("@/lib/hubspot", () => ({
  hubspotClient: {
    crm: {
      owners: {
        ownersApi: {
          getPage: () => mockGetPage(),
        },
      },
    },
  },
}));

beforeEach(() => {
  mockGetPage.mockReset();
});

describe("getOwners", () => {
  it("returns normalized owners", async () => {
    mockGetPage.mockResolvedValue({
      results: [
        {
          id: 1,
          email: "owner@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
          archived: false,
        },
      ],
    });

    const owners = await getOwners();

    expect(mockGetPage).toHaveBeenCalled();
    expect(owners).toEqual([
      {
        id: "1",
        email: "owner@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        archived: false,
      },
    ]);
  });

  it("returns empty array when HubSpot call fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetPage.mockRejectedValue(new Error("HubSpot failure"));

    await expect(getOwners()).resolves.toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching HubSpot owners:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});

describe("findOwnerIdByEmail", () => {
  it("finds the owner id case-insensitively", async () => {
    mockGetPage.mockResolvedValue({
      results: [
        { id: 7, email: "Agent@example.com" },
      ],
    });

    await expect(findOwnerIdByEmail("agent@example.com")).resolves.toBe("7");
  });

  it("returns null when no match is found", async () => {
    mockGetPage.mockResolvedValue({ results: [] });

    await expect(findOwnerIdByEmail("missing@example.com")).resolves.toBeNull();
  });
});

