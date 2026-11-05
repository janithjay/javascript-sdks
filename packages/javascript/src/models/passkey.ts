// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * One of the signed-in user's passkeys.
 */
export interface Passkey {
  /**
   * The base64url-encoded credential ID.
   */
  id: string;
  /**
   * The name the user gave the passkey, if any. The server sets no default.
   */
  name?: string;
}

/**
 * The signed-in user's passkeys, as returned by `GET /users/me/passkeys`.
 */
export interface PasskeyListResponse {
  passkeys: Passkey[];
}

/**
 * What the server returns when adding a passkey starts.
 */
export interface PasskeyRegistrationStartResponse {
  /**
   * The WebAuthn `PublicKeyCredentialCreationOptions`, with binary fields base64url-encoded.
   */
  publicKeyCredentialCreationOptions: Record<string, unknown>;
  /**
   * The token to send back when finishing.
   */
  sessionToken: string;
}

/**
 * The credential the device created, with binary fields base64url-encoded.
 */
export interface PasskeyRegistrationCredential {
  id: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
  type: string;
}
