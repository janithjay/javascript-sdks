// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, sort-keys, @typescript-eslint/explicit-function-return-type */

import {ThunderIDAPIError} from '@thunderid/node';
import {getQuery} from 'h3';
import {describe, it, expect, vi, beforeEach} from 'vitest';

import getSessionsHandler from '../../src/runtime/server/routes/auth/user/sessions.get';
import {verifyAndRehydrateSession} from '../../src/runtime/server/utils/serverSession';

// ── vi.hoisted ────────────────────────────────────────────────────────────────
const mockClientInstance = vi.hoisted(() => ({
  getUserSessions: vi.fn<(...args: any[]) => Promise<any>>(),
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

const sessionsPage = {
  count: 1,
  sessions: [{id: 'sso-session-1', isCurrent: true}],
  startIndex: 1,
  totalResults: 1,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/auth/user/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue({sessionId: 'session-1'} as any);
    vi.mocked(getQuery).mockReturnValue({});
  });

  it('rejects an invalid or missing session with 401 and never calls the upstream API', async () => {
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue(null as any);

    await expect((getSessionsHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 401});
    expect(mockClientInstance.getUserSessions).not.toHaveBeenCalled();
  });

  it('loads a page with the server-resolved session', async () => {
    vi.mocked(getQuery).mockReturnValue({limit: '10', offset: '0'});
    mockClientInstance.getUserSessions.mockResolvedValue(sessionsPage);

    const result = await (getSessionsHandler as any)(mockEvent);

    expect(mockClientInstance.getUserSessions).toHaveBeenCalledWith({limit: 10, offset: 0}, 'session-1');
    expect(result).toEqual({page: sessionsPage, success: true});
  });

  it('rejects malformed paging with 400 and never calls the upstream API', async () => {
    vi.mocked(getQuery).mockReturnValue({limit: 'ten'});

    await expect((getSessionsHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 400});
    expect(mockClientInstance.getUserSessions).not.toHaveBeenCalled();
  });

  it('carries the status of a failed upstream call in the body, not the upstream reply', async () => {
    mockClientInstance.getUserSessions.mockRejectedValue(
      new ThunderIDAPIError(
        '<html>403 from internal-proxy</html>',
        'getMeSessions-ResponseError-001',
        'javascript',
        403,
      ),
    );

    const result = await (getSessionsHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to load sessions (HTTP 403).', statusCode: 403, success: false});
  });
});
