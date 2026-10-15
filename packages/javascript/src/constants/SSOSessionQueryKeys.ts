// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Cache keys for the signed-in user's SSO sessions. The SDK's reactive wrappers use them to refetch
 * after a session is revoked, and an application can reuse them as keys in its own data fetching cache.
 */
const SSOSessionQueryKeys: {
  ME_SESSIONS: 'me-sessions';
} = {
  ME_SESSIONS: 'me-sessions',
};

export default SSOSessionQueryKeys;
