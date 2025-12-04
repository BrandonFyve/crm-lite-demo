import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import DealContentClient from "@/app/deals/[dealId]/DealContentClient";
import { toast } from "sonner";

jest.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

jest.mock("sonner", () => ({
  __esModule: true,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockFetch = jest.fn();

describe("DealContentClient", () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (typeof url === "string" && url.endsWith("/notes")) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (typeof url === "string" && url.endsWith("/service-options")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ value: "Consulting", label: "Consulting" }],
        });
      }
      if (typeof url === "string" && url.endsWith("/lead-originator-options")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ value: "alice", label: "Alice" }],
        });
      }
      if (typeof url === "string" && url.endsWith("/stages")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "stage-1", label: "Stage 1" }],
        });
      }
      if (typeof url === "string" && url.includes("/api/owners")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "1", firstName: "Alice", lastName: "Doe" }],
        });
      }
      if (
        typeof url === "string" &&
        url.includes("/api/deals/") &&
        !url.endsWith("/notes")
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: "deal-1",
            properties: {
              dealname: "Sample Deal",
              dealstage: "stage-1",
              notes: "",
              hubspot_owner_id: "",
              createdate: "2024-01-01T00:00:00Z",
            },
            associatedCompanies: [],
            ownerInfo: null,
          }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads deal details and allows saving new deal name", async () => {
    render(<DealContentClient dealId="deal-1" />);

    await waitFor(() =>
      expect(screen.getByDisplayValue("Sample Deal")).toBeInTheDocument()
    );

    const nameInput = screen.getByLabelText(/deal name/i);
    fireEvent.change(nameInput, { target: { value: "Updated Deal" } });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/deals/deal-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ dealname: "Updated Deal" }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith("Deal updated successfully");
    });
  });

  it("excludes invalid dealstage from update payload when saving other fields", async () => {
    // Mock a deal with a stage that doesn't match any available stage
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (typeof url === "string" && url.endsWith("/stages")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "stage-1", label: "Stage 1" }],
        });
      }
      if (
        typeof url === "string" &&
        url.includes("/api/deals/deal-1") &&
        !url.endsWith("/notes")
      ) {
        // First call: GET deal with invalid stage
        if (url === "/api/deals/deal-1") {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: "deal-1",
              properties: {
                dealname: "Sample Deal",
                dealstage: "invalid-stage-id", // Stage ID that doesn't match available stages
                notes: "",
                hubspot_owner_id: "",
                createdate: "2024-01-01T00:00:00Z",
              },
              associatedCompanies: [],
              ownerInfo: null,
            }),
          });
        }
        // Second call: PATCH update
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: "deal-1",
            properties: {
              dealname: "Updated Deal",
              dealstage: "invalid-stage-id",
            },
          }),
        });
      }
      if (typeof url === "string" && url.endsWith("/notes")) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (typeof url === "string" && url.includes("/api/owners")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "1", firstName: "Alice", lastName: "Doe" }],
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<DealContentClient dealId="deal-1" />);

    await waitFor(() =>
      expect(screen.getByDisplayValue("Sample Deal")).toBeInTheDocument()
    );

    // Update deal name only
    const nameInput = screen.getByLabelText(/deal name/i);
    fireEvent.change(nameInput, { target: { value: "Updated Deal" } });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Verify that dealstage is NOT included in the update payload
      const updateCall = mockFetch.mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("/api/deals/deal-1") &&
          call[1]?.method === "PATCH"
      );
      expect(updateCall).toBeDefined();
      const body = JSON.parse(updateCall[1].body);
      expect(body).not.toHaveProperty("dealstage");
      expect(body.dealname).toBe("Updated Deal");
      expect(toast.success).toHaveBeenCalledWith("Deal updated successfully");
    });
  });

  it("excludes empty dealstage from update payload", async () => {
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (typeof url === "string" && url.endsWith("/stages")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "stage-1", label: "Stage 1" }],
        });
      }
      if (
        typeof url === "string" &&
        url.includes("/api/deals/deal-1") &&
        !url.endsWith("/notes")
      ) {
        if (url === "/api/deals/deal-1") {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: "deal-1",
              properties: {
                dealname: "Sample Deal",
                dealstage: "stage-1",
                notes: "",
                hubspot_owner_id: "",
                createdate: "2024-01-01T00:00:00Z",
              },
              associatedCompanies: [],
              ownerInfo: null,
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: "deal-1",
            properties: { dealname: "Updated Deal" },
          }),
        });
      }
      if (typeof url === "string" && url.endsWith("/notes")) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (typeof url === "string" && url.includes("/api/owners")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "1", firstName: "Alice", lastName: "Doe" }],
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<DealContentClient dealId="deal-1" />);

    await waitFor(() =>
      expect(screen.getByDisplayValue("Sample Deal")).toBeInTheDocument()
    );

    // Clear the dealstage (simulating "Select a stage" state)
    const stageSelect = screen.getByLabelText(/deal stage/i);
    fireEvent.change(stageSelect, { target: { value: "" } });

    // Update deal name
    const nameInput = screen.getByLabelText(/deal name/i);
    fireEvent.change(nameInput, { target: { value: "Updated Deal" } });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      const updateCall = mockFetch.mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("/api/deals/deal-1") &&
          call[1]?.method === "PATCH"
      );
      expect(updateCall).toBeDefined();
      const body = JSON.parse(updateCall[1].body);
      // Empty dealstage should be excluded
      expect(body).not.toHaveProperty("dealstage");
      expect(body.dealname).toBe("Updated Deal");
      expect(toast.success).toHaveBeenCalledWith("Deal updated successfully");
    });
  });
});
