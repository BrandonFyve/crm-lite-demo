import { Page, expect } from '@playwright/test';

/**
 * Navigation helpers for deal pages
 */
export class DealPageHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to deal detail page
   */
  async navigateToDeal(dealId: string) {
    await this.page.goto(`/deals/${dealId}`);
  }

  /**
   * Wait for deal data to load completely
   */
  async waitForDealLoad() {
    // Wait for the page to load
    await this.page.waitForLoadState('networkidle');
    
    // Wait for skeleton loaders to disappear
    const skeleton = this.page.locator('[class*="skeleton"]').first();
    const skeletonCount = await skeleton.count();
    
    if (skeletonCount > 0) {
      await skeleton.waitFor({ state: 'hidden', timeout: 15000 });
    }
    
    // Verify main content is visible
    await this.page.waitForSelector('main', { state: 'visible' });
  }

  /**
   * Get deal header elements
   */
  getDealHeader() {
    return {
      backButton: this.page.locator('button:has-text("Back to Deals")'),
      dealNameHeading: this.page.locator('h1'),
      dealIdText: this.page.locator('text=/ID: /'),
      dealNameInput: this.page.locator('#deal-name'),
      saveButton: this.page.locator('button[type="submit"]:has-text("Save")'),
    };
  }

  /**
   * Get form elements
   */
  getFormElements() {
    return {
      dealStageSelect: this.page.locator('label:has-text("Deal Stage")').locator('..').locator('[role="combobox"]').first(),
      facilityValueInput: this.page.locator('label:has-text("Facility Value")').locator('..').locator('input').first(),
      serviceSelect: this.page.locator('label:has-text("Service")').locator('..').locator('[role="combobox"]').first(),
      fleetSizeInput: this.page.locator('label:has-text("Total Fleet Size")').locator('..').locator('input').first(),
      anticipatedFMRInput: this.page.locator('label:has-text("Anticipated FMR and OPR")').locator('..').locator('input').first(),
      anticipatedValueInput: this.page.locator('label:has-text("Anticipated Rand Value")').locator('..').locator('input').first(),
      nedbankBankerInput: this.page.locator('label:has-text("Nedbank Banker")').locator('..').locator('input').first(),
      leadOriginatorInput: this.page.locator('label:has-text("Lead Originator")').locator('..').locator('input').first(),
      leadGeneratorInput: this.page.locator('label:has-text("Lead Generator")').locator('..').locator('input').first(),
      dealOwnerSelect: this.page.locator('label:has-text("Deal Owner")').locator('..').locator('[role="combobox"]').first(),
      dealAdminSelect: this.page.locator('label:has-text("Deal Admin")').locator('..').locator('[role="combobox"]').first(),
      d365CustomerCodeInput: this.page.locator('label:has-text("D365 Customer Code")').locator('..').locator('input').first(),
      d365LeaseActivationInput: this.page.locator('label:has-text("D365 Lease First Activation Date")').locator('..').locator('input').first(),
      d365NonLeaseActivationInput: this.page.locator('label:has-text("D365 Non Lease First Activation Date")').locator('..').locator('input').first(),
      notesTextarea: this.page.locator('label:has-text("Notes")').locator('..').locator('textarea').first(),
      saveChangesButton: this.page.locator('button[type="submit"]:has-text("Save Changes")'),
    };
  }

  /**
   * Get notes panel elements
   */
  getNotesPanel() {
    return {
      addNoteTextarea: this.page.locator('textarea[placeholder*="Enter your note"]'),
      addNoteButton: this.page.locator('button:has-text("Add Note")'),
      notesList: this.page.locator('.border.rounded-lg.p-4.bg-muted\\/10'),
      noNotesMessage: this.page.locator('text="No notes found for this deal"'),
    };
  }

  /**
   * Get associated company section
   */
  getCompanySection() {
    return {
      companyName: this.page.locator('label:has-text("Company Name")').locator('..').locator('p').first(),
      companyId: this.page.locator('label:has-text("Company ID")').locator('..').locator('p').first(),
      companyCreateDate: this.page.locator('label:has-text("Company Created Date")').locator('..').locator('p').first(),
      noCompanyMessage: this.page.locator('text="No associated company found"'),
    };
  }

  /**
   * Update deal name
   */
  async updateDealName(newName: string) {
    const header = this.getDealHeader();
    await header.dealNameInput.clear();
    await header.dealNameInput.fill(newName);
    await header.saveButton.click();
  }

  /**
   * Fill and submit overview form
   */
  async submitOverviewForm(updates: Record<string, string>) {
    const form = this.getFormElements();
    
    for (const [field, value] of Object.entries(updates)) {
      switch (field) {
        case 'facilityValue':
          await form.facilityValueInput.clear();
          await form.facilityValueInput.fill(value);
          break;
        case 'fleetSize':
          await form.fleetSizeInput.clear();
          await form.fleetSizeInput.fill(value);
          break;
        case 'nedbankBanker':
          await form.nedbankBankerInput.clear();
          await form.nedbankBankerInput.fill(value);
          break;
        case 'leadOriginator':
          await form.leadOriginatorInput.clear();
          await form.leadOriginatorInput.fill(value);
          break;
        case 'leadGenerator':
          await form.leadGeneratorInput.clear();
          await form.leadGeneratorInput.fill(value);
          break;
        case 'd365CustomerCode':
          await form.d365CustomerCodeInput.clear();
          await form.d365CustomerCodeInput.fill(value);
          break;
        case 'notes':
          await form.notesTextarea.clear();
          await form.notesTextarea.fill(value);
          break;
      }
    }
    
    await form.saveChangesButton.click();
  }

  /**
   * Add a note to the deal
   */
  async addNote(noteText: string) {
    const notes = this.getNotesPanel();
    await notes.addNoteTextarea.fill(noteText);
    await notes.addNoteButton.click();
  }

  /**
   * Wait for and verify toast notification
   */
  async waitForToast(expectedText?: string) {
    const toast = this.page.locator('[data-sonner-toast]').first();
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    
    if (expectedText) {
      await expect(toast).toContainText(expectedText);
    }
    
    return toast;
  }

  /**
   * Verify error card is displayed
   */
  async verifyErrorCard(expectedMessage?: string) {
    const errorCard = this.page.locator('text="Error"').locator('..');
    await expect(errorCard).toBeVisible();
    
    if (expectedMessage) {
      await expect(this.page.locator(`text="${expectedMessage}"`)).toBeVisible();
    }
  }

  /**
   * Select from dropdown by clicking trigger and option
   */
  async selectDropdownOption(triggerLocator: any, optionText: string) {
    await triggerLocator.click();
    await this.page.waitForTimeout(500); // Wait for dropdown animation
    
    const option = this.page.locator(`[role="option"]:has-text("${optionText}")`).first();
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  /**
   * Search and select from combobox
   */
  async selectComboboxOption(triggerLocator: any, searchText: string, optionText: string) {
    await triggerLocator.click();
    await this.page.waitForTimeout(500);
    
    const searchInput = this.page.locator('[role="combobox"] input, [cmdk-input]').first();
    await searchInput.fill(searchText);
    
    const option = this.page.locator(`[role="option"]:has-text("${optionText}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }
}

/**
 * Assertion helpers
 */
export async function assertDealProperty(
  page: Page,
  propertyLabel: string,
  expectedValue: string
) {
  const value = await page.locator(`label:has-text("${propertyLabel}")`).locator('..').locator('input, textarea').first().inputValue();
  expect(value).toBe(expectedValue);
}

export async function assertToastVisible(page: Page, message: string) {
  const toast = page.locator('[data-sonner-toast]', { hasText: message });
  await expect(toast).toBeVisible({ timeout: 5000 });
}

