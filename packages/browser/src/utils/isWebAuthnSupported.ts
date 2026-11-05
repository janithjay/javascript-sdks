// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Whether this browser can create passkeys through the Web Authentication API.
 *
 * @returns `true` when `PublicKeyCredential` and `navigator.credentials.create` are available.
 */
const isWebAuthnSupported = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.PublicKeyCredential !== 'undefined' &&
  typeof window.navigator?.credentials?.create === 'function';

export default isWebAuthnSupported;
