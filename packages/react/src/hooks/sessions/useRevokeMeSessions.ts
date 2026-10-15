// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {SSOSessionQueryKeys, revokeMeSessions} from '@thunderid/browser';
import useManagementEndpoint, {ManagementEndpoint} from '../useManagementEndpoint';
import useResourceMutation, {ResourceMutationOptions, ResourceMutationResult} from '../useResourceMutation';

/**
 * The variables `useRevokeMeSessions` is called with.
 */
export interface RevokeMeSessionsVariables {
  /**
   * Keeps the session that issued the access token, so the user stays signed in.
   */
  exceptCurrent?: boolean;
}

/**
 * Revokes the signed-in user's SSO sessions, then refetches any mounted session lists.
 *
 * @param options - Mutation options, including `onSuccess`, `onError`, and a per-hook `fetcher`.
 * @returns The mutation state. Call `mutate({exceptCurrent: true})` to revoke every other session.
 */
const useRevokeMeSessions = (
  options?: ResourceMutationOptions<void, RevokeMeSessionsVariables>,
): ResourceMutationResult<void, RevokeMeSessionsVariables> => {
  const endpoint: ManagementEndpoint = useManagementEndpoint('usersMeSessions');

  return useResourceMutation(
    ({exceptCurrent}: RevokeMeSessionsVariables, fetcher) => revokeMeSessions({...endpoint, exceptCurrent, fetcher}),
    () => [[SSOSessionQueryKeys.ME_SESSIONS]],
    options,
  );
};

export default useRevokeMeSessions;
