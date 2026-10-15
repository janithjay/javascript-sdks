// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../models/api';
import requestManagementResource from '../../utils/requestManagementResource';

/**
 * Configuration for the revokeMeSessions request.
 */
export interface RevokeMeSessionsConfig extends ManagementRequestConfig {
  /**
   * Keeps the session that issued the access token, so the caller stays signed in. The server
   * rejects the request when the access token does not identify a session.
   */
  exceptCurrent?: boolean;
}

/**
 * Revokes the signed-in user's SSO sessions. Without `exceptCurrent`, the current session is
 * revoked too, which ends the access token this call was made with.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the sessions are revoked.
 *
 * @example
 * ```typescript
 * // Revoke every other session.
 * await revokeMeSessions({
 *   baseUrl: 'https://localhost:8090',
 *   exceptCurrent: true,
 * });
 * ```
 */
const revokeMeSessions = async ({exceptCurrent, ...config}: RevokeMeSessionsConfig): Promise<void> =>
  requestManagementResource<void>(config, {
    collection: 'users/me/sessions',
    failureMessage: 'Failed to revoke sessions',
    method: 'DELETE',
    operation: 'revokeMeSessions',
    query: {exceptCurrent: exceptCurrent ? 'true' : undefined},
  });

export default revokeMeSessions;
