// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../models/api';
import requestManagementResource from '../../utils/requestManagementResource';

export interface DeleteMePasskeyConfig extends ManagementRequestConfig {
  /**
   * The ID of the passkey to remove.
   */
  passkeyId: string;
}

/**
 * Removes one of the signed-in user's passkeys at `DELETE /users/me/passkeys/{id}`.
 * `url` is the passkeys collection, which defaults to `{baseUrl}/users/me/passkeys`.
 *
 * @example
 * ```typescript
 * await deleteMePasskey({baseUrl: 'https://localhost:8090', fetcher, passkeyId});
 * ```
 */
const deleteMePasskey = async ({passkeyId, ...config}: DeleteMePasskeyConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'users/me/passkeys',
    failureMessage: 'Failed to remove the passkey',
    id: passkeyId,
    method: 'DELETE',
    operation: 'deleteMePasskey',
  });
};

export default deleteMePasskey;
