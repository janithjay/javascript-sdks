// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * browser/quickstart Page Object — vanilla JS + @thunderid/browser, redirect flow.
 * Custom hand-built markup (not the shared component library), so its own selectors: see
 * samples/browser/quickstart/src/components/nav.js and src/pages/home.js.
 */

import {Page, expect} from '@playwright/test';
import {GateLoginPage} from './gate-login.page';
import {Timeouts} from '../constants/timeouts';

export const ProfileFieldKeys = {
  familyName: 'family_name',
  givenName: 'given_name',
};

export class BrowserQuickstartPage extends GateLoginPage {
  constructor(page: Page) {
    super(page);
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url, {waitUntil: 'commit'});
  }

  async verifyHomePageLoaded(): Promise<void> {
    await expect(this.page.locator('#hero-sign-in-btn, #sign-in-btn').first()).toBeVisible({
      timeout: Timeouts.ELEMENT_VISIBILITY,
    });
  }

  async clickSignInButton(): Promise<void> {
    await this.page.locator('#hero-sign-in-btn, #sign-in-btn').first().click();
  }

  async verifyLoggedIn(): Promise<void> {
    await expect(this.page.locator('#ud-trigger')).toBeVisible({timeout: Timeouts.REDIRECT});
  }

  async verifyLoggedOut(): Promise<void> {
    await this.verifyHomePageLoaded();
  }

  async logout(): Promise<void> {
    await this.page.locator('#ud-trigger').click();
    await this.page.locator('#ud-sign-out').click();
    await this.confirmSignOutIfPrompted();
  }

  /** Opens the token debug page via the user dropdown (src/pages/token.js — an in-memory SPA
   * "route" with no real URL change, so callers must wait for its content, not a URL). */
  async openTokenDebug(): Promise<void> {
    await this.page.locator('#ud-trigger').click();
    await this.page.locator('#ud-token-debug').click();
  }

  async verifyTokenDebugLoaded(): Promise<void> {
    await expect(this.page.locator('.token-main')).toBeVisible({timeout: Timeouts.ELEMENT_VISIBILITY});
  }

  /** Reads the raw access token JWT rendered across the three .token-part--* spans. */
  async getDisplayedAccessToken(): Promise<string> {
    const raw = this.page.locator('.token-raw');
    await raw.waitFor({state: 'visible', timeout: Timeouts.ELEMENT_VISIBILITY});
    const header = await raw.locator('.token-part--header').innerText();
    const payload = await raw.locator('.token-part--payload').innerText();
    const signature = await raw.locator('.token-part--signature').innerText();
    return `${header}.${payload}.${signature}`;
  }

  /** Opens the "Manage Profile" dialog (src/components/profileDialog.js). */
  async openManageProfile(): Promise<void> {
    await this.page.locator('#ud-trigger').click();
    await this.page.locator('#ud-manage-profile').click();
    await this.page
      .locator('#profile-dialog-overlay')
      .waitFor({state: 'visible', timeout: Timeouts.ELEMENT_VISIBILITY});
  }

  /** Edits one field of the profile dialog, which renders each schema attribute as its own row
   * with a pencil "Edit" button.*/
  async editProfileField(fieldKey: string, value: string): Promise<void> {
    const row = this.page.locator(`.profile-field-row[data-field="${fieldKey}"]`);
    await row.locator('[data-action="edit"]').click();
    await row.locator('.profile-field-row-input').fill(value);
    await row.locator('[data-action="save"]').click();
    await expect(row.locator('.profile-field-row-input')).toHaveCount(0, {timeout: Timeouts.DEFAULT_ACTION});
  }

  /** Verifies a field's row reverted from edit mode back to display mode showing the just-saved value*/
  async verifyProfileFieldValue(fieldKey: string, value: string): Promise<void> {
    const row = this.page.locator(`.profile-field-row[data-field="${fieldKey}"]`);
    await expect(row.locator('.profile-field-row-value')).toHaveText(value, {timeout: Timeouts.ELEMENT_VISIBILITY});
  }

  async closeManageProfile(): Promise<void> {
    await this.page.locator('#profile-dialog-close').click();
    await this.page.locator('#profile-dialog-overlay').waitFor({state: 'hidden', timeout: Timeouts.DEFAULT_ACTION});
  }

  async verifyDisplayedName(fullName: string): Promise<void> {
    await expect(this.page.locator('.ud-name')).toHaveText(fullName, {timeout: Timeouts.ELEMENT_VISIBILITY});
  }
}
