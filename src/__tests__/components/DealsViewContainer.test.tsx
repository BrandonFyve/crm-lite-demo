import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DealsViewContainer from "@/components/DealsViewContainer";
import { toast } from "sonner";

jest.mock("@/components/DealBoard", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="deal-board" />),
}));

jest.mock("@/components/DealTable", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="deal-table" />),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

const DealBoardMocked = jest.requireMock("@/components/DealBoard").default as jest.Mock;
const DealTableMocked = jest.requireMock("@/components/DealTable").default as jest.Mock;

describe("DealsViewContainer", () => {
  const deals = [
    {
      id: "1",
      properties: {
        dealname: "Alpha Deal",
        hubspot_owner_id: "owner-1",
        dealstage: "stage-a",
      },
      createdAt: "",
      updatedAt: "",
      archived: false,
      archivedAt: null,
      associations: {},
    },
    {
      id: "2",
      properties: {
        dealname: "Beta Deal",
        hubspot_owner_id: "owner-2",
        dealstage: "stage-a",
      },
      createdAt: "",
      updatedAt: "",
      archived: false,
      archivedAt: null,
      associations: {},
    },
    {
      id: "3",
      properties: {
        dealname: "Gamma Deal",
        hubspot_owner_id: "owner-1",
        dealstage: "stage-b",
      },
      createdAt: "",
      updatedAt: "",
      archived: false,
      archivedAt: null,
      associations: {},
    },
  ];

  const stages = [
    { id: "stage-a", label: "Stage A" },
    { id: "stage-b", label: "Stage B" },
  ];

  const mockOwners = [
    {
      id: "owner-1",
      firstName: "Alice",
      lastName: "Doe",
    },
    {
      id: "owner-2",
      firstName: "Bob",
      lastName: "Smith",
    },
  ];

  beforeEach(() => {
    DealBoardMocked.mockClear();
    DealTableMocked.mockClear();
    mockFetch.mockReset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const openOwnerPopover = async () => {
    await waitFor(() => {
      expect(screen.getByRole("combobox")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole("combobox"));
  };

  const selectOwner = async (label: string) => {
    const option = await screen.findByText(label, undefined, { selector: "[role='option']" });
    fireEvent.click(option);
  };

  it("filters deals by selected owner", async () => {
    render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);

    await openOwnerPopover();
    await selectOwner("Bob Smith");

    await waitFor(() => {
      expect(DealBoardMocked).toHaveBeenCalled();
    });

    const lastCall = DealBoardMocked.mock.calls.at(-1);
    expect(lastCall?.[0].deals).toHaveLength(1);
    expect(lastCall?.[0].deals[0].id).toBe("2");
  });

  it("switches between board and table views", async () => {
    render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);

    await waitFor(() => expect(DealBoardMocked).toHaveBeenCalled());
    expect(screen.getByTestId("deal-board")).toBeInTheDocument();

    const tableButton = screen.getByRole("button", { name: /table/i });
    fireEvent.click(tableButton);

    await waitFor(() => expect(DealTableMocked).toHaveBeenCalled());
    expect(screen.getByTestId("deal-table")).toBeInTheDocument();
  });

  it("clears owner filter when Clear button is pressed", async () => {
    render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);

    await openOwnerPopover();
    await selectOwner("Bob Smith");

    await waitFor(() => {
      expect(DealBoardMocked).toHaveBeenCalled();
    });

    const filteredCall = DealBoardMocked.mock.calls.at(-1);
    expect(filteredCall?.[0].deals).toHaveLength(1);

    const clearButton = await screen.findByRole("button", { name: /clear/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      const lastCall = DealBoardMocked.mock.calls.at(-1);
      expect(lastCall?.[0].deals).toHaveLength(deals.length);
    });
  });

  it("filters deals via search input in kanban view", async () => {
    render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);

    await waitFor(() => expect(DealBoardMocked).toHaveBeenCalled());

    const searchInput = screen.getByPlaceholderText(/search deals/i);
    fireEvent.change(searchInput, { target: { value: "Alpha" } });

    await waitFor(() => {
      const lastCall = DealBoardMocked.mock.calls.at(-1);
      expect(lastCall?.[0].deals).toHaveLength(1);
      expect(lastCall?.[0].deals[0].id).toBe("1");
    });
  });

  it("filters deals via search input in table view", async () => {
    render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);

    const tableButton = screen.getByRole("button", { name: /table/i });
    fireEvent.click(tableButton);

    await waitFor(() => expect(DealTableMocked).toHaveBeenCalled());

    const searchInput = screen.getByPlaceholderText(/search deals/i);
    fireEvent.change(searchInput, { target: { value: "Beta" } });

    await waitFor(() => {
      const lastCall = DealTableMocked.mock.calls.at(-1);
      expect(lastCall?.[0].deals).toHaveLength(1);
      expect(lastCall?.[0].deals[0].id).toBe("2");
    });
  });

  it("filters deals by search term across multiple fields", async () => {
    render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);

    await waitFor(() => expect(DealBoardMocked).toHaveBeenCalled());

    const searchInput = screen.getByPlaceholderText(/search deals/i);
    // Search by deal name field
    fireEvent.change(searchInput, { target: { value: "Beta" } });

    await waitFor(() => {
      const lastCall = DealBoardMocked.mock.calls.at(-1);
      expect(lastCall?.[0].deals).toHaveLength(1);
      expect(lastCall?.[0].deals[0].properties.dealname).toBe("Beta Deal");
    });
  });

  it("combines search and owner filters", async () => {
    render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);

    await waitFor(() => expect(DealBoardMocked).toHaveBeenCalled());

    // First filter by owner
    await openOwnerPopover();
    await selectOwner("Alice Doe");

    await waitFor(() => {
      expect(DealBoardMocked).toHaveBeenCalled();
    });

    // Then add search filter by deal name
    const searchInput = screen.getByPlaceholderText(/search deals/i);
    fireEvent.change(searchInput, { target: { value: "Gamma" } });

    await waitFor(() => {
      const lastCall = DealBoardMocked.mock.calls.at(-1);
      // Should find deals owned by Alice Doe that have \"Gamma\" in the deal name
      expect(lastCall?.[0].deals.length).toBe(1);
      const [deal] = lastCall?.[0].deals;
      expect(deal.properties.hubspot_owner_id).toBe("owner-1");
      expect(deal.properties.dealname).toBe("Gamma Deal");
    });
  });

  describe("export functionality", () => {
    it("shows export button in view options", () => {
      render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);
      
      const exportButton = screen.getByRole("button", { name: /export/i });
      expect(exportButton).toBeInTheDocument();
    });

    it("disables export button and shows loading state during export", async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ downloadUrl: "https://example.com/export.xls" }),
            });
          }, 100);
        })
      );

      render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);
      
      const exportButton = screen.getByRole("button", { name: /export/i });
      fireEvent.click(exportButton);

      expect(exportButton).toBeDisabled();
      expect(exportButton).toHaveTextContent(/exporting/i);
    });

    it("triggers download when export completes", async () => {
      const downloadUrl = "https://example.com/export.xls";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ downloadUrl }),
      });

      // Store original before mocking
      const originalCreateElement = document.createElement.bind(document);
      const mockClick = jest.fn();
      const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "a") {
          const link = originalCreateElement("a");
          link.click = mockClick;
          return link;
        }
        return originalCreateElement(tagName);
      });

      render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);
      
      const exportButton = screen.getByRole("button", { name: /export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/deals/export", {
          method: "POST",
        });
      });

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith("a");
      });

      // Verify download link was clicked
      expect(mockClick).toHaveBeenCalled();
      
      // Verify toast was called (may take a moment)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Cleanup
      createElementSpy.mockRestore();
    });

    it("shows error toast when export fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Export failed"));

      render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);
      
      const exportButton = screen.getByRole("button", { name: /export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Export"));
      });
    });

    it("re-enables export button after error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Export failed"));

      render(<DealsViewContainer deals={deals} stages={stages} initialOwners={mockOwners} />);
      
      const exportButton = screen.getByRole("button", { name: /export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });
  });
});

