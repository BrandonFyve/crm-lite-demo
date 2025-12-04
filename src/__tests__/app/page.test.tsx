/** @jest-environment node */
import type { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/deals";

jest.mock("@/lib/hubspot-deals", () => ({
  searchDeals: jest.fn(),
  getDealStages: jest.fn(),
  getCachedDeals: jest.fn(),
}));

jest.mock("@/lib/hubspot-owners", () => ({
  getOwners: jest.fn(),
}));

jest.mock("@/components/DealsViewContainer", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

import { getDealStages, getCachedDeals } from "@/lib/hubspot-deals";
import { getOwners } from "@/lib/hubspot-owners";
import { auth } from "@clerk/nextjs/server";

const mockedGetCachedDeals = jest.mocked(getCachedDeals);
const mockedGetDealStages = jest.mocked(getDealStages);
const mockedGetOwners = jest.mocked(getOwners);
const mockedAuth = jest.mocked(auth);

const mockDeals: SimplePublicObjectWithAssociations[] = [
  {
    id: "1",
    properties: {
      dealname: "First",
      dealstage: "stage-a",
    },
    createdAt: "",
    updatedAt: "",
    archived: false,
    archivedAt: null,
    associations: {},
  },
];

const mockStages = [
  { id: "stage-a", label: "Stage A", displayOrder: 1, probability: 0.2 },
  { id: "stage-b", label: "Stage B", displayOrder: 2, probability: 0.4 },
];

const mockOwners = [
  { id: "1", email: "owner1@test.com", firstName: "John", lastName: "Doe" },
  { id: "2", email: "owner2@test.com", firstName: "Jane", lastName: "Smith" },
];

beforeAll(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => mockStages,
  }) as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetOwners.mockResolvedValue(mockOwners);
});

describe("Home page server component", () => {
  it("uses shared helpers when the user is authenticated", async () => {
    mockedAuth.mockResolvedValue({ userId: "user_123" });
    mockedGetDealStages.mockResolvedValue(mockStages);
    mockedGetOwners.mockResolvedValue(mockOwners);
    mockedGetCachedDeals.mockResolvedValue(mockDeals);

    const { default: Home } = await import("@/app/page");

    await Home();

    expect(mockedGetDealStages).toHaveBeenCalledTimes(1);
    expect(mockedGetOwners).toHaveBeenCalledTimes(1);
    expect(mockedGetCachedDeals).toHaveBeenCalledTimes(1);
    expect(mockedGetCachedDeals).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it("skips deal search when the user is not authenticated", async () => {
    mockedAuth.mockResolvedValue({ userId: null });
    mockedGetDealStages.mockResolvedValue(mockStages);
    mockedGetOwners.mockResolvedValue(mockOwners);

    const { default: Home } = await import("@/app/page");

    await Home();

    expect(mockedGetDealStages).toHaveBeenCalledTimes(1);
    expect(mockedGetOwners).toHaveBeenCalledTimes(1);
    expect(mockedGetCachedDeals).not.toHaveBeenCalled();
  });
});

