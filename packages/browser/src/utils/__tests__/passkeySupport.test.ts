// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, describe, expect, it, vi} from 'vitest';
import isWebAuthnSupported from '../isWebAuthnSupported';
import signalUnknownPasskey from '../signalUnknownPasskey';

const setPublicKeyCredential = (value: unknown): void => {
  Object.defineProperty(window, 'PublicKeyCredential', {configurable: true, value, writable: true});
};

describe('isWebAuthnSupported', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'PublicKeyCredential');
    Reflect.deleteProperty(navigator, 'credentials');
  });

  it('is true when the browser can create credentials', () => {
    setPublicKeyCredential({});
    Object.defineProperty(navigator, 'credentials', {configurable: true, value: {create: vi.fn()}});

    expect(isWebAuthnSupported()).toBe(true);
  });

  it('is false without PublicKeyCredential', () => {
    Object.defineProperty(navigator, 'credentials', {configurable: true, value: {create: vi.fn()}});

    expect(isWebAuthnSupported()).toBe(false);
  });
});

describe('signalUnknownPasskey', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'PublicKeyCredential');
  });

  it('signals the removed passkey to the provider', async () => {
    const signalUnknownCredential = vi.fn().mockResolvedValue(undefined);
    setPublicKeyCredential({signalUnknownCredential});

    await signalUnknownPasskey('example.com', 'cred-1');

    expect(signalUnknownCredential).toHaveBeenCalledWith({credentialId: 'cred-1', rpId: 'example.com'});
  });

  it('does nothing when the browser has no Signal API', async () => {
    setPublicKeyCredential({});

    await expect(signalUnknownPasskey('example.com', 'cred-1')).resolves.toBeUndefined();
  });

  it('swallows a rejected signal', async () => {
    setPublicKeyCredential({signalUnknownCredential: vi.fn().mockRejectedValue(new Error('denied'))});

    await expect(signalUnknownPasskey('example.com', 'cred-1')).resolves.toBeUndefined();
  });
});
