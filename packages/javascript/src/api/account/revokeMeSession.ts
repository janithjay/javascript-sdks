// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../models/api';
import requestManagementResource from '../../utils/requestManagementResource';

/**
 * Configuration for the revokeMeSession request.
 */
export interface RevokeMeSessionConfig extends ManagementRequestConfig {
  /**
   * Identifier of the signed-in user's session to revoke.
   */
  sessionId: string;
}

/**
 * Revokes one of the signed-in user's SSO sessions. The session is signed out: the server revokes
 * the tokens its applications were issued and deletes it. Revoking the current session also ends
 * the access token this call was made with.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the session is revoked.
 *
 * @example
 * ```typescript
 * await revokeMeSession({
 *   baseUrl: 'https://localhost:8090',
 *   sessionId: '01a139ac-6fa8-7ce7-bb49-44a031306e8c',
 * });
 * ```
 */
const revokeMeSession = async ({sessionId, ...config}: RevokeMeSessionConfig): Promise<void> =>
  requestManagementResource<void>(config, {
    collection: 'users/me/sessions',
    failureMessage: 'Failed to revoke session',
    id: sessionId,
    method: 'DELETE',
    operation: 'revokeMeSession',
  });

export default revokeMeSession;
