// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../models/api';
import {SSOSessionListResponse} from '../../models/sso-session';
import requestManagementResource from '../../utils/requestManagementResource';

/**
 * Configuration for the getMeSessions request.
 */
export type GetMeSessionsConfig = ManagementRequestConfig & Pick<ApiFilteringParams, 'limit' | 'offset'>;

/**
 * Retrieves a page of the signed-in user's live SSO sessions, most recently active first. The
 * session that issued the access token has `isCurrent` set.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page of sessions.
 *
 * @example
 * ```typescript
 * const {sessions, totalResults} = await getMeSessions({
 *   baseUrl: 'https://localhost:8090',
 *   limit: 10,
 * });
 * ```
 */
const getMeSessions = async ({limit, offset, ...config}: GetMeSessionsConfig): Promise<SSOSessionListResponse> =>
  requestManagementResource<SSOSessionListResponse>(config, {
    collection: 'sessions/me',
    failureMessage: 'Failed to fetch sessions',
    method: 'GET',
    operation: 'getMeSessions',
    query: {limit, offset},
  });

export default getMeSessions;
