// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, SSOSessionListResponse, SSOSessionQueryKeys, getMeSessions} from '@thunderid/browser';
import useManagementEndpoint, {ManagementEndpoint} from '../useManagementEndpoint';
import useResourceQuery, {ResourceQueryOptions, ResourceQueryResult} from '../useResourceQuery';

/**
 * Fetches a page of the signed-in user's live SSO sessions.
 *
 * @param params - Pagination parameters.
 * @param options - Query options, including a per-hook `fetcher`.
 * @returns The query state.
 *
 * @example
 * ```tsx
 * const {data, isLoading} = useGetMeSessions({limit: 10});
 * ```
 */
const useGetMeSessions = (
  {limit, offset}: Pick<ApiFilteringParams, 'limit' | 'offset'> = {},
  options?: ResourceQueryOptions,
): ResourceQueryResult<SSOSessionListResponse> => {
  const endpoint: ManagementEndpoint = useManagementEndpoint('sessionsMe');

  return useResourceQuery(
    [SSOSessionQueryKeys.ME_SESSIONS, {limit, offset}],
    (fetcher) => getMeSessions({...endpoint, fetcher, limit, offset}),
    options,
  );
};

export default useGetMeSessions;
