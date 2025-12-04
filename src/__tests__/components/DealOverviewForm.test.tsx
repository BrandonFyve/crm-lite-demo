import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DealOverviewForm } from "@/app/deals/[dealId]/components/DealOverviewForm";
import { useForm } from "react-hook-form";
import { FormValues } from "@/app/deals/[dealId]/types";

const defaultFormValues: FormValues = {
  dealname: "",
  dealstage: "",
  notes: "",
  hubspot_owner_id: "",
};

const renderForm = (
  props?: Partial<Parameters<typeof DealOverviewForm>[0]>,
  defaultValues?: Partial<FormValues>
) => {
  const TestWrapper = () => {
    const form = useForm<FormValues>({
      defaultValues: { ...defaultFormValues, ...defaultValues },
    });
    return (
      <DealOverviewForm
        form={form}
        onSubmit={jest.fn()}
        isSubmitting={false}
        stages={[]}
        stagesLoading={false}
        stagesError={null}
        owners={[]}
        ownersLoading={false}
        ownersError={null}
        {...props}
      />
    );
  };

  return render(<TestWrapper />);
};

describe("DealOverviewForm", () => {
  it("renders deal name input within the overview form", () => {
    renderForm();
    const nameInput = screen.getByLabelText(/deal name/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveDisplayValue("");
  });

  it("submits updated deal name when saving changes", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    const nameInput = screen.getByLabelText(/deal name/i);
    fireEvent.change(nameInput, { target: { value: "Updated Deal" } });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [submittedValues] = onSubmit.mock.calls[0];
    expect(submittedValues.dealname).toBe("Updated Deal");
  });

  it("renders notes textarea", () => {
    renderForm();
    const notesInput = screen.getByLabelText(/notes/i);
    expect(notesInput).toBeInTheDocument();
  });

  it("submits updated notes when saving changes", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    const notesInput = screen.getByLabelText(/notes/i);
    fireEvent.change(notesInput, { target: { value: "Some notes" } });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [submittedValues] = onSubmit.mock.calls[0];
    expect(submittedValues.notes).toBe("Some notes");
  });
});
