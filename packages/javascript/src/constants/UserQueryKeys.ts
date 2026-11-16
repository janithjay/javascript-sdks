// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Cache keys for user resources. The SDK's reactive wrappers use them to refetch after a mutation,
 * and an application can reuse them as keys in its own data fetching cache.
 */
const UserQueryKeys: {
  MY_PASSKEYS: 'my-passkeys';
  USER: 'user';
  USERS: 'users';
  USER_TYPES: 'user-types';
} = {
  MY_PASSKEYS: 'my-passkeys',
  USER: 'user',
  USERS: 'users',
  USER_TYPES: 'user-types',
};

export default UserQueryKeys;
