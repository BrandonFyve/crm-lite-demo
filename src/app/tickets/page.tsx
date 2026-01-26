import Link from "next/link";
import type { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/tickets";
import { auth, currentUser } from "@clerk/nextjs/server";
import TicketBoard from "@/components/TicketBoard";
import { findOwnerIdByEmail } from "@/lib/hubspot-owners";
import { getTicketStages, searchTickets } from "@/lib/hubspot-tickets";

export default async function TicketsPage() {
  const authResult = await auth();
  
  // In E2E test mode, bypass authentication check
  const isE2ETestMode = process.env.E2E_TEST_MODE === 'true';
  const userId = authResult?.userId ?? (isE2ETestMode ? 'e2e_test_user' : null);
  const user = await currentUser();
  const stages = await getTicketStages();

  let tickets: SimplePublicObjectWithAssociations[] = [];
  let error: string | null = null;
  let ownerEmailForDisplay: string | undefined;

  if (!userId) {
    error = "User not authenticated. Please sign in.";
  } else {
    ownerEmailForDisplay = user?.primaryEmailAddress?.emailAddress ?? (isE2ETestMode ? 'test@example.com' : undefined);

    if (!ownerEmailForDisplay) {
      error = "Could not determine user email to filter tickets.";
    } else {
      const ownerId = await findOwnerIdByEmail(ownerEmailForDisplay);

      if (!ownerId) {
        error = `Could not find HubSpot owner ID for email: ${ownerEmailForDisplay}.`;
      } else {
        try {
          tickets = await searchTickets({ ownerId });
        } catch (e: unknown) {
          error =
            e instanceof Error
              ? e.message
              : "An unknown error occurred while fetching tickets.";
        }
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <div className="w-full max-w-full flex items-center mb-6">
        <div className="flex space-x-6">
          <Link
            href="/"
            className="text-2xl font-bold text-gray-500 hover:text-gray-700"
          >
            My Deals
          </Link>
          <h1 className="text-2xl font-bold">My Tickets</h1>
        </div>
      </div>
      {error && (
        <div className="w-full max-w-full p-4 my-4 text-center text-red-700 bg-red-100 border border-red-400 rounded">
          Error: {error}
        </div>
      )}
      {!error && tickets.length === 0 && (
        <div className="w-full max-w-full p-4 my-4 text-center text-gray-700 bg-gray-100 border border-gray-300 rounded">
          No tickets found assigned to your HubSpot user (
          {ownerEmailForDisplay || "email not found"}).
        </div>
      )}
      {!error && tickets.length > 0 && stages.length > 0 && (
        <TicketBoard tickets={tickets} stages={stages} />
      )}
    </main>
  );
}
