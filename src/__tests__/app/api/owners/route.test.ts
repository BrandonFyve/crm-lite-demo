/** @jest-environment node */

import { GET } from "@/app/api/owners/route";

const mockGetOwners = jest.fn();

jest.mock("@/lib/hubspot-owners", () => ({
  getOwners: () => mockGetOwners(),
}));

describe("owners route", () => {
  beforeEach(() => {
    mockGetOwners.mockReset();
  });

  it("returns validation error response from schema mismatch", async () => {
    mockGetOwners.mockResolvedValue([{ id: "", email: "invalid" }]);

    const response = await GET();
    expect(response.status).toBe(500);
  });
});

