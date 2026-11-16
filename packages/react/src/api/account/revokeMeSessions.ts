// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  createHttpClientFetcher,
  revokeMeSessions as baseRevokeMeSessions,
  RevokeMeSessionsConfig as BaseRevokeMeSessionsConfig,
} from '@thunderid/browser';

/**
 * Configuration for the revokeMeSessions request.
 */
export interface RevokeMeSessionsConfig extends Omit<BaseRevokeMeSessionsConfig, 'fetcher'> {
  /**
   * Optional custom fetcher function. If not provided, the ThunderID SDK's default fetcher is used.
   */
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  /**
   * Optional instance ID for multi-instance support. Defaults to 0.
   */
  instanceId?: number;
}

/**
 * Revokes the signed-in user's SSO sessions. With `exceptCurrent`, the session that issued the
 * access token is kept, so the user stays signed in.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the sessions are revoked.
 *
 * @example
 * ```typescript
 * await revokeMeSessions({baseUrl: 'https://localhost:8090', exceptCurrent: true});
 * ```
 */
const revokeMeSessions = async ({fetcher, instanceId = 0, ...requestConfig}: RevokeMeSessionsConfig): Promise<void> =>
  baseRevokeMeSessions({
    ...requestConfig,
    fetcher: fetcher ?? createHttpClientFetcher(instanceId),
  });

export default revokeMeSessions;
