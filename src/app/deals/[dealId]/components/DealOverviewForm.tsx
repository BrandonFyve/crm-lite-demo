"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FormValues, HubSpotOwnerSummary } from "../types";
import { UseFormReturn } from "react-hook-form";
import type { DealStage } from "@/lib/hubspot-deals";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button as ShadButton } from "@/components/ui/button";
import { useState } from "react";

interface DealOverviewFormProps {
  form: UseFormReturn<FormValues>;
  onSubmit: (values: FormValues) => Promise<void>;
  isSubmitting: boolean;
  stages: DealStage[];
  stagesLoading: boolean;
  stagesError: string | null;
  owners: HubSpotOwnerSummary[];
  ownersLoading: boolean;
  ownersError: string | null;
  createdDate?: string | null;
}

export function DealOverviewForm({
  form,
  onSubmit,
  isSubmitting,
  stages,
  stagesLoading,
  stagesError,
  owners,
  ownersLoading,
  ownersError,
  createdDate,
}: DealOverviewFormProps) {
  const [dealOwnerPopoverOpen, setDealOwnerPopoverOpen] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dealname"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Deal Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter deal name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dealstage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deal Stage</FormLabel>
                <Select
                  disabled={stagesLoading || stages.length === 0}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stagesLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ) : stages.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No stages available
                      </div>
                    ) : (
                      stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {stagesError && (
                  <p className="text-sm text-red-500">{stagesError}</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custom financial and lead source fields have been removed for the demo */}

          <FormField
            control={form.control}
            name="hubspot_owner_id"
            render={({ field }) => {
              const selectedOwner = owners.find(
                (o) => String(o.id) === field.value
              );
              const buttonLabel = selectedOwner
                ? `${selectedOwner.firstName || ""} ${
                    selectedOwner.lastName || ""
                  }`.trim() ||
                  selectedOwner.email ||
                  String(selectedOwner.id)
                : field.value || "Select deal owner...";

              return (
                <FormItem>
                  <FormLabel>Deal Owner</FormLabel>
                  <Popover
                    open={dealOwnerPopoverOpen}
                    onOpenChange={setDealOwnerPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={dealOwnerPopoverOpen}
                          className="w-full justify-between"
                          disabled={ownersLoading || !!ownersError}
                        >
                          {ownersLoading
                            ? "Loading owners..."
                            : buttonLabel || "Select deal owner..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search owners..." />
                        <CommandList>
                          <CommandEmpty>No owners found.</CommandEmpty>
                          <CommandGroup>
                            {owners.map((owner) => {
                              const ownerLabel =
                                `${owner.firstName || ""} ${
                                  owner.lastName || ""
                                }`.trim() ||
                                owner.email ||
                                String(owner.id);
                              return (
                                <CommandItem
                                  key={String(owner.id)}
                                  value={ownerLabel}
                                  onSelect={() => {
                                    const newValue = String(owner.id);
                                    field.onChange(
                                      newValue === field.value ? "" : newValue
                                    );
                                    setDealOwnerPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === String(owner.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {ownerLabel}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Deal admin custom field removed for the demo */}

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Create Date (Read-only)
            </label>
            <p className="text-sm border rounded-md p-2 bg-muted/10">
              {createdDate
                ? new Date(createdDate).toLocaleDateString()
                : "Not specified"}
            </p>
          </div>

          {/* D365-specific custom fields removed for the demo */}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter deal notes" rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ShadButton
          type="submit"
          className="w-full"
          disabled={isSubmitting || stagesLoading}
        >
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </ShadButton>
      </form>
    </Form>
  );
}
