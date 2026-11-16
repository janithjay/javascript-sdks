// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, sort-keys, @typescript-eslint/explicit-function-return-type */

import {ThunderIDAPIError} from '@thunderid/node';
import {getQuery} from 'h3';
import {describe, it, expect, vi, beforeEach} from 'vitest';

import revokeSessionsHandler from '../../src/runtime/server/routes/auth/user/sessions.delete';
import {verifyAndRehydrateSession} from '../../src/runtime/server/utils/serverSession';

// ── vi.hoisted ────────────────────────────────────────────────────────────────
const mockClientInstance = vi.hoisted(() => ({
  revokeUserSessions: vi.fn<(...args: any[]) => Promise<any>>(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: vi.fn(),
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

describe('DELETE /api/auth/user/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue({sessionId: 'session-1'} as any);
    vi.mocked(getQuery).mockReturnValue({});
  });

  it('rejects an invalid or missing session with 401 and never calls the upstream API', async () => {
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue(null as any);

    await expect((revokeSessionsHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 401});
    expect(mockClientInstance.revokeUserSessions).not.toHaveBeenCalled();
  });

  it('revokes the other sessions with the server-resolved session', async () => {
    vi.mocked(getQuery).mockReturnValue({exceptCurrent: 'true'});
    mockClientInstance.revokeUserSessions.mockResolvedValue(undefined);

    const result = await (revokeSessionsHandler as any)(mockEvent);

    expect(mockClientInstance.revokeUserSessions).toHaveBeenCalledWith({exceptCurrent: true}, 'session-1');
    expect(result).toEqual({success: true});
  });

  it('rejects an exceptCurrent that is not true or false with 400', async () => {
    vi.mocked(getQuery).mockReturnValue({exceptCurrent: 'yes'});

    await expect((revokeSessionsHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 400});
    expect(mockClientInstance.revokeUserSessions).not.toHaveBeenCalled();
  });

  it('carries the status of a failed upstream call in the body, not the upstream reply', async () => {
    mockClientInstance.revokeUserSessions.mockRejectedValue(
      new ThunderIDAPIError(
        '<html>400 from internal-proxy</html>',
        'revokeMeSessions-ResponseError-001',
        'javascript',
        400,
      ),
    );

    const result = await (revokeSessionsHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to revoke sessions (HTTP 400).', statusCode: 400, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockClientInstance.revokeUserSessions.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await (revokeSessionsHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to revoke sessions.', success: false});
  });
});
