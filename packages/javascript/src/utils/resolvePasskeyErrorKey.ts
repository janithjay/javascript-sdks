// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../errors/ThunderIDAPIError';
import ThunderIDError from '../errors/ThunderIDError';

/**
 * Translation keys for the failures a user can act on, keyed by the server error code or the
 * WebAuthn error code the SDK raises.
 */
const PASSKEY_ERROR_KEYS: Record<string, string> = {
  'PSK-1010': 'user.passkeys.error.not_found',
  'PSK-1016': 'user.passkeys.error.name_too_long',
  'SPK-1002': 'user.passkeys.error.delegated',
  'SPK-1003': 'user.passkeys.error.relying_party',
  'browser-webauthn-already-registered': 'user.passkeys.error.already_registered',
  'browser-webauthn-not-supported': 'user.passkeys.error.unsupported',
  'browser-webauthn-user-cancelled': 'user.passkeys.error.cancelled',
};

/**
 * Picks the translation key for a failed passkey list, add or remove. Server error codes and the
 * WebAuthn errors raised while the device creates the passkey get their own message; a `403`
 * without one of those codes, such as a suspended account, says the account cannot change its
 * passkeys; anything else falls back to `fallbackKey`.
 *
 * @param error - The error the operation raised.
 * @param fallbackKey - The key to use when the error has no message of its own.
 * @returns The translation key to show.
 */
const resolvePasskeyErrorKey = (error: unknown, fallbackKey: string): string => {
  if (error instanceof ThunderIDAPIError) {
    const serverCode: string | undefined = error.serverError?.code;

    if (serverCode && PASSKEY_ERROR_KEYS[serverCode]) {
      return PASSKEY_ERROR_KEYS[serverCode];
    }

    if (error.statusCode === 403) {
      return 'user.passkeys.error.forbidden';
    }

    if (error.statusCode === 404) {
      return 'user.passkeys.error.not_found';
    }

    return fallbackKey;
  }

  if (error instanceof ThunderIDError && PASSKEY_ERROR_KEYS[error.code]) {
    return PASSKEY_ERROR_KEYS[error.code];
  }

  return fallbackKey;
};

export default resolvePasskeyErrorKey;
