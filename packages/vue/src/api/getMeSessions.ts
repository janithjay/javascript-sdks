// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  createHttpClientFetcher,
  getMeSessions as baseGetMeSessions,
  GetMeSessionsConfig as BaseGetMeSessionsConfig,
  SSOSessionListResponse,
} from '@thunderid/browser';

/**
 * Configuration for the getMeSessions request (Vue-specific)
 */
export interface GetMeSessionsConfig extends Omit<BaseGetMeSessionsConfig, 'fetcher'> {
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
 * Retrieves a page of the signed-in user's live SSO sessions. Uses the ThunderID SPA client's httpClient
 * by default, which attaches the access token, but allows a custom fetcher.
 *
 * @param config - Configuration object with URL, paging options and optional request config.
 * @returns A promise that resolves with the page of sessions.
 * @example
 * ```typescript
 * const page = await getMeSessions({
 *   baseUrl: "https://localhost:8090",
 *   limit: 10,
 * });
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
