// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../models/api';
import {PasskeyRegistrationStartResponse} from '../../models/passkey';
import requestManagementResource from '../../utils/requestManagementResource';

export interface StartMePasskeyRegistrationConfig extends ManagementRequestConfig {
  /**
   * The relying party ID to create the passkey for. When omitted, the server uses the passkey
   * relying party ID of the application the token was issued to.
   */
  relyingPartyId?: string;
}

/**
 * Starts adding a passkey for the signed-in user at `POST /users/me/passkeys/register/start`.
 * `url` is the passkeys collection, which defaults to `{baseUrl}/users/me/passkeys`.
 *
 * @returns The WebAuthn creation options for the device, and the session token to finish with.
 * @example
 * ```typescript
 * const {publicKeyCredentialCreationOptions, sessionToken} = await startMePasskeyRegistration({
 *   baseUrl: 'https://localhost:8090',
 *   fetcher,
 *   relyingPartyId: window.location.hostname,
 * });
 * ```
 */
const startMePasskeyRegistration = async ({
  relyingPartyId,
  url,
  ...config
}: StartMePasskeyRegistrationConfig): Promise<PasskeyRegistrationStartResponse> =>
  requestManagementResource<PasskeyRegistrationStartResponse>(
    {...config, url: url ? `${url.replace(/\/+$/, '')}/register/start` : undefined},
    {
      body: {relyingPartyId},
      collection: 'users/me/passkeys/register/start',
      failureMessage: 'Failed to start adding a passkey',
      method: 'POST',
      operation: 'startMePasskeyRegistration',
    },
  );

export default startMePasskeyRegistration;
