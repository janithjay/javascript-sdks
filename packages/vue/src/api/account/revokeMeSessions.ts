// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  createHttpClientFetcher,
  revokeMeSessions as baseRevokeMeSessions,
  RevokeMeSessionsConfig as BaseRevokeMeSessionsConfig,
} from '@thunderid/browser';

/**
 * Configuration for the revokeMeSessions request (Vue-specific)
 */
export interface RevokeMeSessionsConfig extends Omit<BaseRevokeMeSessionsConfig, 'fetcher'> {
  /**
   * Optional custom fetcher function. If not provided, the ThunderID SPA client's httpClient will be used
   * which is a wrapper around axios http.request
   */
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  /**
   * Optional instance ID for multi-instance support. Defaults to 0.
   */
  instanceId?: number;
}

/**
 * Revokes the signed-in user's SSO sessions. Uses the ThunderID SPA client's httpClient by default,
 * which attaches the access token, but allows a custom fetcher.
 *
 * @param config - Configuration object with URL, `exceptCurrent` and optional request config.
 * @returns A promise that resolves once the sessions are revoked.
 * @example
 * ```typescript
 * await revokeMeSessions({
 *   baseUrl: "https://localhost:8090",
 *   exceptCurrent: true,
 * });
 * ```
 */
const revokeMeSessions = async ({fetcher, instanceId = 0, ...requestConfig}: RevokeMeSessionsConfig): Promise<void> =>
  baseRevokeMeSessions({
    ...requestConfig,
    fetcher: fetcher ?? createHttpClientFetcher(instanceId),
  });

export default revokeMeSessions;
