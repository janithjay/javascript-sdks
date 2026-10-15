// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {SSOSessionQueryKeys, revokeMeSession} from '@thunderid/browser';
import useManagementEndpoint, {ManagementEndpoint} from '../useManagementEndpoint';
import useResourceMutation, {ResourceMutationOptions, ResourceMutationResult} from '../useResourceMutation';

/**
 * Revokes one of the signed-in user's SSO sessions, then refetches any mounted session lists.
 *
 * @param options - Mutation options, including `onSuccess`, `onError`, and a per-hook `fetcher`.
 * @returns The mutation state. Call `mutate(sessionId)` to revoke.
 */
const useRevokeMeSession = (options?: ResourceMutationOptions<void, string>): ResourceMutationResult<void, string> => {
  const endpoint: ManagementEndpoint = useManagementEndpoint('usersMeSessions');

  return useResourceMutation(
    (sessionId: string, fetcher) => revokeMeSession({...endpoint, fetcher, sessionId}),
    () => [[SSOSessionQueryKeys.ME_SESSIONS]],
    options,
  );
};

export default useRevokeMeSession;
