import type { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/deals";

export interface DealWithCompanies extends SimplePublicObjectWithAssociations {
  associatedCompanies?: Array<{
    id: string;
    properties: {
      name?: string;
      createdate?: string;
      hs_object_id?: string;
    };
  }>;
  ownerInfo?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
}

export interface ServiceOption {
  value: string;
  label: string;
}

export interface DealNote {
  id: string;
  properties: {
    hs_note_body: string;
    hs_timestamp: string;
    hubspot_owner_id?: string;
  };
}

export interface HubSpotOwnerSummary {
  id: string | number;
  email?: string;
  firstName?: string;
  lastName?: string;
  archived?: boolean;
}

export interface FormValues {
  dealname: string;
  dealstage: string;
  notes: string;
  hubspot_owner_id: string;
}

export interface DealContentClientProps {
  dealId: string;
}

