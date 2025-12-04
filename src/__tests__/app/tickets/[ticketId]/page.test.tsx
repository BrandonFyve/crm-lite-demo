/** @jest-environment node */

jest.mock("@/app/tickets/[ticketId]/TicketContentClient", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe("Ticket details page server component", () => {
  it("awaits params promise and forwards ticketId to client content", async () => {
    const TicketContentClient = await import(
      "@/app/tickets/[ticketId]/TicketContentClient"
    );
    const mockedTicketContentClient = jest.mocked(
      TicketContentClient.default
    );

    const { default: TicketPage } = await import(
      "@/app/tickets/[ticketId]/page"
    );

    const result = await TicketPage({
      params: Promise.resolve({ ticketId: "ticket-42" }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        type: mockedTicketContentClient,
        props: { ticketId: "ticket-42" },
      }),
    );
  });
});


