// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../models/api';
import {Passkey, PasskeyRegistrationCredential} from '../../models/passkey';
import requestManagementResource from '../../utils/requestManagementResource';

export interface FinishMePasskeyRegistrationConfig extends ManagementRequestConfig {
  /**
   * The credential the device created.
   */
  credential: PasskeyRegistrationCredential;
  /**
   * A name for the passkey, up to 64 characters, so the user can tell their passkeys apart.
   */
  name?: string;
  /**
   * The session token from {@link startMePasskeyRegistration}.
   */
  sessionToken: string;
}

/**
 * Saves a new passkey for the signed-in user at `POST /users/me/passkeys/register/finish`.
 * `url` is the passkeys collection, which defaults to `{baseUrl}/users/me/passkeys`.
 *
 * @returns The saved passkey.
 * @example
 * ```typescript
 * const passkey = await finishMePasskeyRegistration({
 *   baseUrl: 'https://localhost:8090',
 *   credential,
 *   fetcher,
 *   name: 'Work laptop',
 *   sessionToken,
 * });
 * ```
 */
const finishMePasskeyRegistration = async ({
  credential,
  name,
  sessionToken,
  url,
  ...config
}: FinishMePasskeyRegistrationConfig): Promise<Passkey> =>
  requestManagementResource<Passkey>(
    {...config, url: url ? `${url.replace(/\/+$/, '')}/register/finish` : undefined},
    {
      body: {...(name ? {name} : {}), publicKeyCredential: credential, sessionToken},
      collection: 'users/me/passkeys/register/finish',
      failureMessage: 'Failed to add the passkey',
      method: 'POST',
      operation: 'finishMePasskeyRegistration',
    },
  );

export default finishMePasskeyRegistration;
