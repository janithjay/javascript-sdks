// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, sort-keys, @typescript-eslint/explicit-function-return-type */

import {ThunderIDAPIError} from '@thunderid/node';
import {getRouterParam} from 'h3';
import {describe, it, expect, vi, beforeEach} from 'vitest';

import revokeSessionHandler from '../../src/runtime/server/routes/auth/user/session.delete';
import {verifyAndRehydrateSession} from '../../src/runtime/server/utils/serverSession';

// ── vi.hoisted ────────────────────────────────────────────────────────────────
const mockClientInstance = vi.hoisted(() => ({
  revokeUserSession: vi.fn<(...args: any[]) => Promise<any>>(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getRouterParam: vi.fn(),
  createError: vi.fn((opts: any) => Object.assign(new Error(opts.statusMessage), opts)),
}));

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn(() => ({thunderid: {sessionSecret: 'test-secret'}})),
}));

vi.mock('../../src/runtime/server/ThunderIDNuxtClient', () => ({
  default: {getInstance: () => mockClientInstance},
}));

vi.mock('../../src/runtime/server/utils/serverSession', () => ({
  verifyAndRehydrateSession: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockEvent = {};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DELETE /api/auth/user/sessions/:sessionId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue({sessionId: 'session-1'} as any);
    vi.mocked(getRouterParam).mockReturnValue('sso-session-1');
  });

  it('rejects an invalid or missing session with 401 and never calls the upstream API', async () => {
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue(null as any);

    await expect((revokeSessionHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 401});
    expect(mockClientInstance.revokeUserSession).not.toHaveBeenCalled();
  });

  it('revokes the session with the server-resolved session', async () => {
    mockClientInstance.revokeUserSession.mockResolvedValue(undefined);

    const result = await (revokeSessionHandler as any)(mockEvent);

    expect(getRouterParam).toHaveBeenCalledWith(mockEvent, 'sessionId', {decode: true});
    expect(mockClientInstance.revokeUserSession).toHaveBeenCalledWith('sso-session-1', 'session-1');
    expect(result).toEqual({success: true});
  });

  it('rejects a blank session identifier with 400', async () => {
    vi.mocked(getRouterParam).mockReturnValue('  ');

    await expect((revokeSessionHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 400});
    expect(mockClientInstance.revokeUserSession).not.toHaveBeenCalled();
  });

  it('carries a 404 in the body so the caller can tell the session is already gone', async () => {
    mockClientInstance.revokeUserSession.mockRejectedValue(
      new ThunderIDAPIError('Session not found', 'revokeMeSession-ResponseError-001', 'javascript', 404),
    );

    const result = await (revokeSessionHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to revoke the session (HTTP 404).', statusCode: 404, success: false});
  });
});
