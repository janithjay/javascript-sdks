// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../models/api';
import {PasskeyListResponse} from '../../models/passkey';
import requestManagementResource from '../../utils/requestManagementResource';

/**
 * Configuration for the getMePasskeys request. `url` is the passkeys collection, which defaults to
 * `{baseUrl}/users/me/passkeys`.
 */
export type GetMePasskeysConfig = ManagementRequestConfig;

/**
 * Lists the signed-in user's passkeys at `GET /users/me/passkeys`. The list is not paged.
 *
 * @example
 * ```typescript
 * const {passkeys} = await getMePasskeys({baseUrl: 'https://localhost:8090', fetcher});
 * ```
 */
const getMePasskeys = async (config: GetMePasskeysConfig): Promise<PasskeyListResponse> =>
  requestManagementResource<PasskeyListResponse>(config, {
    collection: 'users/me/passkeys',
    failureMessage: 'Failed to list passkeys',
    method: 'GET',
    operation: 'getMePasskeys',
  });

export default getMePasskeys;
