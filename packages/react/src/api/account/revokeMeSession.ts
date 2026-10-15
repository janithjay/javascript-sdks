// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  createHttpClientFetcher,
  revokeMeSession as baseRevokeMeSession,
  RevokeMeSessionConfig as BaseRevokeMeSessionConfig,
} from '@thunderid/browser';

/**
 * Configuration for the revokeMeSession request.
 */
export interface RevokeMeSessionConfig extends Omit<BaseRevokeMeSessionConfig, 'fetcher'> {
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
 * Revokes one of the signed-in user's SSO sessions.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the session is revoked.
 *
 * @example
 * ```typescript
 * await revokeMeSession({baseUrl: 'https://localhost:8090', sessionId: '01a139ac-6fa8-7ce7-bb49-44a031306e8c'});
 * ```
 */
const revokeMeSession = async ({fetcher, instanceId = 0, ...requestConfig}: RevokeMeSessionConfig): Promise<void> =>
  baseRevokeMeSession({
    ...requestConfig,
    fetcher: fetcher ?? createHttpClientFetcher(instanceId),
  });

export default revokeMeSession;
