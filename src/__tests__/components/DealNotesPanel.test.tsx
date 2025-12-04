import { render, screen, fireEvent } from "@testing-library/react";
import { DealNotesPanel } from "@/app/deals/[dealId]/components/DealNotesPanel";

describe("DealNotesPanel", () => {
  it("disables button and shows skeleton while loading", () => {
    render(
      <DealNotesPanel
        notes={[]}
        noteBody=""
        setNoteBody={() => {}}
        isAdding={false}
        isLoading={true}
        error={null}
        onAddNote={jest.fn()}
      />
    );

    expect(screen.getAllByTestId("notes-loading-skeleton").length).toBeGreaterThan(0);
  });

  it("invokes onAddNote when button clicked", () => {
    const onAddNote = jest.fn();
    render(
      <DealNotesPanel
        notes={[]}
        noteBody="hello"
        setNoteBody={() => {}}
        isAdding={false}
        isLoading={false}
        error={null}
        onAddNote={onAddNote}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(onAddNote).toHaveBeenCalled();
  });
});

