/**
 * Test data for E2E tests
 * 
 * NOTE: These IDs should correspond to actual deals in your test HubSpot portal.
 * Update these values to match your test environment.
 */

export const TEST_DEAL_IDS = {
  VALID_DEAL: process.env.TEST_DEAL_ID || '123456789',
  INVALID_DEAL: '999999999',
};

export const TEST_STAGES = [
  {
    id: 'appointmentscheduled',
    label: 'Appointment Scheduled',
  },
  {
    id: 'qualifiedtobuy',
    label: 'Qualified to Buy',
  },
  {
    id: 'presentationscheduled',
    label: 'Presentation Scheduled',
  },
  {
    id: 'decisionmakerboughtin',
    label: 'Decision Maker Bought-In',
  },
  {
    id: 'contractsent',
    label: 'Contract Sent',
  },
  {
    id: 'closedwon',
    label: 'Closed Won',
  },
  {
    id: 'closedlost',
    label: 'Closed Lost',
  },
];

export const TEST_SERVICE_OPTIONS = [
  { value: 'fleet_management', label: 'Fleet Management' },
  { value: 'leasing', label: 'Leasing' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'telematics', label: 'Telematics' },
];

export const TEST_OWNERS = [
  {
    id: '123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  },
  {
    id: '456',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
  },
];

/**
 * Mock deal data structure matching HubSpot API response
 */
export const MOCK_DEAL = {
  id: TEST_DEAL_IDS.VALID_DEAL,
  properties: {
    dealname: 'Test Deal for E2E',
    dealstage: 'appointmentscheduled',
    notes: 'Test notes for this deal',
    hubspot_owner_id: '456',
    createdate: '2024-01-01T00:00:00Z',
  },
  associatedCompanies: [
    {
      id: '789',
      properties: {
        name: 'Test Company Inc',
        createdate: '2023-12-01T00:00:00Z',
        hs_object_id: '789',
      },
    },
  ],
  ownerInfo: {
    id: '456',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
  },
};

/**
 * Mock notes data
 */
export const MOCK_NOTES = [
  {
    id: 'note1',
    properties: {
      hs_note_body: 'First test note',
      hs_timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
      hubspot_owner_id: '123',
    },
  },
  {
    id: 'note2',
    properties: {
      hs_note_body: 'Second test note with <strong>formatting</strong>',
      hs_timestamp: new Date('2024-01-16T14:30:00Z').toISOString(),
      hubspot_owner_id: '456',
    },
  },
];

/**
 * Form update test data
 */
export const TEST_FORM_UPDATES = {
  singleField: {
    nedbankBanker: 'Updated Banker Name',
  },
  multipleFields: {
    facilityValue: '2000000',
    fleetSize: '75',
    nedbankBanker: 'New Banker',
    leadOriginator: 'New Originator',
  },
};

/**
 * Test note content
 */
export const TEST_NOTE_CONTENT = 'This is a test note added during E2E testing';

/**
 * Error messages for testing
 */
export const ERROR_MESSAGES = {
  DEAL_NOT_FOUND: 'Deal not found',
  EMPTY_DEAL_NAME: 'Deal name cannot be empty',
  NO_CHANGES: 'No changes detected',
  UPDATE_SUCCESS: 'Deal updated successfully',
  NAME_UPDATE_SUCCESS: 'Deal name updated successfully',
  NOTE_ADDED_SUCCESS: 'Note added successfully',
};

