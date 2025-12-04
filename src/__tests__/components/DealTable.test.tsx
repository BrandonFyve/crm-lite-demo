import { render, screen, fireEvent } from "@testing-library/react";
import DealTable from "@/components/DealTable";

describe("DealTable", () => {
  const stages = [
    { id: "stage-1", label: "Stage 1" },
    { id: "stage-2", label: "Stage 2" },
  ];

  const deals = [
    {
      id: "1",
      properties: {
        dealname: "Alpha",
        dealstage: "stage-2",
        notes: "",
        createdate: "2024-01-01T00:00:00Z",
        hubspot_owner_id: "owner-1",
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
        dealname: "Beta",
        dealstage: "stage-1",
        notes: "",
        createdate: "2024-02-01T00:00:00Z",
        hubspot_owner_id: "owner-2",
      },
      createdAt: "",
      updatedAt: "",
      archived: false,
      archivedAt: null,
      associations: {},
    },
  ];

  it("sorts deals when clicking Deal Name column header", () => {
    render(<DealTable deals={deals} stages={stages} />);

    const sortButton = screen.getByRole("button", { name: /deal name/i });
    fireEvent.click(sortButton);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Beta");

    fireEvent.click(sortButton);
    const resortedRows = screen.getAllByRole("row").slice(1);
    expect(resortedRows[0]).toHaveTextContent("Alpha");
  });
});

