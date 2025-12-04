import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import type { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/deals";
import DealsViewContainer from "@/components/DealsViewContainer";
import UserButtonClient from "@/components/UserButtonClient";
import { getDealStages, getCachedDeals } from "@/lib/hubspot-deals";
import { getOwners } from "@/lib/hubspot-owners";

export default async function Home() {
  // Fetch stages, auth, and owners server-side in parallel
  const [stages, authResult, owners] = await Promise.all([
    getDealStages(),
    auth(),
    getOwners(),
  ]);
  
  // In E2E test mode, bypass authentication check
  const isE2ETestMode = process.env.E2E_TEST_MODE === 'true';
  const userId = authResult?.userId ?? (isE2ETestMode ? 'e2e_test_user' : null);

  let deals: SimplePublicObjectWithAssociations[] = [];
  let error: string | null = null;

  if (!userId) {
    error = "User not authenticated. Please sign in.";
  } else {
    try {
      const results = await getCachedDeals({ limit: 100 });
      deals = results;
    } catch (e: unknown) {
      error =
        e instanceof Error
          ? e.message
          : "An unknown error occurred while fetching deals.";
    }
  }

  const simplifiedStages = stages.map(({ id, label }) => ({ id, label }));

  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <div className="w-full max-w-full flex justify-between items-center mb-6">
        <div className="flex space-x-6">
          <h1 className="text-2xl font-bold">Deals</h1>
          <Link
            href="/tickets"
            className="text-2xl font-bold text-gray-500 hover:text-gray-700"
          >
            Tickets
          </Link>
        </div>
        <UserButtonClient />
      </div>
      {error && (
        <div className="w-full max-w-full p-4 my-4 text-center text-red-700 bg-red-100 border border-red-400 rounded">
          Error: {error}
        </div>
      )}
      {!error && deals.length === 0 && (
        <div className="w-full max-w-full p-4 my-4 text-center text-gray-700 bg-gray-100 border border-gray-300 rounded">
          No deals found in HubSpot.
        </div>
      )}
      {!error && deals.length > 0 && simplifiedStages.length > 0 && (
        <DealsViewContainer 
          deals={deals} 
          stages={simplifiedStages}
          initialOwners={owners}
        />
      )}
    </main>
  );
}
