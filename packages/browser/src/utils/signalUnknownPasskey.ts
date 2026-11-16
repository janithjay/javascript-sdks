// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

type SignalUnknownCredential = (options: {credentialId: string; rpId: string}) => Promise<void>;

/**
 * Tells the user's passkey provider, such as a password manager, that a passkey was removed from the
 * account, so the provider can hide or delete its copy. Uses the WebAuthn Signal API
 * (`PublicKeyCredential.signalUnknownCredential`) where the browser supports it, and does nothing
 * otherwise. The provider's handling is best effort, so this never fails.
 *
 * @param rpId - The relying party ID the passkey was created for.
 * @param credentialId - The base64url-encoded ID of the removed passkey.
 */
const signalUnknownPasskey = async (rpId: string, credentialId: string): Promise<void> => {
  const signal: SignalUnknownCredential | undefined =
    typeof window !== 'undefined'
      ? (window.PublicKeyCredential as unknown as {signalUnknownCredential?: SignalUnknownCredential} | undefined)
          ?.signalUnknownCredential
      : undefined;

  if (typeof signal !== 'function') {
    return;
  }

  try {
    await signal.call(window.PublicKeyCredential, {credentialId, rpId});
  } catch {
    // The passkey is already gone from the account; the provider's copy is only a convenience.
  }
};

export default signalUnknownPasskey;
