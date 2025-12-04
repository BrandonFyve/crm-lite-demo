/** @jest-environment node */
jest.mock("@/lib/hubspot-tickets", () => ({
  searchTickets: jest.fn(),
  getTicketStages: jest.fn(),
}));

jest.mock("@/lib/hubspot-owners", () => ({
  findOwnerIdByEmail: jest.fn(),
}));

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

import { searchTickets, getTicketStages } from "@/lib/hubspot-tickets";
import { findOwnerIdByEmail } from "@/lib/hubspot-owners";
import { auth, currentUser } from "@clerk/nextjs/server";

const mockedSearchTickets = jest.mocked(searchTickets);
const mockedGetTicketStages = jest.mocked(getTicketStages);
const mockedFindOwnerIdByEmail = jest.mocked(findOwnerIdByEmail);
const mockedAuth = jest.mocked(auth);
const mockedCurrentUser = jest.mocked(currentUser);

const mockTickets = [
  {
    id: "ticket-1",
    properties: {
      subject: "Example ticket",
      hs_pipeline_stage: "1",
    },
    createdAt: "",
    updatedAt: "",
    archived: false,
    archivedAt: null,
    associations: {},
  },
];

const mockStages = [
  { id: "1", label: "Stage 1" },
  { id: "2", label: "Stage 2" },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Tickets page server component", () => {
  it("requests tickets via shared helpers when the user email resolves to an owner", async () => {
    mockedAuth.mockResolvedValue({ userId: "user_123" });
    mockedCurrentUser.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "agent@example.com" },
    } as never);
    mockedFindOwnerIdByEmail.mockResolvedValue("987");
    mockedGetTicketStages.mockResolvedValue(mockStages);
    mockedSearchTickets.mockResolvedValue(mockTickets);

    const { default: TicketsPage } = await import("@/app/tickets/page");

    await TicketsPage();

    expect(mockedGetTicketStages).toHaveBeenCalledTimes(1);
    expect(mockedFindOwnerIdByEmail).toHaveBeenCalledWith("agent@example.com");
    expect(mockedSearchTickets).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: "987" }),
    );
  });

  it("does not call searchTickets when no owner is found", async () => {
    mockedAuth.mockResolvedValue({ userId: "user_123" });
    mockedCurrentUser.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "missing@example.com" },
    } as never);
    mockedFindOwnerIdByEmail.mockResolvedValue(null);
    mockedGetTicketStages.mockResolvedValue(mockStages);

    const { default: TicketsPage } = await import("@/app/tickets/page");

    await TicketsPage();

    expect(mockedGetTicketStages).toHaveBeenCalledTimes(1);
    expect(mockedFindOwnerIdByEmail).toHaveBeenCalledTimes(1);
    expect(mockedSearchTickets).not.toHaveBeenCalled();
  });
});

