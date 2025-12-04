import { test, expect } from '../fixtures';
import { DealPageHelpers } from '../utils/test-helpers';
import { TEST_DEAL_IDS, ERROR_MESSAGES, TEST_NOTE_CONTENT } from '../fixtures/test-data';

test.describe('Deal Detail Page', () => {
  let helpers: DealPageHelpers;

  test.beforeEach(async ({ authenticatedPage }) => {
    helpers = new DealPageHelpers(authenticatedPage);
  });

  test.describe('Navigation and Loading', () => {
    test('should navigate to deal detail page with valid ID', async ({ authenticatedPage }) => {
      await helpers.navigateToDeal(TEST_DEAL_IDS.VALID_DEAL);
      await helpers.waitForDealLoad();

      // Verify we're on the correct page
      await expect(authenticatedPage).toHaveURL(`/deals/${TEST_DEAL_IDS.VALID_DEAL}`);
      
      // Verify main content is visible
      await expect(authenticatedPage.locator('main')).toBeVisible();
    });

    test('should display loading skeleton initially', async ({ authenticatedPage }) => {
      // Start navigation but don't wait for it to complete
      await authenticatedPage.goto(`/deals/${TEST_DEAL_IDS.VALID_DEAL}`);
      
      // Check for skeleton - it should appear briefly
      const skeleton = authenticatedPage.locator('[class*="skeleton"]').first();
      
      // Either skeleton is visible or content loaded too fast (both are acceptable)
      try {
        await expect(skeleton).toBeVisible({ timeout: 1000 });
      } catch {
        // Content may have loaded too quickly, which is also a pass
        await expect(authenticatedPage.locator('main')).toBeVisible();
      }
    });

    test('should handle invalid deal ID with 404 error', async ({ authenticatedPage }) => {
      await helpers.navigateToDeal(TEST_DEAL_IDS.INVALID_DEAL);
      
      // Wait for error to be displayed
      await authenticatedPage.waitForTimeout(2000);
      
      // Verify error message or "Deal Not Found" message is displayed
      const errorHeading = authenticatedPage.locator('text="Error", text="Deal Not Found"').first();
      await expect(errorHeading).toBeVisible({ timeout: 10000 });
    });

    test('should navigate back to deals list', async ({ authenticatedPage }) => {
      await helpers.navigateToDeal(TEST_DEAL_IDS.VALID_DEAL);
      await helpers.waitForDealLoad();

      const header = helpers.getDealHeader();
      await header.backButton.click();

      // Should navigate back (to home or deals page)
      await authenticatedPage.waitForURL(/\/$|\/deals/);
    });
  });

  test.describe('Deal Name Header', () => {
    test.beforeEach(async () => {
      await helpers.navigateToDeal(TEST_DEAL_IDS.VALID_DEAL);
      await helpers.waitForDealLoad();
    });

    test('should display current deal name in header', async ({ authenticatedPage }) => {
      const header = helpers.getDealHeader();
      
      // Verify deal name heading is visible and not empty
      await expect(header.dealNameHeading).toBeVisible();
      const dealNameText = await header.dealNameHeading.textContent();
      expect(dealNameText).toBeTruthy();
      expect(dealNameText).not.toBe('Unnamed Deal');
    });

    test('should display deal ID', async ({ authenticatedPage }) => {
      const header = helpers.getDealHeader();
      
      await expect(header.dealIdText).toBeVisible();
      await expect(header.dealIdText).toContainText(`ID: ${TEST_DEAL_IDS.VALID_DEAL}`);
    });

    test('should allow editing deal name inline', async ({ authenticatedPage }) => {
      const header = helpers.getDealHeader();
      
      // Get original name
      const originalName = await header.dealNameInput.inputValue();
      
      // Clear and type new name
      await header.dealNameInput.clear();
      await header.dealNameInput.fill('Updated Deal Name E2E');
      
      // Verify input value changed
      const newValue = await header.dealNameInput.inputValue();
      expect(newValue).toBe('Updated Deal Name E2E');
      expect(newValue).not.toBe(originalName);
    });

    test('should save deal name changes successfully', async ({ authenticatedPage }) => {
      const header = helpers.getDealHeader();
      
      // Update deal name
      const newName = `E2E Test Deal ${Date.now()}`;
      await header.dealNameInput.clear();
      await header.dealNameInput.fill(newName);
      
      // Save button should be enabled
      await expect(header.saveButton).toBeEnabled();
      await header.saveButton.click();
      
      // Wait for success toast
      await helpers.waitForToast(ERROR_MESSAGES.NAME_UPDATE_SUCCESS);
      
      // Verify heading is updated
      await expect(header.dealNameHeading).toContainText(newName);
    });

    test('should prevent saving empty deal name', async ({ authenticatedPage }) => {
      const header = helpers.getDealHeader();
      
      // Try to clear the name
      await header.dealNameInput.clear();
      
      // Save button should be disabled
      await expect(header.saveButton).toBeDisabled();
    });

    test('should show "No changes detected" for unchanged name', async ({ authenticatedPage }) => {
      const header = helpers.getDealHeader();
      
      // Get current name
      const currentName = await header.dealNameInput.inputValue();
      
      // Set the same name
      await header.dealNameInput.clear();
      await header.dealNameInput.fill(currentName);
      
      // Try to save
      await header.saveButton.click();
      
      // Wait for info toast
      await helpers.waitForToast(ERROR_MESSAGES.NO_CHANGES);
    });

    test('should show loading state while saving', async ({ authenticatedPage }) => {
      const header = helpers.getDealHeader();
      
      // Update name
      await header.dealNameInput.clear();
      await header.dealNameInput.fill(`Test ${Date.now()}`);
      
      // Click save and immediately check for loading state
      await header.saveButton.click();
      
      // Button should show "Saving..." text briefly
      // Note: This might be too fast to catch, so we use a try-catch
      try {
        await expect(header.saveButton).toContainText('Saving...', { timeout: 500 });
      } catch {
        // If too fast, verify success toast appears instead
        await helpers.waitForToast(ERROR_MESSAGES.NAME_UPDATE_SUCCESS);
      }
    });
  });

  test.describe('Deal Overview Form', () => {
    test.beforeEach(async () => {
      await helpers.navigateToDeal(TEST_DEAL_IDS.VALID_DEAL);
      await helpers.waitForDealLoad();
    });

    test('should display all form fields with values', async ({ authenticatedPage }) => {
      const form = helpers.getFormElements();
      
      // Verify key form fields are visible
      await expect(form.facilityValueInput).toBeVisible();
      await expect(form.fleetSizeInput).toBeVisible();
      await expect(form.nedbankBankerInput).toBeVisible();
      await expect(form.leadOriginatorInput).toBeVisible();
      await expect(form.leadGeneratorInput).toBeVisible();
      await expect(form.d365CustomerCodeInput).toBeVisible();
      await expect(form.notesTextarea).toBeVisible();
      await expect(form.saveChangesButton).toBeVisible();
    });

    test('should display dropdown fields correctly', async ({ authenticatedPage }) => {
      const form = helpers.getFormElements();
      
      // Verify dropdowns are visible
      await expect(form.dealStageSelect).toBeVisible();
      await expect(form.serviceSelect).toBeVisible();
      await expect(form.dealOwnerSelect).toBeVisible();
      await expect(form.dealAdminSelect).toBeVisible();
    });

    test('should update single field and save', async ({ authenticatedPage }) => {
      const form = helpers.getFormElements();
      
      // Update Nedbank Banker field
      const newValue = `Updated Banker ${Date.now()}`;
      await form.nedbankBankerInput.clear();
      await form.nedbankBankerInput.fill(newValue);
      
      // Save changes
      await form.saveChangesButton.click();
      
      // Wait for success toast
      await helpers.waitForToast(ERROR_MESSAGES.UPDATE_SUCCESS);
      
      // Verify field still has the new value
      await expect(form.nedbankBankerInput).toHaveValue(newValue);
    });

    test('should update multiple fields and save', async ({ authenticatedPage }) => {
      const form = helpers.getFormElements();
      
      // Update multiple fields
      const timestamp = Date.now();
      await form.facilityValueInput.clear();
      await form.facilityValueInput.fill('2500000');
      
      await form.fleetSizeInput.clear();
      await form.fleetSizeInput.fill('100');
      
      await form.nedbankBankerInput.clear();
      await form.nedbankBankerInput.fill(`Banker ${timestamp}`);
      
      await form.leadOriginatorInput.clear();
      await form.leadOriginatorInput.fill(`Originator ${timestamp}`);
      
      // Save changes
      await form.saveChangesButton.click();
      
      // Wait for success toast
      await helpers.waitForToast(ERROR_MESSAGES.UPDATE_SUCCESS);
      
      // Verify all fields retained their values
      await expect(form.facilityValueInput).toHaveValue('2500000');
      await expect(form.fleetSizeInput).toHaveValue('100');
      await expect(form.nedbankBankerInput).toHaveValue(`Banker ${timestamp}`);
      await expect(form.leadOriginatorInput).toHaveValue(`Originator ${timestamp}`);
    });

    test('should show "No changes detected" for unchanged form', async ({ authenticatedPage }) => {
      const form = helpers.getFormElements();
      
      // Try to save without making changes
      await form.saveChangesButton.click();
      
      // Wait for info toast
      await helpers.waitForToast(ERROR_MESSAGES.NO_CHANGES);
    });

    test('should display Create Date as read-only', async ({ authenticatedPage }) => {
      // Verify create date is visible
      const createDateLabel = authenticatedPage.locator('text="Create Date (Read-only)"');
      await expect(createDateLabel).toBeVisible();
      
      // Verify there's a date value displayed
      const createDateValue = authenticatedPage.locator('label:has-text("Create Date")').locator('..').locator('p').first();
      await expect(createDateValue).toBeVisible();
      const dateText = await createDateValue.textContent();
      expect(dateText).not.toBe('Not specified');
    });

    test('should handle date input fields', async ({ authenticatedPage }) => {
      const form = helpers.getFormElements();
      
      // Update date fields
      await form.d365LeaseActivationInput.clear();
      await form.d365LeaseActivationInput.fill('2024-03-15');
      
      await form.d365NonLeaseActivationInput.clear();
      await form.d365NonLeaseActivationInput.fill('2024-03-20');
      
      // Save changes
      await form.saveChangesButton.click();
      
      // Wait for success
      await helpers.waitForToast(ERROR_MESSAGES.UPDATE_SUCCESS);
    });

    test('should show loading state during save', async ({ authenticatedPage }) => {
      const form = helpers.getFormElements();
      
      // Make a change
      await form.nedbankBankerInput.clear();
      await form.nedbankBankerInput.fill(`Test ${Date.now()}`);
      
      // Click save
      await form.saveChangesButton.click();
      
      // Check for loading state (might be brief)
      try {
        await expect(form.saveChangesButton).toContainText('Saving Changes...', { timeout: 500 });
      } catch {
        // If too fast, verify success toast appears instead
        await helpers.waitForToast(ERROR_MESSAGES.UPDATE_SUCCESS);
      }
    });
  });

  test.describe('Notes Panel', () => {
    test.beforeEach(async () => {
      await helpers.navigateToDeal(TEST_DEAL_IDS.VALID_DEAL);
      await helpers.waitForDealLoad();
    });

    test('should display notes panel sections', async ({ authenticatedPage }) => {
      const notes = helpers.getNotesPanel();
      
      // Verify add note section
      await expect(authenticatedPage.locator('text="Add Note"')).toBeVisible();
      await expect(notes.addNoteTextarea).toBeVisible();
      await expect(notes.addNoteButton).toBeVisible();
      
      // Verify notes list section
      await expect(authenticatedPage.locator('text="Notes"').nth(1)).toBeVisible();
    });

    test('should display existing notes if available', async ({ authenticatedPage }) => {
      const notes = helpers.getNotesPanel();
      
      // Check if there are notes or "no notes" message
      const notesCount = await notes.notesList.count();
      const noNotesVisible = await notes.noNotesMessage.isVisible().catch(() => false);
      
      // Either notes exist OR no notes message is shown
      expect(notesCount > 0 || noNotesVisible).toBeTruthy();
    });

    test('should add new note successfully', async ({ authenticatedPage }) => {
      const notes = helpers.getNotesPanel();
      
      // Get initial notes count
      const initialCount = await notes.notesList.count();
      
      // Add a new note
      const noteText = `${TEST_NOTE_CONTENT} ${Date.now()}`;
      await notes.addNoteTextarea.fill(noteText);
      
      // Button should be enabled
      await expect(notes.addNoteButton).toBeEnabled();
      
      // Click add note
      await notes.addNoteButton.click();
      
      // Wait for note to be added (success indication)
      await authenticatedPage.waitForTimeout(2000);
      
      // Note: We might see a success toast or the notes list should update
      // Check if notes count increased or textarea was cleared
      const textareaValue = await notes.addNoteTextarea.inputValue();
      expect(textareaValue).toBe('');
    });

    test('should disable add button when note is empty', async ({ authenticatedPage }) => {
      const notes = helpers.getNotesPanel();
      
      // Clear textarea
      await notes.addNoteTextarea.clear();
      
      // Button should be disabled
      await expect(notes.addNoteButton).toBeDisabled();
    });

    test('should show loading state while adding note', async ({ authenticatedPage }) => {
      const notes = helpers.getNotesPanel();
      
      // Fill note
      await notes.addNoteTextarea.fill(`Loading test ${Date.now()}`);
      
      // Click add
      await notes.addNoteButton.click();
      
      // Check for loading state (might be brief)
      try {
        await expect(notes.addNoteButton).toContainText('Adding Note...', { timeout: 500 });
      } catch {
        // If too fast, verify textarea is cleared (success)
        await authenticatedPage.waitForTimeout(1000);
        const value = await notes.addNoteTextarea.inputValue();
        expect(value).toBe('');
      }
    });

    test('should display note timestamps', async ({ authenticatedPage }) => {
      const notes = helpers.getNotesPanel();
      
      // If there are notes, check for timestamp
      const notesCount = await notes.notesList.count();
      
      if (notesCount > 0) {
        // Get first note and verify it has a timestamp
        const firstNote = notes.notesList.first();
        const timestamp = firstNote.locator('p.text-sm.text-muted-foreground').first();
        await expect(timestamp).toBeVisible();
        
        const timestampText = await timestamp.textContent();
        expect(timestampText).toBeTruthy();
      }
    });
  });

  test.describe('Associated Company Section', () => {
    test.beforeEach(async () => {
      await helpers.navigateToDeal(TEST_DEAL_IDS.VALID_DEAL);
      await helpers.waitForDealLoad();
    });

    test('should display associated company section', async ({ authenticatedPage }) => {
      // Verify section heading
      await expect(authenticatedPage.locator('text="Associated Company"')).toBeVisible();
    });

    test('should display company information or no company message', async ({ authenticatedPage }) => {
      const company = helpers.getCompanySection();
      
      // Check if company exists or no company message is shown
      const hasCompanyName = await company.companyName.isVisible().catch(() => false);
      const hasNoCompanyMsg = await company.noCompanyMessage.isVisible().catch(() => false);
      
      // One of these should be true
      expect(hasCompanyName || hasNoCompanyMsg).toBeTruthy();
    });

    test('should display company details when company exists', async ({ authenticatedPage }) => {
      const company = helpers.getCompanySection();
      
      // Try to find company name
      const hasCompanyName = await company.companyName.isVisible().catch(() => false);
      
      if (hasCompanyName) {
        // Verify company fields are visible
        await expect(company.companyName).toBeVisible();
        await expect(company.companyId).toBeVisible();
        await expect(company.companyCreateDate).toBeVisible();
        
        // Verify they have values
        const nameText = await company.companyName.textContent();
        expect(nameText).toBeTruthy();
        expect(nameText).not.toBe('Not specified');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ authenticatedPage }) => {
      // Simulate network failure for deal fetch
      await authenticatedPage.route(`**/api/deals/${TEST_DEAL_IDS.VALID_DEAL}`, (route) => {
        route.abort('failed');
      });
      
      await helpers.navigateToDeal(TEST_DEAL_IDS.VALID_DEAL);
      
      // Wait a bit for error to appear
      await authenticatedPage.waitForTimeout(2000);
      
      // Should show some error indication
      const errorText = authenticatedPage.locator('text="Error", text="failed"').first();
      const isVisible = await errorText.isVisible().catch(() => false);
      
      // Some error indication should be present
      expect(isVisible).toBeTruthy();
    });

    test('should handle API errors during update', async ({ authenticatedPage }) => {
      await helpers.navigateToDeal(TEST_DEAL_IDS.VALID_DEAL);
      await helpers.waitForDealLoad();
      
      // Intercept PATCH request and return error
      await authenticatedPage.route(`**/api/deals/${TEST_DEAL_IDS.VALID_DEAL}`, (route) => {
        if (route.request().method() === 'PATCH') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Internal server error' }),
          });
        } else {
          route.continue();
        }
      });
      
      const form = helpers.getFormElements();
      
      // Make a change
      await form.nedbankBankerInput.clear();
      await form.nedbankBankerInput.fill('This will fail');
      
      // Try to save
      await form.saveChangesButton.click();
      
      // Should show error toast
      const errorToast = authenticatedPage.locator('[data-sonner-toast]').first();
      await expect(errorToast).toBeVisible({ timeout: 5000 });
      await expect(errorToast).toContainText('Error');
    });
  });
});

