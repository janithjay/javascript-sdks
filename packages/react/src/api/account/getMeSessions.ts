// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  SSOSessionListResponse,
  createHttpClientFetcher,
  getMeSessions as baseGetMeSessions,
  GetMeSessionsConfig as BaseGetMeSessionsConfig,
} from '@thunderid/browser';

/**
 * Configuration for the getMeSessions request.
 */
export interface GetMeSessionsConfig extends Omit<BaseGetMeSessionsConfig, 'fetcher'> {
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
 * Retrieves a page of the signed-in user's live SSO sessions. The session that issued the access
 * token has `isCurrent` set.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page of sessions.
 *
 * @example
 * ```typescript
 * const {sessions, totalResults} = await getMeSessions({baseUrl: 'https://localhost:8090', limit: 10});
 * ```
 */
const getMeSessions = async ({
  fetcher,
  instanceId = 0,
  ...requestConfig
}: GetMeSessionsConfig): Promise<SSOSessionListResponse> =>
  baseGetMeSessions({
    ...requestConfig,
    fetcher: fetcher ?? createHttpClientFetcher(instanceId),
  });

export default getMeSessions;
