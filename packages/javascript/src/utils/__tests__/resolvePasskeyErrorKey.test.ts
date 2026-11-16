// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import ThunderIDRuntimeError from '../../errors/ThunderIDRuntimeError';
import resolvePasskeyErrorKey from '../resolvePasskeyErrorKey';

const FALLBACK = 'user.passkeys.error.add';

const apiError = (status: number, code?: string): ThunderIDAPIError =>
  new ThunderIDAPIError(
    code ? JSON.stringify({code, message: {defaultValue: 'x', key: 'x'}}) : 'failed',
    'op-ResponseError-001',
    'javascript',
    status,
  );

describe('resolvePasskeyErrorKey', (): void => {
  it.each([
    ['PSK-1016', 400, 'user.passkeys.error.name_too_long'],
    ['SPK-1002', 403, 'user.passkeys.error.delegated'],
    ['SPK-1003', 400, 'user.passkeys.error.relying_party'],
    ['PSK-1010', 404, 'user.passkeys.error.not_found'],
  ])('maps the server code %s to its own message', (code: string, status: number, key: string): void => {
    expect(resolvePasskeyErrorKey(apiError(status, code), FALLBACK)).toBe(key);
  });

  it('treats any other 403, such as a suspended account, as forbidden', (): void => {
    expect(resolvePasskeyErrorKey(apiError(403, 'AUTHN-1012'), FALLBACK)).toBe('user.passkeys.error.forbidden');
  });

  it('treats a 404 without a known code as not found', (): void => {
    expect(resolvePasskeyErrorKey(apiError(404), FALLBACK)).toBe('user.passkeys.error.not_found');
  });

  it.each([
    ['browser-webauthn-user-cancelled', 'user.passkeys.error.cancelled'],
    ['browser-webauthn-already-registered', 'user.passkeys.error.already_registered'],
    ['browser-webauthn-not-supported', 'user.passkeys.error.unsupported'],
  ])('maps the WebAuthn error %s to its own message', (code: string, key: string): void => {
    expect(resolvePasskeyErrorKey(new ThunderIDRuntimeError('x', code, 'browser'), FALLBACK)).toBe(key);
  });

  it('falls back for anything else', (): void => {
    expect(resolvePasskeyErrorKey(apiError(500), FALLBACK)).toBe(FALLBACK);
    expect(resolvePasskeyErrorKey(new ThunderIDRuntimeError('x', 'other', 'browser'), FALLBACK)).toBe(FALLBACK);
    expect(resolvePasskeyErrorKey(new Error('x'), FALLBACK)).toBe(FALLBACK);
  });
});
